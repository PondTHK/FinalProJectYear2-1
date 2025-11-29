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
        entities::user_address::UserAddressRequest, repo::user_address::UserAddressRepository,
        usecase::user_address::UserAddressUseCase,
        usecase::user_privacy_settings::UserPrivacySettingsUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::user_address::UserAddressPostgres,
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
    let user_address_repository = UserAddressPostgres::new(Arc::clone(&db_pool));
    let user_address_use_case =
        Arc::new(UserAddressUseCase::new(Arc::new(user_address_repository)));
    
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    Router::new()
        .route("/address", get(get_user_address))
        .route("/address", post(create_user_address))
        .route("/address", patch(update_user_address))
        .route("/address", put(upsert_user_address))
        .route("/address", delete(delete_user_address))
        .route("/address/:user_id", get(get_address_by_user_id))
        .layer(middleware::from_fn(user_authorization))
        .with_state((user_address_use_case, user_privacy_settings_use_case))
}

/// Get current user's address
/// GET /api/user/address
pub async fn get_user_address<T, TPrivacy>(
    State((user_address_use_case, _)): State<(Arc<UserAddressUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserAddressRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_address_use_case.get_address_by_user_id(user_id).await {
        Ok(Some(address)) => (StatusCode::OK, Json(address)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Address not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get address by user_id (filtered by privacy settings)
/// GET /api/user/address/:user_id
pub async fn get_address_by_user_id<T, TPrivacy>(
    State((user_address_use_case, privacy_settings_use_case)): State<(Arc<UserAddressUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserAddressRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Get privacy settings
    let privacy_settings = match privacy_settings_use_case.get_settings_by_user_id(user_id).await {
        Ok(Some(settings)) => settings,
        Ok(None) => {
            // If no settings found, default to PRIVATE (show_profile: false) for security
            use crate::domain::entities::user_privacy_settings::NewUserPrivacySettings;
            let default = NewUserPrivacySettings::new(user_id);
            crate::domain::entities::user_privacy_settings::UserPrivacySettingsEntity {
                id: default.id,
                user_id: default.user_id,
                show_profile: false, // Default to private for security
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
        Err(_) => {
            // If error getting settings, default to PRIVATE (show_profile: false) for security
            use crate::domain::entities::user_privacy_settings::NewUserPrivacySettings;
            let default = NewUserPrivacySettings::new(user_id);
            crate::domain::entities::user_privacy_settings::UserPrivacySettingsEntity {
                id: default.id,
                user_id: default.user_id,
                show_profile: false, // Default to private for security
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
    };

    // Check if profile is public first
    if !privacy_settings.show_profile {
        return (StatusCode::NOT_FOUND, "Address not found").into_response();
    }

    // Check if address is allowed to be shown
    if !privacy_settings.show_address {
        return (StatusCode::NOT_FOUND, "Address not found").into_response();
    }

    match user_address_use_case.get_address_by_user_id(user_id).await {
        Ok(Some(address)) => (StatusCode::OK, Json(address)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Address not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create a new user address
/// POST /api/user/address
pub async fn create_user_address<T, TPrivacy>(
    State((user_address_use_case, _)): State<(Arc<UserAddressUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(address_request): Json<UserAddressRequest>,
) -> impl IntoResponse
where
    T: UserAddressRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserAddress with user_id from JWT token
    let new_address = address_request.into_new_address(user_id);

    // Check if address already exists
    match user_address_use_case.get_address_by_user_id(user_id).await {
        Ok(Some(_)) => {
            return (
                StatusCode::CONFLICT,
                "Address already exists. Use PUT to update.",
            )
                .into_response();
        }
        Ok(None) => {} // Continue with creation
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    match user_address_use_case.create_address(new_address).await {
        Ok(address) => (StatusCode::CREATED, Json(address)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Update current user's address
/// PATCH /api/user/address
pub async fn update_user_address<T, TPrivacy>(
    State((user_address_use_case, _)): State<(Arc<UserAddressUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(address_request): Json<UserAddressRequest>,
) -> impl IntoResponse
where
    T: UserAddressRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Check if address exists before updating
    match user_address_use_case.get_address_by_user_id(user_id).await {
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                "Address not found. Use POST to create.",
            )
                .into_response();
        }
        Ok(Some(_)) => {} // Continue with update
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    // Convert request to UpdateUserAddress
    let update_data = address_request.into_update_address();

    match user_address_use_case
        .update_address(user_id, update_data)
        .await
    {
        Ok(address) => (StatusCode::OK, Json(address)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Upsert user's address (create if not exists, update if exists)
/// PUT /api/user/address
///
/// ⭐ แนะนำให้ Frontend ใช้ endpoint นี้ - สะดวกที่สุด!
pub async fn upsert_user_address<T, TPrivacy>(
    State((user_address_use_case, _)): State<(Arc<UserAddressUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(address_request): Json<UserAddressRequest>,
) -> impl IntoResponse
where
    T: UserAddressRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserAddress with user_id from JWT token
    let address_data = address_request.into_new_address(user_id);

    match user_address_use_case
        .upsert_address(user_id, address_data)
        .await
    {
        Ok(address) => (StatusCode::OK, Json(address)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Delete current user's address
/// DELETE /api/user/address
pub async fn delete_user_address<T, TPrivacy>(
    State((user_address_use_case, _)): State<(Arc<UserAddressUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserAddressRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_address_use_case.delete_address(user_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
