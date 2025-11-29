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
        entities::user_profile::UserProfileRequest, repo::user_profile::UserProfileRepository,
        repo::user::UserRepository,
        usecase::user_profile::UserProfileUseCase,
        usecase::user_privacy_settings::UserPrivacySettingsUseCase,
        usecase::user::UserUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        jwt_authentication::jwt_model::{Claims, Roles},
        postgres::{
            postgres_connection::DbPool,
            repositories::user_profile::UserProfilePostgres,
            repositories::user_privacy_settings::UserPrivacySettingsPostgres,
            repositories::user::UserPostgres,
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

/// Custom extractor for Claims from JWT (optional - for checking admin role)
pub struct OptionalClaims(pub Option<Claims>);

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for OptionalClaims
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let claims = parts.extensions.get::<Claims>().cloned();
        Ok(OptionalClaims(claims))
    }
}

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let user_profile_repository = UserProfilePostgres::new(Arc::clone(&db_pool));
    let user_profile_use_case =
        Arc::new(UserProfileUseCase::new(Arc::new(user_profile_repository)));
    
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    let user_repository = UserPostgres::new(Arc::clone(&db_pool));
    let user_use_case = Arc::new(UserUseCase::new(Arc::new(user_repository)));

    Router::new()
        .route("/profile", get(get_user_profile))
        .route("/profile", post(create_user_profile))
        .route("/profile", put(upsert_user_profile))
        .route("/profile/:user_id", get(get_profile_by_user_id))
        .route("/profile", patch(update_user_profile))
        .route("/profile", delete(delete_user_profile))
        .layer(middleware::from_fn(user_authorization))
        .with_state((user_profile_use_case, user_privacy_settings_use_case, user_use_case))
}

