use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    domain::{
        entities::saved_job::SavedJobRequest,
        repo::saved_job::SavedJobRepository,
        usecase::saved_job::SavedJobUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::saved_job::SavedJobPostgres,
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
    let saved_job_repository = SavedJobPostgres::new(db_pool);
    let saved_job_use_case = Arc::new(SavedJobUseCase::new(Arc::new(
        saved_job_repository,
    )));

    Router::new()
        .route("/saved-jobs", get(get_saved_jobs))
        .route("/saved-jobs", post(save_job))
        .route("/saved-jobs/:post_id", delete(unsave_job))
        .route("/saved-jobs/check/:post_id", get(check_saved))
        .layer(middleware::from_fn(user_authorization))
        .with_state(saved_job_use_case)
}

/// Get all saved jobs for current user
/// GET /api/user/saved-jobs
pub async fn get_saved_jobs<T>(
    State(saved_job_use_case): State<Arc<SavedJobUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: SavedJobRepository + Send + Sync + 'static,
{
    match saved_job_use_case.get_saved_jobs(user_id).await {
        Ok(saved_jobs) => (StatusCode::OK, Json(saved_jobs)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Save a job
/// POST /api/user/saved-jobs
pub async fn save_job<T>(
    State(saved_job_use_case): State<Arc<SavedJobUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(request): Json<SavedJobRequest>,
) -> impl IntoResponse
where
    T: SavedJobRepository + Send + Sync + 'static,
{
    match saved_job_use_case.save_job(user_id, request).await {
        Ok(saved_job) => (StatusCode::CREATED, Json(saved_job)).into_response(),
        Err(e) => {
            if e.to_string().contains("already exists") || e.to_string().contains("duplicate") {
                (StatusCode::CONFLICT, "Job already saved").into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
        }
    }
}

/// Unsave a job
/// DELETE /api/user/saved-jobs/:post_id
pub async fn unsave_job<T>(
    State(saved_job_use_case): State<Arc<SavedJobUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(post_id): Path<String>,
) -> impl IntoResponse
where
    T: SavedJobRepository + Send + Sync + 'static,
{
    let post_id = match Uuid::parse_str(&post_id) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid post_id").into_response(),
    };

    match saved_job_use_case.unsave_job(user_id, post_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Check if a job is saved
/// GET /api/user/saved-jobs/check/:post_id
pub async fn check_saved<T>(
    State(saved_job_use_case): State<Arc<SavedJobUseCase<T>>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(post_id): Path<String>,
) -> impl IntoResponse
where
    T: SavedJobRepository + Send + Sync + 'static,
{
    let post_id = match Uuid::parse_str(&post_id) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid post_id").into_response(),
    };

    match saved_job_use_case.is_saved(user_id, post_id).await {
        Ok(is_saved) => (StatusCode::OK, Json(serde_json::json!({ "is_saved": is_saved }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

