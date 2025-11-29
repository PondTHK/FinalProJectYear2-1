use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, post, put},
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_experience::{UserExperienceEntity, UserExperienceRequest},
        repo::user_experience::UserExperienceRepository,
        usecase::user_experience::UserExperienceUseCase,
        usecase::user_privacy_settings::UserPrivacySettingsUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::user_experience::UserExperiencePostgres,
            repositories::user_privacy_settings::UserPrivacySettingsPostgres,
        },
    },
};

/// Custom extractor for user_id from JWT claims
pub struct AuthenticatedUserId(pub Uuid);

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for AuthenticatedUserId
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<Uuid>()
            .copied()
            .map(AuthenticatedUserId)
            .ok_or(StatusCode::UNAUTHORIZED)
    }
}

/// Query parameters for identifying experience by composite key
#[derive(Debug, Deserialize)]
pub struct ExperienceKeyParams {
    pub company: String,
    pub start_date: chrono::NaiveDate,
}

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let user_experience_repository = UserExperiencePostgres::new(Arc::clone(&db_pool));
    let user_experience_use_case = Arc::new(UserExperienceUseCase::new(Arc::new(
        user_experience_repository,
    )));
    
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    Router::new()
        .route("/experiences", get(get_user_experiences))
        .route("/experiences", post(create_user_experience))
        .route("/experiences", put(upsert_user_experience))
        .route("/experiences/:company/:start_date", get(get_experience_by_key))
        .route("/experiences/:company/:start_date", delete(delete_experience))
        .route("/experiences/:user_id", get(get_experiences_by_user_id))
        .route("/experiences", delete(delete_all_user_experiences))
        .layer(middleware::from_fn(user_authorization))
        .with_state((user_experience_use_case, user_privacy_settings_use_case))
}

/// Get all experiences for current user
/// GET /api/user/experiences
pub async fn get_user_experiences<T, TPrivacy>(
    State((user_experience_use_case, _)): State<(Arc<UserExperienceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserExperienceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_experience_use_case.get_user_experiences(user_id).await {
        Ok(experiences) => (StatusCode::OK, Json(experiences)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get experiences by user_id (filtered by privacy settings)
/// GET /api/user/experiences/:user_id
pub async fn get_experiences_by_user_id<T, TPrivacy>(
    State((user_experience_use_case, privacy_settings_use_case)): State<(Arc<UserExperienceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserExperienceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Get privacy settings
    let privacy_settings = match privacy_settings_use_case.get_settings_by_user_id(user_id).await {
        Ok(Some(settings)) => settings,
        Ok(None) => {
            use crate::infrastructure::axum_http::routers::user_privacy_settings::get_default_privacy_settings;
            get_default_privacy_settings(user_id)
        }
        Err(_) => {
            use crate::infrastructure::axum_http::routers::user_privacy_settings::get_default_privacy_settings;
            get_default_privacy_settings(user_id)
        }
    };

    // Check if experiences are allowed to be shown
    if !privacy_settings.show_experiences {
        return (StatusCode::OK, Json::<Vec<UserExperienceEntity>>(vec![])).into_response();
    }

    match user_experience_use_case.get_user_experiences(user_id).await {
        Ok(experiences) => (StatusCode::OK, Json(experiences)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get specific experience by composite key
/// GET /api/user/experiences/:company/:start_date
pub async fn get_experience_by_key<T, TPrivacy>(
    State((user_experience_use_case, _)): State<(Arc<UserExperienceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path((company, start_date)): Path<(String, chrono::NaiveDate)>,
) -> impl IntoResponse
where
    T: UserExperienceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_experience_use_case
        .get_experience_by_key(user_id, &company, start_date)
        .await
    {
        Ok(Some(experience)) => (StatusCode::OK, Json(experience)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Experience not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create new experience
/// POST /api/user/experiences
pub async fn create_user_experience<T, TPrivacy>(
    State((user_experience_use_case, _)): State<(Arc<UserExperienceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(experience_request): Json<UserExperienceRequest>,
) -> impl IntoResponse
where
    T: UserExperienceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserExperience with user_id from JWT token
    let new_experience = experience_request.into_new_experience(user_id);

    match user_experience_use_case
        .create_experience(new_experience)
        .await
    {
        Ok(experience) => (StatusCode::CREATED, Json(experience)).into_response(),
        Err(e) => {
            if e.to_string().contains("already exists") {
                (StatusCode::CONFLICT, e.to_string()).into_response()
            } else if e.to_string().contains("cannot") {
                // Business rule violation
                (StatusCode::BAD_REQUEST, e.to_string()).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
        }
    }
}

/// Upsert experience (create if not exists, update if exists)
/// PUT /api/user/experiences
///
/// ⭐ แนะนำให้ Frontend ใช้ endpoint นี้ - สะดวกที่สุด!
/// จะตรวจสอบว่ามีประสบการณ์นี้อยู่แล้วหรือไม่ (ตาม company + start_date)
/// ถ้ามีอยู่แล้ว -> อัปเดต
/// ถ้าไม่มี -> สร้างใหม่
pub async fn upsert_user_experience<T, TPrivacy>(
    State((user_experience_use_case, _)): State<(Arc<UserExperienceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(experience_request): Json<UserExperienceRequest>,
) -> impl IntoResponse
where
    T: UserExperienceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_experience_use_case
        .upsert_experience(user_id, experience_request)
        .await
    {
        Ok(experience) => (StatusCode::OK, Json(experience)).into_response(),
        Err(e) => {
            if e.to_string().contains("cannot") {
                // Business rule violation
                (StatusCode::BAD_REQUEST, e.to_string()).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
        }
    }
}

/// Delete specific experience by composite key
/// DELETE /api/user/experiences/:company/:start_date
pub async fn delete_experience<T, TPrivacy>(
    State((user_experience_use_case, _)): State<(Arc<UserExperienceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path((company, start_date)): Path<(String, chrono::NaiveDate)>,
) -> impl IntoResponse
where
    T: UserExperienceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_experience_use_case
        .delete_experience(user_id, &company, start_date)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => {
            if e.to_string().contains("not found") {
                (StatusCode::NOT_FOUND, e.to_string()).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
        }
    }
}

/// Delete all experiences for current user
/// DELETE /api/user/experiences
/// Use with query parameter ?confirm=true to prevent accidental deletion
pub async fn delete_all_user_experiences<T, TPrivacy>(
    State((user_experience_use_case, _)): State<(Arc<UserExperienceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Query(params): Query<DeleteAllParams>,
) -> impl IntoResponse
where
    T: UserExperienceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    if !params.confirm {
        return (
            StatusCode::BAD_REQUEST,
            "Add ?confirm=true to confirm deletion of all experiences",
        )
            .into_response();
    }

    match user_experience_use_case
        .delete_all_user_experiences(user_id)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Query parameters for delete all endpoint
#[derive(Debug, Deserialize)]
pub struct DeleteAllParams {
    pub confirm: bool,
}

