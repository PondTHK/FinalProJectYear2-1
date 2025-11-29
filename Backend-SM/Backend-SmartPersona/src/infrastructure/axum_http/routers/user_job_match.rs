use std::sync::Arc;

use axum::{
    extract::State,
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_job_match::SaveJobMatchesRequest,
        repo::user_job_match::UserJobMatchRepository,
        usecase::user_job_match::UserJobMatchUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{postgres_connection::DbPool, repositories::user_job_match::UserJobMatchPostgres},
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
    let repo = UserJobMatchPostgres::new(db_pool);
    let use_case = Arc::new(UserJobMatchUseCase::new(Arc::new(repo)));

    Router::new()
        .route("/job-matches", post(save_matches))
        .route("/job-matches", get(get_matches))
        .layer(middleware::from_fn(user_authorization))
        .with_state(use_case)
}

async fn save_matches<R>(
    State(use_case): State<Arc<UserJobMatchUseCase<R>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(payload): Json<SaveJobMatchesRequest>,
) -> impl IntoResponse
where
    R: UserJobMatchRepository + Send + Sync + 'static,
{
    match use_case.save_matches(user_id, payload.matches).await {
        Ok(matches) => (StatusCode::CREATED, Json(matches)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_matches<R>(
    State(use_case): State<Arc<UserJobMatchUseCase<R>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    R: UserJobMatchRepository + Send + Sync + 'static,
{
    match use_case.get_matches(user_id).await {
        Ok(matches) => (StatusCode::OK, Json(matches)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
