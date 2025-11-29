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
        entities::user_education::{UserEducationEntity, UserEducationRequest},
        repo::user_education::UserEducationRepository,
        usecase::user_education::UserEducationUseCase,
        usecase::user_privacy_settings::UserPrivacySettingsUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::user_education::UserEducationPostgres,
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

/// Query parameters for identifying education by composite key
#[derive(Debug, Deserialize)]
pub struct EducationKeyParams {
    pub school: String,
    pub start_date: chrono::NaiveDate,
}

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let user_education_repository = UserEducationPostgres::new(Arc::clone(&db_pool));
    let user_education_use_case = Arc::new(UserEducationUseCase::new(Arc::new(
        user_education_repository,
    )));
    
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    Router::new()
        .route("/educations", get(get_user_educations))
        .route("/educations", post(create_user_education))
        .route("/educations", put(upsert_user_education))
        .route("/educations/:school/:start_date", get(get_education_by_key))
        .route("/educations/:school/:start_date", delete(delete_education))
        .route("/educations", delete(delete_all_user_educations))
        .route("/educations/:user_id", get(get_educations_by_user_id))
        .layer(middleware::from_fn(user_authorization))
        .with_state((user_education_use_case, user_privacy_settings_use_case))
}

/// Get all educations for current user
/// GET /api/user/educations
pub async fn get_user_educations<T, TPrivacy>(
    State((user_education_use_case, _)): State<(Arc<UserEducationUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserEducationRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_education_use_case.get_user_educations(user_id).await {
        Ok(educations) => (StatusCode::OK, Json(educations)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get educations by user_id (filtered by privacy settings)
/// GET /api/user/educations/:user_id
pub async fn get_educations_by_user_id<T, TPrivacy>(
    State((user_education_use_case, privacy_settings_use_case)): State<(Arc<UserEducationUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserEducationRepository + Send + Sync + 'static,
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

    // Check if educations are allowed to be shown
    if !privacy_settings.show_educations {
        return (StatusCode::OK, Json::<Vec<UserEducationEntity>>(vec![])).into_response();
    }

    match user_education_use_case.get_user_educations(user_id).await {
        Ok(educations) => (StatusCode::OK, Json(educations)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get specific education by composite key
/// GET /api/user/educations/:school/:start_date
pub async fn get_education_by_key<T, TPrivacy>(
    State((user_education_use_case, _)): State<(Arc<UserEducationUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path((school, start_date)): Path<(String, chrono::NaiveDate)>,
) -> impl IntoResponse
where
    T: UserEducationRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_education_use_case
        .get_education_by_key(user_id, &school, start_date)
        .await
    {
        Ok(Some(education)) => (StatusCode::OK, Json(education)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Education not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create new education
/// POST /api/user/educations
pub async fn create_user_education<T, TPrivacy>(
    State((user_education_use_case, _)): State<(Arc<UserEducationUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(education_request): Json<UserEducationRequest>,
) -> impl IntoResponse
where
    T: UserEducationRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserEducation with user_id from JWT token
    let new_education = education_request.into_new_education(user_id);

    match user_education_use_case
        .create_education(new_education)
        .await
    {
        Ok(education) => (StatusCode::CREATED, Json(education)).into_response(),
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

/// Upsert education (create if not exists, update if exists)
/// PUT /api/user/educations
///
/// ⭐ แนะนำให้ Frontend ใช้ endpoint นี้ - สะดวกที่สุด!
/// จะตรวจสอบว่ามีการศึกษานี้อยู่แล้วหรือไม่ (ตาม school + start_date)
/// ถ้ามีอยู่แล้ว -> อัปเดต
/// ถ้าไม่มี -> สร้างใหม่
pub async fn upsert_user_education<T, TPrivacy>(
    State((user_education_use_case, _)): State<(Arc<UserEducationUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(education_request): Json<UserEducationRequest>,
) -> impl IntoResponse
where
    T: UserEducationRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_education_use_case
        .upsert_education(user_id, education_request)
        .await
    {
        Ok(education) => (StatusCode::OK, Json(education)).into_response(),
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

/// Delete specific education by composite key
/// DELETE /api/user/educations/:school/:start_date
pub async fn delete_education<T, TPrivacy>(
    State((user_education_use_case, _)): State<(Arc<UserEducationUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path((school, start_date)): Path<(String, chrono::NaiveDate)>,
) -> impl IntoResponse
where
    T: UserEducationRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_education_use_case
        .delete_education(user_id, &school, start_date)
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

/// Delete all educations for current user
/// DELETE /api/user/educations
/// Use with query parameter ?confirm=true to prevent accidental deletion
pub async fn delete_all_user_educations<T, TPrivacy>(
    State((user_education_use_case, _)): State<(Arc<UserEducationUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Query(params): Query<DeleteAllParams>,
) -> impl IntoResponse
where
    T: UserEducationRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    if !params.confirm {
        return (
            StatusCode::BAD_REQUEST,
            "Add ?confirm=true to confirm deletion of all educations",
        )
            .into_response();
    }

    match user_education_use_case
        .delete_all_user_educations(user_id)
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
