use crate::domain::{
    entities::{
        social_analysis::{NewSocialAnalysis, SocialAnalysisEntity, UpdateSocialAnalysis},
        social_connection::{NewSocialConnection, SocialConnectionEntity, UpdateSocialConnection},
        social_post::{NewSocialPost, SocialPostEntity, UpdateSocialPost},
    },
    repo::{
        social_analysis::SocialAnalysisRepository,
        social_connection::SocialConnectionRepository,
        social_post::SocialPostRepository,
    },
};
use anyhow::Result;
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;

// =================================================================
// Social Connection Use Case
// =================================================================

pub struct SocialConnectionUseCase<T>
where
    T: SocialConnectionRepository + Send + Sync,
{
    repository: Arc<T>,
}

impl<T> SocialConnectionUseCase<T>
where
    T: SocialConnectionRepository + Send + Sync,
{
    pub fn new(repository: Arc<T>) -> Self {
        Self { repository }
    }

    pub async fn create_connection(
        &self,
        new_connection: NewSocialConnection,
    ) -> Result<SocialConnectionEntity> {
        self.repository.create(&new_connection).await
    }

    pub async fn get_connection_by_user_and_platform(
        &self,
        user_id: Uuid,
        platform: &str,
    ) -> Result<Option<SocialConnectionEntity>> {
        self.repository
            .get_by_user_and_platform(user_id, platform)
            .await
    }

    pub async fn get_connections_by_user(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<SocialConnectionEntity>> {
        self.repository.get_by_user_id(user_id).await
    }

    pub async fn update_connection(
        &self,
        id: Uuid,
        update_data: UpdateSocialConnection,
    ) -> Result<SocialConnectionEntity> {
        self.repository.update(id, &update_data).await
    }

    pub async fn delete_connection(&self, id: Uuid) -> Result<()> {
        self.repository.delete(id).await
    }

    pub async fn delete_connection_by_user_and_platform(
        &self,
        user_id: Uuid,
        platform: &str,
    ) -> Result<()> {
        self.repository
            .delete_by_user_and_platform(user_id, platform)
            .await
    }
}

// =================================================================
// Social Post Use Case
// =================================================================

pub struct SocialPostUseCase<T>
where
    T: SocialPostRepository + Send + Sync,
{
    repository: Arc<T>,
}

impl<T> SocialPostUseCase<T>
where
    T: SocialPostRepository + Send + Sync,
{
    pub fn new(repository: Arc<T>) -> Self {
        Self { repository }
    }

    pub async fn create_post(&self, new_post: NewSocialPost) -> Result<SocialPostEntity> {
        self.repository.create(&new_post).await
    }

    pub async fn create_posts_batch(
        &self,
        posts: Vec<NewSocialPost>,
    ) -> Result<Vec<SocialPostEntity>> {
        self.repository.create_batch(&posts).await
    }

    pub async fn get_posts_by_connection(
        &self,
        connection_id: Uuid,
    ) -> Result<Vec<SocialPostEntity>> {
        self.repository.get_by_connection_id(connection_id).await
    }

    pub async fn delete_posts_by_connection(&self, connection_id: Uuid) -> Result<()> {
        self.repository.delete_by_connection_id(connection_id).await
    }
}

// =================================================================
// Social Analysis Use Case
// =================================================================

pub struct SocialAnalysisUseCase<T>
where
    T: SocialAnalysisRepository + Send + Sync,
{
    repository: Arc<T>,
}

impl<T> SocialAnalysisUseCase<T>
where
    T: SocialAnalysisRepository + Send + Sync,
{
    pub fn new(repository: Arc<T>) -> Self {
        Self { repository }
    }

    pub async fn create_analysis(
        &self,
        new_analysis: NewSocialAnalysis,
    ) -> Result<SocialAnalysisEntity> {
        self.repository.create(&new_analysis).await
    }

    pub async fn get_analysis_by_user_and_connection(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
    ) -> Result<Option<SocialAnalysisEntity>> {
        self.repository
            .get_by_user_and_connection(user_id, connection_id)
            .await
    }

    pub async fn get_analyses_by_user(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<SocialAnalysisEntity>> {
        self.repository.get_by_user_id(user_id).await
    }

    pub async fn upsert_analysis(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
        analysis_data: NewSocialAnalysis,
    ) -> Result<SocialAnalysisEntity> {
        self.repository
            .upsert(user_id, connection_id, &analysis_data)
            .await
    }

    pub async fn update_analysis(
        &self,
        id: Uuid,
        update_data: UpdateSocialAnalysis,
    ) -> Result<SocialAnalysisEntity> {
        self.repository.update(id, &update_data).await
    }
}

