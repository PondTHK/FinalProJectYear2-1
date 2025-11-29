use axum::{
    Json,
    extract::{State, Multipart},
    http::StatusCode,
    response::IntoResponse
};
use axum::{Router, middleware, routing::post};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use bytes::Bytes;

use crate::{
    domain::{
        usecase::ai_analysis::AIAnalysisUseCase,
        entities::ai_analysis::ParsedResumeResponse
    },
    infrastructure::ai_service_client::client::AIServiceClient,
    infrastructure::axum_http::middleware::user_authorization,
};

pub fn routes(ai_use_case: Arc<AIAnalysisUseCase<AIServiceClient>>) -> Router {
    Router::new()
        .route(
            "/analyze-personality",
            post(analyze_personality_handler).with_state(Arc::clone(&ai_use_case)),
        )
        .route("/chat", post(chat_handler).with_state(Arc::clone(&ai_use_case)))
        .route("/parse-resume", post(parse_resume_handler).with_state(ai_use_case))
        .layer(middleware::from_fn(user_authorization))
}

#[derive(Deserialize)]
pub struct AnalyzePersonalityPayload {
    pub user_id: String,
    pub posts: Vec<String>,
}

#[derive(Serialize)]
pub struct AnalyzePersonalityResponse {
    pub personality_tags: Vec<String>,
    pub suggested_theme: String,
}

#[derive(Deserialize)]
pub struct ChatPayload {
    pub message: String,
}

#[derive(Serialize)]
pub struct ChatHandlerResponse {
    pub reply: String,
    pub history: Option<Vec<String>>, // Future use
}

pub async fn analyze_personality_handler(
    State(ai_use_case): State<Arc<AIAnalysisUseCase<AIServiceClient>>>,
    Json(payload): Json<AnalyzePersonalityPayload>,
) -> impl IntoResponse {
    match ai_use_case
        .analyze_user_personality(payload.user_id, payload.posts)
        .await
    {
        Ok(result) => {
            let response = AnalyzePersonalityResponse {
                personality_tags: result.personality_tags,
                suggested_theme: result.suggested_theme,
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn chat_handler(
    State(ai_use_case): State<Arc<AIAnalysisUseCase<AIServiceClient>>>,
    Json(payload): Json<ChatPayload>,
) -> impl IntoResponse {
    match ai_use_case.chat_with_bot(payload.message).await {
        Ok(result) => {
            let response = ChatHandlerResponse {
                reply: result.reply,
                history: None,
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn parse_resume_handler(
    State(ai_use_case): State<Arc<AIAnalysisUseCase<AIServiceClient>>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    // Extract file from multipart
    let mut file_name = String::from("resume.pdf");
    let mut file_content = Bytes::new();
    let mut file_found = false;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        if name == "file" {
            if let Some(filename) = field.file_name() {
                file_name = filename.to_string();
            }
            match field.bytes().await {
                Ok(bytes) => {
                    file_content = bytes;
                    file_found = true;
                },
                Err(e) => return (StatusCode::BAD_REQUEST, format!("Failed to read file: {}", e)).into_response(),
            }
            break; // We only need one file
        }
    }

    if !file_found {
        return (StatusCode::BAD_REQUEST, "No file part found in request").into_response();
    }

    // Call use case
    match ai_use_case.parse_resume(file_name, file_content).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => {
            tracing::error!("Resume parsing failed: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to parse resume: {}", e)).into_response()
        },
    }
}
