use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{get, put},
};
use uuid::Uuid;

pub fn get_default_privacy_settings(user_id: Uuid) -> crate::domain::entities::user_privacy_settings::UserPrivacySettingsEntity {
    use crate::domain::entities::user_privacy_settings::NewUserPrivacySettings;
    let default = NewUserPrivacySettings::new(user_id);
    crate::domain::entities::user_privacy_settings::UserPrivacySettingsEntity {
        id: default.id,
        user_id: default.user_id,
        show_profile: default.show_profile,
        show_profile_image: default.show_profile_image,
        show_cover_image: default.show_cover_image,
        show_name: default.show_name,
        show_title: default.show_title,
        show_phone: default.show_phone,
        show_line_id: default.show_line_id,
        show_email: default.show_email,
        show_gender: default.show_gender,
        show_birth_date: default.show_birth_date,
        show_nationality: default.show_nationality,
        show_religion: default.show_religion,
        show_military_status: default.show_military_status,
        show_address: default.show_address,
        show_experiences: default.show_experiences,
        show_educations: default.show_educations,
        show_job_preference: default.show_job_preference,
        show_portfolios: default.show_portfolios,
        show_skills: default.show_skills,
        show_about_me: default.show_about_me,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    }
}

use crate::{
    domain::{
        entities::user_privacy_settings::UserPrivacySettingsRequest,
        repo::user_privacy_settings::UserPrivacySettingsRepository,
        usecase::user_privacy_settings::UserPrivacySettingsUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
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
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    // Protected routes (require authentication) - only for current user
    Router::new()
        .route("/privacy-settings", get(get_user_privacy_settings))
        .route("/privacy-settings", put(upsert_user_privacy_settings))
        .layer(middleware::from_fn(user_authorization))
        .with_state(user_privacy_settings_use_case)
}

/// Public routes (no authentication required)
pub fn public_routes(db_pool: Arc<DbPool>) -> Router {
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    Router::new()
        .route("/privacy-settings/:user_id", get(get_privacy_settings_by_user_id))
        .with_state(user_privacy_settings_use_case)
}

/// Get current user's privacy settings
/// GET /api/user/privacy-settings
pub async fn get_user_privacy_settings<T>(
    State(user_privacy_settings_use_case): State<Arc<UserPrivacySettingsUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_privacy_settings_use_case
        .get_settings_by_user_id(user_id)
        .await
    {
        Ok(Some(settings)) => (StatusCode::OK, Json(settings)).into_response(),
        Ok(None) => {
            // If no settings found, return default settings
            use crate::domain::entities::user_privacy_settings::NewUserPrivacySettings;
            let default_settings = NewUserPrivacySettings::new(user_id);
            let default_entity = crate::domain::entities::user_privacy_settings::UserPrivacySettingsEntity {
                id: default_settings.id,
                user_id: default_settings.user_id,
                show_profile: default_settings.show_profile,
                show_profile_image: default_settings.show_profile_image,
                show_cover_image: default_settings.show_cover_image,
                show_name: default_settings.show_name,
                show_title: default_settings.show_title,
                show_phone: default_settings.show_phone,
                show_line_id: default_settings.show_line_id,
                show_email: default_settings.show_email,
                show_gender: default_settings.show_gender,
                show_birth_date: default_settings.show_birth_date,
                show_nationality: default_settings.show_nationality,
                show_religion: default_settings.show_religion,
                show_military_status: default_settings.show_military_status,
                show_address: default_settings.show_address,
                show_experiences: default_settings.show_experiences,
                show_educations: default_settings.show_educations,
                show_job_preference: default_settings.show_job_preference,
                show_portfolios: default_settings.show_portfolios,
                show_skills: default_settings.show_skills,
                show_about_me: default_settings.show_about_me,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            };
            (StatusCode::OK, Json(default_entity)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get privacy settings by user_id (public endpoint for viewing other users' profiles)
/// GET /api/user/privacy-settings/:user_id
pub async fn get_privacy_settings_by_user_id<T>(
    State(user_privacy_settings_use_case): State<Arc<UserPrivacySettingsUseCase<T>>>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_privacy_settings_use_case
        .get_settings_by_user_id(user_id)
        .await
    {
        Ok(Some(settings)) => (StatusCode::OK, Json(settings)).into_response(),
        Ok(None) => {
            // If no settings found, return default settings (all public)
            use crate::domain::entities::user_privacy_settings::NewUserPrivacySettings;
            let default_settings = NewUserPrivacySettings::new(user_id);
            let default_entity = crate::domain::entities::user_privacy_settings::UserPrivacySettingsEntity {
                id: default_settings.id,
                user_id: default_settings.user_id,
                show_profile: default_settings.show_profile,
                show_profile_image: default_settings.show_profile_image,
                show_cover_image: default_settings.show_cover_image,
                show_name: default_settings.show_name,
                show_title: default_settings.show_title,
                show_phone: default_settings.show_phone,
                show_line_id: default_settings.show_line_id,
                show_email: default_settings.show_email,
                show_gender: default_settings.show_gender,
                show_birth_date: default_settings.show_birth_date,
                show_nationality: default_settings.show_nationality,
                show_religion: default_settings.show_religion,
                show_military_status: default_settings.show_military_status,
                show_address: default_settings.show_address,
                show_experiences: default_settings.show_experiences,
                show_educations: default_settings.show_educations,
                show_job_preference: default_settings.show_job_preference,
                show_portfolios: default_settings.show_portfolios,
                show_skills: default_settings.show_skills,
                show_about_me: default_settings.show_about_me,
                created_at: chrono::Utc::now(),
                updated_at: chrono::Utc::now(),
            };
            (StatusCode::OK, Json(default_entity)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Upsert user's privacy settings (create if not exists, update if exists)
/// PUT /api/user/privacy-settings
pub async fn upsert_user_privacy_settings<T>(
    State(user_privacy_settings_use_case): State<Arc<UserPrivacySettingsUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(settings_request): Json<UserPrivacySettingsRequest>,
) -> impl IntoResponse
where
    T: UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserPrivacySettings with user_id from JWT token
    let settings_data = settings_request.into_new_settings(user_id);

    match user_privacy_settings_use_case
        .upsert_settings(user_id, settings_data)
        .await
    {
        Ok(settings) => (StatusCode::OK, Json(settings)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

