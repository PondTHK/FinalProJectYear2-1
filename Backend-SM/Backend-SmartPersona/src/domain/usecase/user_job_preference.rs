use crate::domain::{
    entities::user_job_preference::{
        NewUserJobPreference, UpdateUserJobPreference, UserJobPreferenceEntity,
    },
    repo::user_job_preference::UserJobPreferenceRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserJobPreferenceUseCase<T>
where
    T: UserJobPreferenceRepository + Send + Sync,
{
    user_job_preference_repository: Arc<T>,
}

impl<T> UserJobPreferenceUseCase<T>
where
    T: UserJobPreferenceRepository + Send + Sync,
{
    pub fn new(user_job_preference_repository: Arc<T>) -> Self {
        Self {
            user_job_preference_repository,
        }
    }

    pub async fn create_preference(
        &self,
        new_preference: NewUserJobPreference,
    ) -> Result<UserJobPreferenceEntity> {
        self.user_job_preference_repository
            .create(&new_preference)
            .await
    }

    pub async fn get_preference_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<Option<UserJobPreferenceEntity>> {
        self.user_job_preference_repository
            .get_by_user_id(user_id)
            .await
    }

    pub async fn get_all_preferences_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<UserJobPreferenceEntity>> {
        self.user_job_preference_repository
            .get_all_by_user_id(user_id)
            .await
    }

    pub async fn update_preference(
        &self,
        user_id: Uuid,
        update_data: UpdateUserJobPreference,
    ) -> Result<UserJobPreferenceEntity> {
        self.user_job_preference_repository
            .update_by_user_id(user_id, &update_data)
            .await
    }

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว - สะดวกสำหรับฟอร์มกรอกข้อมูล
    pub async fn upsert_preference(
        &self,
        user_id: Uuid,
        preference_data: NewUserJobPreference,
    ) -> Result<UserJobPreferenceEntity> {
        self.user_job_preference_repository
            .upsert_by_user_id(user_id, &preference_data)
            .await
    }

    /// ลบ job preference ของผู้ใช้ตาม user_id
    pub async fn delete_preference(&self, user_id: Uuid) -> Result<()> {
        // ตรวจสอบว่ามี preference อยู่ก่อนลบ
        let _existing = self
            .user_job_preference_repository
            .get_by_user_id(user_id)
            .await?
            .ok_or_else(|| {
                anyhow::anyhow!("User job preference not found for user_id: {}", user_id)
            })?;

        self.user_job_preference_repository
            .delete_by_user_id(user_id)
            .await?;
        Ok(())
    }

    /// ลบ job preference ตาม id
    pub async fn delete_preference_by_id(&self, id: Uuid) -> Result<()> {
        self.user_job_preference_repository
            .delete_by_id(id)
            .await?;
        Ok(())
    }
}
