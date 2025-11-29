use crate::domain::entities::user_profile::{NewUserProfile, UpdateUserProfile, UserProfileEntity};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserProfileRepository: Send + Sync {
    async fn create(&self, new_profile: &NewUserProfile) -> Result<UserProfileEntity>;

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserProfileEntity>>;

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserProfile,
    ) -> Result<UserProfileEntity>;

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว (สะดวกสำหรับฟอร์มกรอกข้อมูล)
    async fn upsert_by_user_id(
        &self,
        user_id: Uuid,
        profile_data: &NewUserProfile,
    ) -> Result<UserProfileEntity>;

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;
}
