use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    domain::{
        entities::{
            social_analysis::{NewSocialAnalysis, SocialAnalysisEntity},
            social_connection::{NewSocialConnection, SocialConnectionEntity},
            social_post::{NewSocialPost, SocialPostEntity},
        },
        repo::{
            social_analysis::SocialAnalysisRepository,
            social_connection::SocialConnectionRepository,
            social_post::SocialPostRepository,
        },
        usecase::social::{
            SocialAnalysisUseCase, SocialConnectionUseCase, SocialPostUseCase,
        },
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::{
                social_analysis::SocialAnalysisPostgres,
                social_connection::SocialConnectionPostgres,
                social_post::SocialPostPostgres,
            },
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

// =================================================================
// Request/Response DTOs
// =================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct SocialConnectionRequest {
    pub platform: String,
    pub platform_user_id: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<String>, // ISO 8601 string
    pub name: Option<String>,
    pub profile_image: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SocialPostRequest {
    pub platform_post_id: String,
    pub content: String,
    pub posted_at: Option<String>, // ISO 8601 string
    pub likes_count: Option<i32>,
    pub comments_count: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SocialAnalysisRequest {
    // social_connection_id is taken from path parameter, not needed here
    pub big_five_scores: Value,
    pub analyzed_posts: Option<Value>,
    pub strengths: Option<Vec<String>>,
    pub work_style: Option<String>, // สไตล์การทำงาน
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SocialDataResponse {
    pub connection: SocialConnectionEntity,
    pub posts: Vec<SocialPostEntity>,
    pub analysis: Option<SocialAnalysisEntity>,
}

// =================================================================
// Routes
// =================================================================

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let connection_repo = SocialConnectionPostgres::new(Arc::clone(&db_pool));
    let post_repo = SocialPostPostgres::new(Arc::clone(&db_pool));
    let analysis_repo = SocialAnalysisPostgres::new(Arc::clone(&db_pool));

    let connection_use_case = Arc::new(SocialConnectionUseCase::new(Arc::new(connection_repo)));
    let post_use_case = Arc::new(SocialPostUseCase::new(Arc::new(post_repo)));
    let analysis_use_case = Arc::new(SocialAnalysisUseCase::new(Arc::new(analysis_repo)));

    Router::new()
        .route("/social/connections", get(get_connections))
        .route("/social/connections", post(create_connection))
        .route("/social/connections/:id", get(get_connection))
        .route("/social/connections/:id", delete(delete_connection))
        .route("/social/connections/:id/posts", get(get_posts))
        .route("/social/connections/:id/posts", post(create_posts))
        .route("/social/connections/:id/analysis", get(get_analysis))
        .route("/social/connections/:id/analysis", post(create_analysis))
        .route("/social/data", get(get_social_data))
        .layer(middleware::from_fn(user_authorization))
        .with_state((connection_use_case, post_use_case, analysis_use_case))
}

// =================================================================
// Connection Handlers
// =================================================================

/// Get all social connections for current user
/// GET /api/user/social/connections
pub async fn get_connections<T>(
    State((connection_use_case, _, _)): State<(
        Arc<SocialConnectionUseCase<T>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: SocialConnectionRepository + Send + Sync + 'static,
{
    match connection_use_case.get_connections_by_user(user_id).await {
        Ok(connections) => (StatusCode::OK, Json(connections)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create a new social connection
/// POST /api/user/social/connections
pub async fn create_connection<T>(
    State((connection_use_case, _, _)): State<(
        Arc<SocialConnectionUseCase<T>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(req): Json<SocialConnectionRequest>,
) -> impl IntoResponse
where
    T: SocialConnectionRepository + Send + Sync + 'static,
{
    // Parse expires_at if provided
    let expires_at = req
        .expires_at
        .as_ref()
        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&chrono::Utc));

    let new_connection = NewSocialConnection {
        user_id,
        platform: req.platform,
        platform_user_id: req.platform_user_id,
        access_token: req.access_token,
        refresh_token: req.refresh_token,
        expires_at,
        name: req.name,
        profile_image: req.profile_image,
    };

    match connection_use_case.create_connection(new_connection).await {
        Ok(connection) => (StatusCode::CREATED, Json(connection)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get a specific social connection
/// GET /api/user/social/connections/:id
pub async fn get_connection<T>(
    State((connection_use_case, _, _)): State<(
        Arc<SocialConnectionUseCase<T>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(id): Path<Uuid>,
) -> impl IntoResponse
where
    T: SocialConnectionRepository + Send + Sync + 'static,
{
    match connection_use_case
        .get_connections_by_user(user_id)
        .await
        .and_then(|connections| {
            connections
                .into_iter()
                .find(|c| c.id == id)
                .ok_or_else(|| anyhow::anyhow!("Connection not found"))
        }) {
        Ok(connection) => (StatusCode::OK, Json(connection)).into_response(),
        Err(e) => {
            if e.to_string().contains("not found") {
                (StatusCode::NOT_FOUND, e.to_string()).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
        }
    }
}

/// Delete a social connection
/// DELETE /api/user/social/connections/:id
pub async fn delete_connection<T>(
    State((connection_use_case, _, _)): State<(
        Arc<SocialConnectionUseCase<T>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(id): Path<Uuid>,
) -> impl IntoResponse
where
    T: SocialConnectionRepository + Send + Sync + 'static,
{
    // Verify ownership
    match connection_use_case
        .get_connections_by_user(user_id)
        .await
        .and_then(|connections| {
            if connections.iter().any(|c| c.id == id) {
                Ok(())
            } else {
                Err(anyhow::anyhow!("Connection not found"))
            }
        }) {
        Ok(_) => match connection_use_case.delete_connection(id).await {
            Ok(_) => StatusCode::NO_CONTENT.into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        },
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

// =================================================================
// Post Handlers
// =================================================================

/// Get posts for a social connection
/// GET /api/user/social/connections/:id/posts
pub async fn get_posts(
    State((connection_use_case, post_use_case, _)): State<(
        Arc<SocialConnectionUseCase<SocialConnectionPostgres>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(connection_id): Path<Uuid>,
) -> impl IntoResponse {
    // Verify ownership
    match connection_use_case
        .get_connections_by_user(user_id)
        .await
        .and_then(|connections| {
            if connections.iter().any(|c| c.id == connection_id) {
                Ok(())
            } else {
                Err(anyhow::anyhow!("Connection not found"))
            }
        }) {
        Ok(_) => match post_use_case.get_posts_by_connection(connection_id).await {
            Ok(posts) => (StatusCode::OK, Json(posts)).into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        },
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

/// Create posts for a social connection (batch)
/// POST /api/user/social/connections/:id/posts
pub async fn create_posts(
    State((connection_use_case, post_use_case, _)): State<(
        Arc<SocialConnectionUseCase<SocialConnectionPostgres>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(connection_id): Path<Uuid>,
    Json(posts_req): Json<Vec<SocialPostRequest>>,
) -> impl IntoResponse {
    // Verify ownership
    match connection_use_case
        .get_connections_by_user(user_id)
        .await
        .and_then(|connections| {
            if connections.iter().any(|c| c.id == connection_id) {
                Ok(())
            } else {
                Err(anyhow::anyhow!("Connection not found"))
            }
        }) {
        Ok(_) => {
            let new_posts: Vec<NewSocialPost> = posts_req
                .into_iter()
                .map(|req| {
                    let posted_at = req
                        .posted_at
                        .as_ref()
                        .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
                        .map(|dt| dt.with_timezone(&chrono::Utc));

                    NewSocialPost {
                        social_connection_id: connection_id,
                        platform_post_id: req.platform_post_id,
                        content: req.content,
                        posted_at,
                        likes_count: req.likes_count,
                        comments_count: req.comments_count,
                    }
                })
                .collect();

            match post_use_case.create_posts_batch(new_posts).await {
                Ok(posts) => (StatusCode::CREATED, Json(posts)).into_response(),
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
            }
        }
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

// =================================================================
// Analysis Handlers
// =================================================================

/// Get analysis for a social connection
/// GET /api/user/social/connections/:id/analysis
pub async fn get_analysis(
    State((connection_use_case, _, analysis_use_case)): State<(
        Arc<SocialConnectionUseCase<SocialConnectionPostgres>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(connection_id): Path<Uuid>,
) -> impl IntoResponse {
    // Verify ownership
    match connection_use_case
        .get_connections_by_user(user_id)
        .await
        .and_then(|connections| {
            if connections.iter().any(|c| c.id == connection_id) {
                Ok(())
            } else {
                Err(anyhow::anyhow!("Connection not found"))
            }
        }) {
        Ok(_) => {
            match analysis_use_case
                .get_analysis_by_user_and_connection(user_id, connection_id)
                .await
            {
                Ok(Some(analysis)) => (StatusCode::OK, Json(analysis)).into_response(),
                Ok(None) => (StatusCode::NOT_FOUND, "Analysis not found").into_response(),
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
            }
        }
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

/// Create or update analysis for a social connection
/// POST /api/user/social/connections/:id/analysis
pub async fn create_analysis(
    State((connection_use_case, _, analysis_use_case)): State<(
        Arc<SocialConnectionUseCase<SocialConnectionPostgres>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(connection_id): Path<Uuid>,
    Json(req): Json<SocialAnalysisRequest>,
) -> impl IntoResponse {
    // Verify ownership
    match connection_use_case
        .get_connections_by_user(user_id)
        .await
        .and_then(|connections| {
            if connections.iter().any(|c| c.id == connection_id) {
                Ok(())
            } else {
                Err(anyhow::anyhow!("Connection not found"))
            }
        }) {
        Ok(_) => {
            let strengths = req.strengths.map(|s| s.into_iter().map(Some).collect());

            // Use connection_id from path parameter, not from request body
            let new_analysis = NewSocialAnalysis {
                user_id,
                social_connection_id: connection_id, // Use path parameter
                big_five_scores: req.big_five_scores,
                analyzed_posts: req.analyzed_posts,
                strengths,
                work_style: req.work_style,
            };

            match analysis_use_case
                .upsert_analysis(user_id, connection_id, new_analysis)
                .await
            {
                Ok(analysis) => (StatusCode::CREATED, Json(analysis)).into_response(),
                Err(e) => {
                    tracing::error!("Failed to upsert analysis: {:?}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save analysis: {}", e)).into_response()
                }
            }
        }
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

// =================================================================
// Combined Data Handler
// =================================================================

/// Get all social data (connection + posts + analysis) for current user
/// GET /api/user/social/data
pub async fn get_social_data(
    State((connection_use_case, post_use_case, analysis_use_case)): State<(
        Arc<SocialConnectionUseCase<SocialConnectionPostgres>>,
        Arc<SocialPostUseCase<SocialPostPostgres>>,
        Arc<SocialAnalysisUseCase<SocialAnalysisPostgres>>,
    )>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse {
    match connection_use_case.get_connections_by_user(user_id).await {
        Ok(connections) => {
            let mut results = Vec::new();

            for connection in connections {
                let posts = post_use_case
                    .get_posts_by_connection(connection.id)
                    .await
                    .unwrap_or_default();

                let analysis = analysis_use_case
                    .get_analysis_by_user_and_connection(user_id, connection.id)
                    .await
                    .ok()
                    .flatten();

                results.push(SocialDataResponse {
                    connection,
                    posts,
                    analysis,
                });
            }

            (StatusCode::OK, Json(results)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

