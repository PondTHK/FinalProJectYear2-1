use crate::domain::{
    entities::user_profile::{NewUserProfile, UpdateUserProfile, UserProfileEntity},
    repo::user_profile::UserProfileRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserProfileUseCase<T>
where
    T: UserProfileRepository + Send + Sync,
{
    user_profile_repository: Arc<T>,
}

impl<T> UserProfileUseCase<T>
where
    T: UserProfileRepository + Send + Sync,
{
    pub fn new(user_profile_repository: Arc<T>) -> Self {
        Self {
            user_profile_repository,
        }
    }

    pub async fn create_profile(&self, new_profile: NewUserProfile) -> Result<UserProfileEntity> {
        self.user_profile_repository.create(&new_profile).await
    }

    pub async fn get_profile_by_user_id(&self, user_id: Uuid) -> Result<Option<UserProfileEntity>> {
        self.user_profile_repository.get_by_user_id(user_id).await
    }

    pub async fn update_profile(
        &self,
        user_id: Uuid,
        update_data: UpdateUserProfile,
    ) -> Result<UserProfileEntity> {
        self.user_profile_repository
            .update_by_user_id(user_id, &update_data)
            .await
    }

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว - สะดวกสำหรับฟอร์มกรอกข้อมูล
    pub async fn upsert_profile(
        &self,
        user_id: Uuid,
        profile_data: NewUserProfile,
    ) -> Result<UserProfileEntity> {
        self.user_profile_repository
            .upsert_by_user_id(user_id, &profile_data)
            .await
    }

    /// ลบโปรไฟล์ผู้ใช้ตาม user_id
    pub async fn delete_profile(&self, user_id: Uuid) -> Result<()> {
        // ตรวจสอบว่ามีโปรไฟล์อยู่ก่อนลบ
        let _existing = self
            .user_profile_repository
            .get_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User profile not found for user_id: {}", user_id))?;

        self.user_profile_repository
            .delete_by_user_id(user_id)
            .await?;
        Ok(())
    }
}
