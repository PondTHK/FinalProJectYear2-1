use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router, middleware,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        repo::user_ai_score::UserAIScoreRepository,
        usecase::user_ai_score::UserAIScoreUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{postgres_connection::DbPool, repositories::user_ai_score::UserAIScorePostgres},
    },
};

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let repository = UserAIScorePostgres::new(Arc::clone(&db_pool));
    let use_case = Arc::new(UserAIScoreUseCase::new(Arc::new(repository)));

    Router::new()
        .route("/", post(save_user_ai_score))
        .route("/", get(get_user_ai_score))
        .layer(middleware::from_fn(user_authorization))
        .with_state(use_case)
}

#[derive(Deserialize)]
pub struct SaveScoreRequest {
    pub score: i32,
    pub recommended_position: String,
    pub analysis: String,
    pub education_score: Option<i32>,
    pub experience_score: Option<i32>,
    pub skill_score: Option<i32>,
    pub level: Option<String>,
}

pub async fn save_user_ai_score<T>(
    State(use_case): State<Arc<UserAIScoreUseCase<T>>>,
    axum::Extension(user_id): axum::Extension<Uuid>,
    Json(payload): Json<SaveScoreRequest>,
) -> impl IntoResponse
where
    T: UserAIScoreRepository + Send + Sync,
{
    match use_case
        .save_score(
            user_id,
            payload.score,
            payload.recommended_position,
            payload.analysis,
            payload.education_score,
            payload.experience_score,
            payload.skill_score,
            payload.level,
        )
        .await
    {
        Ok(score) => (StatusCode::OK, Json(score)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_user_ai_score<T>(
    State(use_case): State<Arc<UserAIScoreUseCase<T>>>,
    axum::Extension(user_id): axum::Extension<Uuid>,
) -> impl IntoResponse
where
    T: UserAIScoreRepository + Send + Sync,
{
    match use_case.get_score(user_id).await {
        Ok(Some(score)) => (StatusCode::OK, Json(score)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Score not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
