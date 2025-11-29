use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};

use crate::domain::{
    entities::ads::{CreateAdsRequest, UpdateAdsRequest},
    usecase::ads::AdsUseCase,
};

pub fn ads_router(use_case: Arc<AdsUseCase>) -> Router {
    Router::new()
        .route("/", post(create_ads).get(get_all_ads))
        .route("/:id", get(get_ads_by_id).put(update_ads).delete(delete_ads))
        .with_state(use_case)
}

async fn create_ads(
    State(use_case): State<Arc<AdsUseCase>>,
    Json(req): Json<CreateAdsRequest>,
) -> impl IntoResponse {
    match use_case.create_ad(req).await {
        Ok(ad) => (StatusCode::CREATED, Json(ad)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_all_ads(State(use_case): State<Arc<AdsUseCase>>) -> impl IntoResponse {
    match use_case.get_all_ads().await {
        Ok(ads) => (StatusCode::OK, Json(ads)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_ads_by_id(
    State(use_case): State<Arc<AdsUseCase>>,
    Path(id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    match use_case.get_ad_by_id(id).await {
        Ok(Some(ad)) => (StatusCode::OK, Json(ad)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Ad not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn update_ads(
    State(use_case): State<Arc<AdsUseCase>>,
    Path(id): Path<uuid::Uuid>,
    Json(req): Json<UpdateAdsRequest>,
) -> impl IntoResponse {
    match use_case.update_ad(id, req).await {
        Ok(ad) => (StatusCode::OK, Json(ad)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn delete_ads(
    State(use_case): State<Arc<AdsUseCase>>,
    Path(id): Path<uuid::Uuid>,
) -> impl IntoResponse {
    match use_case.delete_ad(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
