use anyhow::Result;
use async_trait::async_trait;
use uuid::Uuid;
use crate::domain::entities::job_application::{JobApplicationEntity, NewJobApplication, JobApplicationWithUser};

#[async_trait]
pub trait JobApplicationRepository: Send + Sync {
    async fn create(&self, application: NewJobApplication) -> Result<JobApplicationEntity>;
    async fn find_by_job_id(&self, job_id: Uuid) -> Result<Vec<JobApplicationWithUser>>;
    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<JobApplicationEntity>>;
    async fn check_existing(&self, user_id: Uuid, job_id: Uuid) -> Result<bool>;
    async fn update_status(&self, application_id: Uuid, status: String) -> Result<JobApplicationEntity>;
}
