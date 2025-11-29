use axum::{
    Json, Router,
    extract::{Path, State},
    middleware,
    routing::{delete, get, post, put},
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::company_post::{CompanyPostEntity, CreatePostRequest, UpdatePostRequest},
        repo::company_post::CompanyPostRepository,
        usecase::company_post::CompanyPostUsecase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{postgres_connection::DbPool, repositories::company_post::CompanyPostPostgres},
    },
};

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let repo = CompanyPostPostgres::new(db_pool);
    let usecase = Arc::new(CompanyPostUsecase::new(Arc::new(repo)));

    // Public routes - no auth required
    let public_routes = Router::new()
        .route("/posts", get(get_all_posts))
        .with_state(usecase.clone());

    // Protected routes - auth required
    let protected_routes = Router::new()
        .route(
            "/companies/:company_id/posts",
            post(create_post).get(get_posts),
        )
        .route(
            "/posts/:id",
            get(get_post).put(update_post).delete(delete_post),
        )
        .layer(middleware::from_fn(user_authorization))
        .with_state(usecase);

    // Merge both routers
    public_routes.merge(protected_routes)
}

async fn create_post(
    State(usecase): State<Arc<CompanyPostUsecase>>,
    Path(company_id): Path<Uuid>,
    Json(req): Json<CreatePostRequest>,
) -> Result<Json<CompanyPostEntity>, String> {
    match usecase.create_post(company_id, req).await {
        Ok(post) => Ok(Json(post)),
        Err(e) => Err(e.to_string()),
    }
}

async fn get_posts(
    State(usecase): State<Arc<CompanyPostUsecase>>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<Vec<CompanyPostEntity>>, String> {
    match usecase.get_posts(company_id).await {
        Ok(posts) => Ok(Json(posts)),
        Err(e) => Err(e.to_string()),
    }
}

async fn get_post(
    State(usecase): State<Arc<CompanyPostUsecase>>,
    Path(id): Path<Uuid>,
) -> Result<Json<CompanyPostEntity>, String> {
    match usecase.get_post(id).await {
        Ok(Some(post)) => Ok(Json(post)),
        Ok(None) => Err("Post not found".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

async fn update_post(
    State(usecase): State<Arc<CompanyPostUsecase>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePostRequest>,
) -> Result<Json<CompanyPostEntity>, String> {
    match usecase.update_post(id, req).await {
        Ok(post) => Ok(Json(post)),
        Err(e) => Err(e.to_string()),
    }
}

async fn delete_post(
    State(usecase): State<Arc<CompanyPostUsecase>>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, String> {
    match usecase.delete_post(id).await {
        Ok(_) => Ok(Json(())),
        Err(e) => Err(e.to_string()),
    }
}

async fn get_all_posts(
    State(usecase): State<Arc<CompanyPostUsecase>>,
) -> Result<Json<Vec<CompanyPostEntity>>, String> {
    match usecase.get_all_posts().await {
        Ok(posts) => Ok(Json(posts)),
        Err(e) => Err(e.to_string()),
    }
}
