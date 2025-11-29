use crate::domain::entities::saved_job::{NewSavedJob, SavedJobEntity};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait SavedJobRepository: Send + Sync {
    /// สร้าง saved job ใหม่
    async fn create(&self, new_saved_job: &NewSavedJob) -> Result<SavedJobEntity>;

    /// ดึงข้อมูล saved jobs ตาม user_id
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<SavedJobEntity>>;

    /// ตรวจสอบว่า user ได้ save job นี้แล้วหรือยัง
    async fn exists(&self, user_id: Uuid, post_id: Uuid) -> Result<bool>;

    /// ลบ saved job ตาม user_id และ post_id
    async fn delete(&self, user_id: Uuid, post_id: Uuid) -> Result<()>;

    /// ลบ saved job ตาม id
    async fn delete_by_id(&self, id: Uuid, user_id: Uuid) -> Result<()>;
}

