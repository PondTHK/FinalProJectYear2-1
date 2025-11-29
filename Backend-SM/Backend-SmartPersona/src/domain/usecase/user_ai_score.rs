use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

use crate::domain::{
    entities::user_ai_score::{UpsertUserAIScore, UserAIScoreEntity},
    repo::user_ai_score::UserAIScoreRepository,
};

pub struct UserAIScoreUseCase<T>
where
    T: UserAIScoreRepository + Send + Sync,
{
    repository: Arc<T>,
}

impl<T> UserAIScoreUseCase<T>
where
    T: UserAIScoreRepository + Send + Sync,
{
    pub fn new(repository: Arc<T>) -> Self {
        Self { repository }
    }

    pub async fn save_score(
        &self,
        user_id: Uuid,
        score: i32,
        recommended_position: String,
        analysis: String,
        education_score: Option<i32>,
        experience_score: Option<i32>,
        skill_score: Option<i32>,
        level: Option<String>,
    ) -> anyhow::Result<UserAIScoreEntity> {
        let upsert_data = UpsertUserAIScore {
            user_id,
            score,
            recommended_position,
            analysis,
            education_score,
            experience_score,
            skill_score,
            level,
            updated_at: Utc::now().naive_utc(),
        };

        self.repository.upsert(upsert_data).await
    }

    pub async fn get_score(&self, user_id: Uuid) -> anyhow::Result<Option<UserAIScoreEntity>> {
        self.repository.find_by_user_id(user_id).await
    }
}
