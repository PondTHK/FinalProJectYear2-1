use crate::domain::{
    entities::saved_job::{NewSavedJob, SavedJobEntity, SavedJobRequest},
    repo::saved_job::SavedJobRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct SavedJobUseCase<T>
where
    T: SavedJobRepository + Send + Sync,
{
    saved_job_repository: Arc<T>,
}

impl<T> SavedJobUseCase<T>
where
    T: SavedJobRepository + Send + Sync,
{
    pub fn new(saved_job_repository: Arc<T>) -> Self {
        Self {
            saved_job_repository,
        }
    }

    /// บันทึกงาน (save job)
    pub async fn save_job(
        &self,
        user_id: Uuid,
        request: SavedJobRequest,
    ) -> Result<SavedJobEntity> {
        let new_saved_job = request.into_new_saved_job(user_id)?;
        self.saved_job_repository.create(&new_saved_job).await
    }

    /// ดึงรายการ saved jobs ทั้งหมดของ user
    pub async fn get_saved_jobs(&self, user_id: Uuid) -> Result<Vec<SavedJobEntity>> {
        self.saved_job_repository.get_by_user_id(user_id).await
    }

    /// ตรวจสอบว่า user ได้ save job นี้แล้วหรือยัง
    pub async fn is_saved(&self, user_id: Uuid, post_id: Uuid) -> Result<bool> {
        self.saved_job_repository.exists(user_id, post_id).await
    }

    /// ยกเลิกการ save job (unsave)
    pub async fn unsave_job(&self, user_id: Uuid, post_id: Uuid) -> Result<()> {
        self.saved_job_repository.delete(user_id, post_id).await
    }

    /// ลบ saved job ตาม id
    pub async fn delete_saved_job(&self, id: Uuid, user_id: Uuid) -> Result<()> {
        self.saved_job_repository.delete_by_id(id, user_id).await
    }
}

