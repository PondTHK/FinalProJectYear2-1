use std::sync::Arc;

use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, put},
};
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_skill::{UserSkillEntity, UserSkillRequest},
        repo::user_skill::UserSkillRepository,
        usecase::user_skill::UserSkillUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::user_skill::UserSkillPostgres,
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
    let user_skill_repository = UserSkillPostgres::new(Arc::clone(&db_pool));
    let user_skill_use_case = Arc::new(UserSkillUseCase::new(Arc::new(
        user_skill_repository,
    )));

    Router::new()
        .route("/skills", get(get_user_skills))
        .route("/skills", put(upsert_user_skills))
        .route("/skills", delete(delete_user_skills))
        .layer(middleware::from_fn(user_authorization))
        .with_state(user_skill_use_case)
}

/// Get skills for current user
/// GET /api/user/skills
pub async fn get_user_skills<T>(
    State(user_skill_use_case): State<Arc<UserSkillUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserSkillRepository + Send + Sync + 'static,
{
    match user_skill_use_case.get_user_skills(user_id).await {
        Ok(Some(skills)) => (StatusCode::OK, Json(skills)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({
            "error": "Skills not found",
            "message": "User has not set any skills yet"
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create or update skills (upsert)
/// PUT /api/user/skills
pub async fn upsert_user_skills<T>(
    State(user_skill_use_case): State<Arc<UserSkillUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(skill_request): Json<UserSkillRequest>,
) -> impl IntoResponse
where
    T: UserSkillRepository + Send + Sync + 'static,
{
    match user_skill_use_case.upsert_skills(user_id, skill_request).await {
        Ok(skills) => (StatusCode::OK, Json(skills)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Delete skills for current user
/// DELETE /api/user/skills
pub async fn delete_user_skills<T>(
    State(user_skill_use_case): State<Arc<UserSkillUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserSkillRepository + Send + Sync + 'static,
{
    match user_skill_use_case.delete_skills(user_id).await {
        Ok(_) => (StatusCode::NO_CONTENT).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

