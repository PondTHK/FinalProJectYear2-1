use axum::{
    Json, Router,
    extract::{Path, State},
    middleware,
    routing::{delete, get, post},
};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::company_gallery::{CompanyGalleryEntity, CreateGalleryRequest},
        repo::company_gallery::CompanyGalleryRepository,
        usecase::company_gallery::CompanyGalleryUsecase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool, repositories::company_gallery::CompanyGalleryPostgres,
        },
    },
};

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let repo = CompanyGalleryPostgres::new(db_pool);
    let usecase = Arc::new(CompanyGalleryUsecase::new(Arc::new(repo)));

    Router::new()
        .route(
            "/companies/:company_id/galleries",
            post(create_gallery).get(get_galleries),
        )
        .route("/galleries/:id", get(get_gallery).delete(delete_gallery))
        .layer(middleware::from_fn(user_authorization))
        .with_state(usecase)
}

async fn create_gallery(
    State(usecase): State<Arc<CompanyGalleryUsecase>>,
    Path(company_id): Path<Uuid>,
    Json(req): Json<CreateGalleryRequest>,
) -> Result<Json<CompanyGalleryEntity>, String> {
    match usecase.create_gallery(company_id, req).await {
        Ok(gallery) => Ok(Json(gallery)),
        Err(e) => Err(e.to_string()),
    }
}

async fn get_galleries(
    State(usecase): State<Arc<CompanyGalleryUsecase>>,
    Path(company_id): Path<Uuid>,
) -> Result<Json<Vec<CompanyGalleryEntity>>, String> {
    match usecase.get_galleries(company_id).await {
        Ok(galleries) => Ok(Json(galleries)),
        Err(e) => Err(e.to_string()),
    }
}

async fn get_gallery(
    State(usecase): State<Arc<CompanyGalleryUsecase>>,
    Path(id): Path<Uuid>,
) -> Result<Json<CompanyGalleryEntity>, String> {
    match usecase.get_gallery(id).await {
        Ok(Some(gallery)) => Ok(Json(gallery)),
        Ok(None) => Err("Gallery not found".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

async fn delete_gallery(
    State(usecase): State<Arc<CompanyGalleryUsecase>>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, String> {
    match usecase.delete_gallery(id).await {
        Ok(_) => Ok(Json(())),
        Err(e) => Err(e.to_string()),
    }
}