/// Get current user's profile
/// GET /api/user/profile
pub async fn get_user_profile<T, TPrivacy, TUser>(
    State((user_profile_use_case, _, _)): State<(Arc<UserProfileUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>, Arc<UserUseCase<TUser>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserProfileRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
    TUser: UserRepository + Send + Sync + 'static,
{
    match user_profile_use_case.get_profile_by_user_id(user_id).await {
        Ok(Some(profile)) => (StatusCode::OK, Json(profile)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Profile not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create a new user profile
/// POST /api/user/profile
pub async fn create_user_profile<T, TPrivacy, TUser>(
    State((user_profile_use_case, _, _)): State<(Arc<UserProfileUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>, Arc<UserUseCase<TUser>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(profile_request): Json<UserProfileRequest>,
) -> impl IntoResponse
where
    T: UserProfileRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
    TUser: UserRepository + Send + Sync + 'static,
{
    // Convert request to NewUserProfile with user_id from JWT token
    let new_profile = profile_request.into_new_profile(user_id);

    // Check if profile already exists
    match user_profile_use_case.get_profile_by_user_id(user_id).await {
        Ok(Some(_)) => return (StatusCode::CONFLICT, "Profile already exists").into_response(),
        Ok(None) => {} // Continue with creation
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    match user_profile_use_case.create_profile(new_profile).await {
        Ok(profile) => (StatusCode::CREATED, Json(profile)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Upsert user's profile (create if not exists, update if exists)
/// PUT /api/user/profile
///
/// ⭐ แนะนำให้ Frontend ใช้ endpoint นี้ - สะดวกที่สุด!
pub async fn upsert_user_profile<T, TPrivacy, TUser>(
    State((user_profile_use_case, _, _)): State<(Arc<UserProfileUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>, Arc<UserUseCase<TUser>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(profile_request): Json<UserProfileRequest>,
) -> impl IntoResponse
where
    T: UserProfileRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
    TUser: UserRepository + Send + Sync + 'static,
{
    // Convert request to NewUserProfile with user_id from JWT token
    let profile_data = profile_request.into_new_profile(user_id);

    match user_profile_use_case
        .upsert_profile(user_id, profile_data)
        .await
    {
        Ok(profile) => (StatusCode::OK, Json(profile)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get profile by user_id (filtered by privacy settings)
/// GET /api/user/profile/:user_id
/// Admin users can bypass privacy settings
pub async fn get_profile_by_user_id<T, TPrivacy, TUser>(
    State((user_profile_use_case, privacy_settings_use_case, user_use_case)): State<(Arc<UserProfileUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>, Arc<UserUseCase<TUser>>)>,
    Path(user_id): Path<Uuid>,
    OptionalClaims(claims_opt): OptionalClaims,
) -> impl IntoResponse
where
    T: UserProfileRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
    TUser: UserRepository + Send + Sync + 'static,
{
    // Check if the requester is an admin
    let mut is_admin = claims_opt
        .as_ref()
        .map(|claims| claims.role == Roles::Admin || claims.role == Roles::UserAndCompany)
        .unwrap_or(false);

    // Check if the requester is a CompanyUser
    let mut is_company_user = false;
    if let Some(claims) = &claims_opt {
        if let Ok(requester_id) = Uuid::parse_str(&claims.sub) {
            match user_use_case.get_user_by_id(requester_id).await {
                Ok(user) => {
                    tracing::info!("Requester found in DB: id={}, role={:?}", user.id, user.role);
                    if user.role == crate::domain::entities::user::Role::CompanyUser {
                        is_company_user = true;
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to fetch requester user info: {}", e);
                }
            }
        } else {
            tracing::warn!("Failed to parse requester ID from claims: {}", claims.sub);
        }
    }

    // Log for debugging
    tracing::info!(
        "get_profile_by_user_id: user_id={}, is_admin={}, is_company_user={}, has_claims={}, claims_role={:?}",
        user_id,
        is_admin,
        is_company_user,
        claims_opt.is_some(),
        claims_opt.as_ref().map(|c| &c.role)
    );

    // Get profile first to check if it exists
    let profile_result = user_profile_use_case.get_profile_by_user_id(user_id).await;
    
    match profile_result {
        Ok(None) => {
            // Check if user exists to provide a better error message
            match user_use_case.get_user_by_id(user_id).await {
                Ok(_) => {
                    tracing::warn!("Profile not found in database for user_id={}, but user exists", user_id);
                    return (StatusCode::NOT_FOUND, "Profile not found. User exists but has not created a profile yet.").into_response();
                }
                Err(_) => {
                    tracing::warn!("Profile not found in database for user_id={}, user also does not exist", user_id);
                    return (StatusCode::NOT_FOUND, "Profile not found").into_response();
                }
            }
        }
        Err(e) => {
            tracing::error!("Error fetching profile for user_id={}: {}", user_id, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
        Ok(Some(mut profile)) => {
            // If admin or company user, return full profile without filtering
            if is_admin || is_company_user {
                tracing::info!("Returning full profile for privileged user (admin/company), user_id={}", user_id);
                return (StatusCode::OK, Json(profile)).into_response();
            }

            // For non-admin users, check privacy settings
            let privacy_settings = match privacy_settings_use_case.get_settings_by_user_id(user_id).await {
                Ok(Some(settings)) => settings,
                Ok(None) => {
                    // If no settings found, default to PRIVATE (show_profile: false) for security
                    // Users must explicitly enable public profile
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
                    // This ensures profiles are not accidentally exposed
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

            // Check if profile is public
            if !privacy_settings.show_profile {
                tracing::info!("Profile is private and requester is not admin, user_id={}", user_id);
                return (StatusCode::NOT_FOUND, "Profile not found").into_response();
            }

            // Filter profile data based on privacy settings
            use crate::domain::entities::user_profile::UserProfileEntity;
            
            // Filter fields based on privacy settings
            if !privacy_settings.show_profile_image {
                profile.profile_image_url = None;
            }
            if !privacy_settings.show_cover_image {
                profile.cover_image_url = None;
            }
            if !privacy_settings.show_name {
                profile.first_name_th = None;
                profile.last_name_th = None;
                profile.first_name_en = None;
                profile.last_name_en = None;
            }
            if !privacy_settings.show_title {
                profile.title = None;
            }
            if !privacy_settings.show_phone {
                profile.phone = None;
            }
            if !privacy_settings.show_line_id {
                profile.line_id = None;
            }
            if !privacy_settings.show_gender {
                profile.gender = None;
            }
            if !privacy_settings.show_birth_date {
                profile.birth_date = None;
            }
            if !privacy_settings.show_nationality {
                profile.nationality = None;
            }
            if !privacy_settings.show_religion {
                profile.religion = None;
            }
            if !privacy_settings.show_military_status {
                profile.military_status = None;
            }

            tracing::info!("Returning filtered profile for non-admin user, user_id={}", user_id);
            (StatusCode::OK, Json(profile)).into_response()
        }
    }
}

/// Update current user's profile
/// PATCH /api/user/profile
pub async fn update_user_profile<T, TPrivacy, TUser>(
    State((user_profile_use_case, _, _)): State<(Arc<UserProfileUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>, Arc<UserUseCase<TUser>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(profile_request): Json<UserProfileRequest>,
) -> impl IntoResponse
where
    T: UserProfileRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
    TUser: UserRepository + Send + Sync + 'static,
{
    // Check if profile exists before updating
    match user_profile_use_case.get_profile_by_user_id(user_id).await {
        Ok(None) => return (StatusCode::NOT_FOUND, "Profile not found").into_response(),
        Ok(Some(_)) => {} // Continue with update
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    // Convert request to UpdateUserProfile
    let update_data = profile_request.into_update_profile();

    match user_profile_use_case
        .update_profile(user_id, update_data)
        .await
    {
        Ok(profile) => (StatusCode::OK, Json(profile)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Delete current user's profile
/// DELETE /api/user/profile
pub async fn delete_user_profile<T, TPrivacy, TUser>(
    State((user_profile_use_case, _, _)): State<(Arc<UserProfileUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>, Arc<UserUseCase<TUser>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserProfileRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
    TUser: UserRepository + Send + Sync + 'static,
{
    match user_profile_use_case.delete_profile(user_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
