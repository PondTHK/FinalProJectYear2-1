use async_trait::async_trait;
use uuid::Uuid;
use crate::domain::entities::job_application::{JobApplicationEntity, NewJobApplication, JobApplicationWithUser};
use crate::domain::error::AppError;

#[async_trait]
pub trait JobApplicationRepository: Send + Sync {
    async fn create(&self, application: NewJobApplication) -> Result<JobApplicationEntity, AppError>;
    async fn find_by_job_id(&self, job_id: Uuid) -> Result<Vec<JobApplicationWithUser>, AppError>;
    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<JobApplicationEntity>, AppError>;
    async fn check_existing(&self, user_id: Uuid, job_id: Uuid) -> Result<bool, AppError>;
}
