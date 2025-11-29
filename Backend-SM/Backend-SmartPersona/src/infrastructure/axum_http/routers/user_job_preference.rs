use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, patch, post, put},
};
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_job_preference::UserJobPreferenceRequest,
        repo::user_job_preference::UserJobPreferenceRepository,
        usecase::user_job_preference::UserJobPreferenceUseCase,
        usecase::user_privacy_settings::UserPrivacySettingsUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::user_job_preference::UserJobPreferencePostgres,
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

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let user_job_preference_repository = UserJobPreferencePostgres::new(Arc::clone(&db_pool));
    let user_job_preference_use_case = Arc::new(UserJobPreferenceUseCase::new(Arc::new(
        user_job_preference_repository,
    )));
    
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    Router::new()
        .route("/job-preference", get(get_user_job_preference))
        .route("/job-preferences", get(get_all_user_job_preferences))
        .route("/job-preference", post(create_user_job_preference))
        .route("/job-preference", patch(update_user_job_preference))
        .route("/job-preference", put(upsert_user_job_preference))
        .route("/job-preference", delete(delete_user_job_preference))
        .route("/job-preference/:id", delete(delete_user_job_preference_by_id))
        .route("/job-preferences/user/:user_id", get(get_job_preference_by_user_id))
        .layer(middleware::from_fn(user_authorization))
        .with_state((user_job_preference_use_case, user_privacy_settings_use_case))
}

/// Get current user's job preference (first one, for backward compatibility)
/// GET /api/user/job-preference
pub async fn get_user_job_preference<T, TPrivacy>(
    State((user_job_preference_use_case, _)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_job_preference_use_case
        .get_preference_by_user_id(user_id)
        .await
    {
        Ok(Some(preference)) => (StatusCode::OK, Json(preference)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Job preference not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get all job preferences for current user
/// GET /api/user/job-preferences
pub async fn get_all_user_job_preferences<T, TPrivacy>(
    State((user_job_preference_use_case, _)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_job_preference_use_case
        .get_all_preferences_by_user_id(user_id)
        .await
    {
        Ok(preferences) => (StatusCode::OK, Json(preferences)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get job preference by user_id (filtered by privacy settings)
/// GET /api/user/job-preferences/user/:user_id
pub async fn get_job_preference_by_user_id<T, TPrivacy>(
    State((user_job_preference_use_case, privacy_settings_use_case)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
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

    // Check if job preference is allowed to be shown
    if !privacy_settings.show_job_preference {
        return (StatusCode::NOT_FOUND, "Job preference not found").into_response();
    }

    match user_job_preference_use_case
        .get_all_preferences_by_user_id(user_id)
        .await
    {
        Ok(preferences) => (StatusCode::OK, Json(preferences)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create a new user job preference
/// POST /api/user/job-preference
pub async fn create_user_job_preference<T, TPrivacy>(
    State((user_job_preference_use_case, _)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(preference_request): Json<UserJobPreferenceRequest>,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserJobPreference with user_id from JWT token
    let new_preference = preference_request.into_new_preference(user_id);

    // Allow multiple preferences per user, so no conflict check needed
    match user_job_preference_use_case
        .create_preference(new_preference)
        .await
    {
        Ok(preference) => (StatusCode::CREATED, Json(preference)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Update current user's job preference
/// PATCH /api/user/job-preference
pub async fn update_user_job_preference<T, TPrivacy>(
    State((user_job_preference_use_case, _)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(preference_request): Json<UserJobPreferenceRequest>,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Check if preference exists before updating
    match user_job_preference_use_case
        .get_preference_by_user_id(user_id)
        .await
    {
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                "Job preference not found. Use POST to create.",
            )
                .into_response();
        }
        Ok(Some(_)) => {} // Continue with update
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    // Convert request to UpdateUserJobPreference
    let update_data = preference_request.into_update_preference();

    match user_job_preference_use_case
        .update_preference(user_id, update_data)
        .await
    {
        Ok(preference) => (StatusCode::OK, Json(preference)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Upsert user's job preference (create if not exists, update if exists)
/// PUT /api/user/job-preference
///
/// ⭐ แนะนำให้ Frontend ใช้ endpoint นี้ - สะดวกที่สุด!
pub async fn upsert_user_job_preference<T, TPrivacy>(
    State((user_job_preference_use_case, _)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(preference_request): Json<UserJobPreferenceRequest>,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserJobPreference with user_id from JWT token
    let preference_data = preference_request.into_new_preference(user_id);

    match user_job_preference_use_case
        .upsert_preference(user_id, preference_data)
        .await
    {
        Ok(preference) => (StatusCode::OK, Json(preference)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Delete current user's job preference
/// DELETE /api/user/job-preference
pub async fn delete_user_job_preference<T, TPrivacy>(
    State((user_job_preference_use_case, _)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_job_preference_use_case
        .delete_preference(user_id)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Delete job preference by id
/// DELETE /api/user/job-preference/:id
pub async fn delete_user_job_preference_by_id<T, TPrivacy>(
    State((user_job_preference_use_case, _)): State<(Arc<UserJobPreferenceUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserJobPreferenceRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Verify that the preference belongs to the current user
    match user_job_preference_use_case
        .get_all_preferences_by_user_id(user_id)
        .await
    {
        Ok(preferences) => {
            if !preferences.iter().any(|p| p.id == id) {
                return (StatusCode::NOT_FOUND, "Job preference not found or access denied").into_response();
            }
        }
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    match user_job_preference_use_case
        .delete_preference_by_id(id)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
