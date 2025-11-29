use async_trait::async_trait;
use anyhow::Result;
use bytes::Bytes;

use crate::domain::entities::ai_analysis::{
    AIAnalysisRequest, AIAnalysisResponse, ChatRequest, ChatResponse, ParsedResumeResponse
};

#[async_trait]
pub trait AIServiceRepository {
    async fn analyze_personality(&self, request: AIAnalysisRequest) -> Result<AIAnalysisResponse>;
    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse>;
    async fn parse_resume(&self, file_name: String, file_content: Bytes) -> Result<ParsedResumeResponse>;
}
