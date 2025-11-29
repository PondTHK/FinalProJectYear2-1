use crate::domain::entities::user_privacy_settings::{
    NewUserPrivacySettings, UpdateUserPrivacySettings, UserPrivacySettingsEntity,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserPrivacySettingsRepository: Send + Sync {
    async fn create(
        &self,
        new_settings: &NewUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity>;

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserPrivacySettingsEntity>>;

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity>;

    async fn upsert_by_user_id(
        &self,
        user_id: Uuid,
        settings_data: &NewUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity>;

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;
}


