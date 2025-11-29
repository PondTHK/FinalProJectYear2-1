use std::sync::Arc;

use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{get, post},
};
use axum::async_trait;
use axum::extract::FromRequestParts;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_profile::{NewUserProfile, UpdateUserProfile},
        repo::user::UserRepository,
        usecase::user::UserUseCase,
        value_object::user::RegisterUserModel,
    },
    infrastructure::axum_http::middleware::user_authorization,
    infrastructure::postgres::{postgres_connection::DbPool, repositories::user::UserPostgres},
};

/// Custom extractor for user_id from JWT claims
pub struct AuthenticatedUserId(pub Uuid);

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUserId
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
    let user_repository = UserPostgres::new(Arc::clone(&db_pool));
    let user_use_case = Arc::new(UserUseCase::new(Arc::new(user_repository)));

    Router::new()
        .route("/register", post(register))
        .route(
            "/info",
            get(get_user_info).layer(middleware::from_fn(user_authorization)),
        )
        .with_state(user_use_case)
}

pub async fn register<T>(
    State(user_use_case): State<Arc<UserUseCase<T>>>,
    Json(register_user_model): Json<RegisterUserModel>,
) -> impl IntoResponse
where
    T: UserRepository + Send + Sync,
{
    match user_use_case.register(register_user_model).await {
        Ok(user_id) => (
            StatusCode::CREATED,
            format!("Register user id: {} successfully", user_id),
        )
            .into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_profile<T>(State(_user_use_case): State<Arc<UserUseCase<T>>>) -> impl IntoResponse
where
    T: UserRepository + Send + Sync,
{
    (StatusCode::OK, "Profile endpoint - authenticated access").into_response()
}

/// Get current user info including role
/// GET /api/user/info
pub async fn get_user_info<T>(
    State(user_use_case): State<Arc<UserUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserRepository + Send + Sync,
{
    match user_use_case.get_user_by_id(user_id).await {
        Ok(user) => {
            // Return only safe user info (without password_hash)
            #[derive(serde::Serialize)]
            struct UserInfo {
                id: uuid::Uuid,
                username: String,
                display_name: Option<String>,
                role: String, // Convert Role enum to string
            }
            
            use crate::domain::entities::user::Role;
            let role_str = match user.role {
                Role::PersonaUser => "PersonaUser",
                Role::CompanyUser => "CompanyUser",
                Role::Admin => "Admin",
            };
            
            let user_info = UserInfo {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                role: role_str.to_string(),
            };
            
            (StatusCode::OK, Json(user_info)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
