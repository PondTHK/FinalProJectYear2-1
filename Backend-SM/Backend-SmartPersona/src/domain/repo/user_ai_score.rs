use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

use crate::domain::entities::user_ai_score::{UpsertUserAIScore, UserAIScoreEntity};

#[async_trait]
pub trait UserAIScoreRepository {
    async fn upsert(&self, data: UpsertUserAIScore) -> Result<UserAIScoreEntity>;
    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Option<UserAIScoreEntity>>;
}
