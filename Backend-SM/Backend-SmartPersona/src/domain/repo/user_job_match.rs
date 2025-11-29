use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

use crate::domain::entities::user_job_match::{NewUserJobMatch, UserJobMatchEntity};

#[async_trait]
pub trait UserJobMatchRepository: Send + Sync {
    async fn create(&self, new_match: &NewUserJobMatch) -> Result<UserJobMatchEntity>;
    async fn create_many(&self, new_matches: &[NewUserJobMatch]) -> Result<Vec<UserJobMatchEntity>>;
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserJobMatchEntity>>;
    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;
}
