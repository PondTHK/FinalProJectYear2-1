use std::sync::Arc;
use anyhow::Result;
use bytes::Bytes;

use crate::domain::{
    entities::ai_analysis::{
        AIAnalysisRequest, AIAnalysisResponse, ChatRequest, ChatResponse, ParsedResumeResponse
    },
    repo::ai_service::AIServiceRepository,
};

pub struct AIAnalysisUseCase<T>
where
    T: AIServiceRepository + Send + Sync,
{
    ai_service_repository: Arc<T>,
}

impl<T> AIAnalysisUseCase<T>
where
    T: AIServiceRepository + Send + Sync,
{
    pub fn new(ai_service_repository: Arc<T>) -> Self {
        Self { ai_service_repository }
    }

    pub async fn analyze_user_personality(&self, user_id: String, posts: Vec<String>) -> Result<AIAnalysisResponse> {
        let request = AIAnalysisRequest {
            user_id,
            posts,
        };

        let response = self.ai_service_repository.analyze_personality(request).await?;
        Ok(response)
    }

    pub async fn chat_with_bot(&self, message: String) -> Result<ChatResponse> {
        let request = ChatRequest {
            message,
        };

        let response = self.ai_service_repository.chat(request).await?;
        Ok(response)
    }

    pub async fn parse_resume(&self, file_name: String, file_content: Bytes) -> Result<ParsedResumeResponse> {
        let response = self.ai_service_repository.parse_resume(file_name, file_content).await?;
        Ok(response)
    }
}
