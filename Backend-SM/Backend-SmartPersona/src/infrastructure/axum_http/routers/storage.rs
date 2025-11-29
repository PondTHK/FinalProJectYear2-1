use std::sync::Arc;

use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, post},
    Json, Router,
};
use futures_util::StreamExt;
use uuid::Uuid;

use crate::{
    infrastructure::{
        axum_http::middleware::user_authorization,
        supabase::{client::SupabaseClient, storage::StorageService},
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

pub fn routes(supabase_client: Arc<SupabaseClient>) -> Router {
    let storage_service = Arc::new(StorageService::new(supabase_client));

    Router::new()
        .route("/upload", post(upload_file))
        .route("/upload/profile-image", post(upload_profile_image))
        .route("/upload/cover-image", post(upload_cover_image))
        .route("/delete", delete(delete_file))
        .layer(middleware::from_fn(user_authorization))
        .with_state(storage_service)
}

#[derive(serde::Serialize)]
struct UploadResponse {
    url: String,
    message: String,
}

#[derive(serde::Deserialize)]
struct DeleteRequest {
    file_path: String,
}

/// Upload a file
/// POST /api/storage/upload
pub async fn upload_file(
    State(storage_service): State<Arc<StorageService>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut file_data: Option<axum::body::Bytes> = None;
    let mut file_name: Option<String> = None;
    let mut folder: Option<String> = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("");

        match name {
            "file" => {
                // Get file_name first before consuming field with bytes()
                let current_file_name = field.file_name().map(|s| s.to_string());
                if let Ok(data) = field.bytes().await {
                    file_data = Some(data);
                    if let Some(name) = current_file_name {
                        file_name = Some(name);
                    }
                }
            }
            "folder" => {
                if let Ok(value) = field.text().await {
                    folder = Some(value);
                }
            }
            _ => {}
        }
    }

    let file_data = match file_data {
        Some(data) => data,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "No file provided"})),
            )
                .into_response();
        }
    };

    let file_name = file_name.unwrap_or_else(|| "upload.bin".to_string());

    match storage_service
        .upload_file(file_data, file_name, user_id, folder)
        .await
    {
        Ok(url) => (
            StatusCode::OK,
            Json(UploadResponse {
                url: url.clone(),
                message: "File uploaded successfully".to_string(),
            }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

/// Upload profile image
/// POST /api/storage/upload/profile-image
pub async fn upload_profile_image(
    State(storage_service): State<Arc<StorageService>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut file_data: Option<axum::body::Bytes> = None;
    let mut file_name: Option<String> = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        if field.name() == Some("file") {
            // Get file_name first before consuming field with bytes()
            let current_file_name = field.file_name().map(|s| s.to_string());
            if let Ok(data) = field.bytes().await {
                file_data = Some(data);
                if let Some(name) = current_file_name {
                    file_name = Some(name);
                }
            }
        }
    }

    let file_data = match file_data {
        Some(data) => data,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "No file provided"})),
            )
                .into_response();
        }
    };

    let file_name = file_name.unwrap_or_else(|| "profile.jpg".to_string());

    match storage_service
        .upload_profile_image(file_data, file_name, user_id)
        .await
    {
        Ok(url) => (
            StatusCode::OK,
            Json(UploadResponse {
                url: url.clone(),
                message: "Profile image uploaded successfully".to_string(),
            }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

/// Upload cover image
/// POST /api/storage/upload/cover-image
pub async fn upload_cover_image(
    State(storage_service): State<Arc<StorageService>>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut file_data: Option<axum::body::Bytes> = None;
    let mut file_name: Option<String> = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        if field.name() == Some("file") {
            // Get file_name first before consuming field with bytes()
            let current_file_name = field.file_name().map(|s| s.to_string());
            if let Ok(data) = field.bytes().await {
                file_data = Some(data);
                if let Some(name) = current_file_name {
                    file_name = Some(name);
                }
            }
        }
    }

    let file_data = match file_data {
        Some(data) => data,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "No file provided"})),
            )
                .into_response();
        }
    };

    let file_name = file_name.unwrap_or_else(|| "cover.jpg".to_string());

    match storage_service
        .upload_cover_image(file_data, file_name, user_id)
        .await
    {
        Ok(url) => (
            StatusCode::OK,
            Json(UploadResponse {
                url: url.clone(),
                message: "Cover image uploaded successfully".to_string(),
            }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

/// Delete a file
/// DELETE /api/storage/delete
pub async fn delete_file(
    State(storage_service): State<Arc<StorageService>>,
    AuthenticatedUserId(_user_id): AuthenticatedUserId,
    Json(request): Json<DeleteRequest>,
) -> impl IntoResponse {
    match storage_service.delete_file(request.file_path).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({"message": "File deleted successfully"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()})),
        )
            .into_response(),
    }
}

