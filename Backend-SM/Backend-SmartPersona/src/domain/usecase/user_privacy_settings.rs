use crate::domain::{
    entities::user_privacy_settings::{
        NewUserPrivacySettings, UpdateUserPrivacySettings, UserPrivacySettingsEntity,
    },
    repo::user_privacy_settings::UserPrivacySettingsRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserPrivacySettingsUseCase<T>
where
    T: UserPrivacySettingsRepository + Send + Sync,
{
    user_privacy_settings_repository: Arc<T>,
}

impl<T> UserPrivacySettingsUseCase<T>
where
    T: UserPrivacySettingsRepository + Send + Sync,
{
    pub fn new(user_privacy_settings_repository: Arc<T>) -> Self {
        Self {
            user_privacy_settings_repository,
        }
    }

    pub async fn create_settings(
        &self,
        new_settings: NewUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity> {
        self.user_privacy_settings_repository
            .create(&new_settings)
            .await
    }

    pub async fn get_settings_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<Option<UserPrivacySettingsEntity>> {
        self.user_privacy_settings_repository
            .get_by_user_id(user_id)
            .await
    }

    pub async fn update_settings(
        &self,
        user_id: Uuid,
        update_data: UpdateUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity> {
        self.user_privacy_settings_repository
            .update_by_user_id(user_id, &update_data)
            .await
    }

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว
    pub async fn upsert_settings(
        &self,
        user_id: Uuid,
        settings_data: NewUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity> {
        self.user_privacy_settings_repository
            .upsert_by_user_id(user_id, &settings_data)
            .await
    }

    /// ลบ privacy settings ของผู้ใช้ตาม user_id
    pub async fn delete_settings(&self, user_id: Uuid) -> Result<()> {
        self.user_privacy_settings_repository
            .delete_by_user_id(user_id)
            .await?;
        Ok(())
    }
}


