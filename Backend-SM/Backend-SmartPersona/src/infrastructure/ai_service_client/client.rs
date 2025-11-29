use async_trait::async_trait;
use anyhow::{Result, Context};
use reqwest::{Client, multipart};
use bytes::Bytes;

use crate::domain::{
    entities::ai_analysis::{
        AIAnalysisRequest, AIAnalysisResponse, ChatRequest, ChatResponse, ParsedResumeResponse
    },
    repo::ai_service::AIServiceRepository,
};

pub struct AIServiceClient {
    client: Client,
    base_url: String,
}

impl AIServiceClient {
    pub fn new(base_url: String) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            base_url,
        }
    }
}

#[async_trait]
impl AIServiceRepository for AIServiceClient {
    async fn analyze_personality(&self, request: AIAnalysisRequest) -> Result<AIAnalysisResponse> {
        let url = format!("{}/analyze-personality", self.base_url);

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .context("Failed to send request to AI service")?;

        if response.status().is_success() {
            let result = response
                .json::<AIAnalysisResponse>()
                .await
                .context("Failed to deserialize AI service success response")?;
            Ok(result)
        } else {
            let error_body = response.text().await.context("Failed to read AI service error body")?;
            Err(anyhow::anyhow!("AI service returned an error: {}", error_body))
        }
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        let url = format!("{}/chat", self.base_url);

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .context("Failed to send chat request to AI service")?;

        if response.status().is_success() {
            let result = response
                .json::<ChatResponse>()
                .await
                .context("Failed to deserialize chat service success response")?;
            Ok(result)
        } else {
            let error_body = response.text().await.context("Failed to read chat service error body")?;
            Err(anyhow::anyhow!("Chat service returned an error: {}", error_body))
        }
    }

    async fn parse_resume(&self, file_name: String, file_content: Bytes) -> Result<ParsedResumeResponse> {
        let url = format!("{}/parse-resume", self.base_url);

        let part = multipart::Part::bytes(file_content.to_vec())
            .file_name(file_name);

        let form = multipart::Form::new()
            .part("file", part);

        let response = self.client
            .post(&url)
            .multipart(form)
            .send()
            .await
            .context("Failed to send resume file to AI service")?;

        if response.status().is_success() {
            let result = response
                .json::<ParsedResumeResponse>()
                .await
                .context("Failed to deserialize resume parsing response")?;
            Ok(result)
        } else {
            let error_body = response.text().await.context("Failed to read resume parsing error body")?;
            Err(anyhow::anyhow!("Resume parsing service error: {}", error_body))
        }
    }
}
