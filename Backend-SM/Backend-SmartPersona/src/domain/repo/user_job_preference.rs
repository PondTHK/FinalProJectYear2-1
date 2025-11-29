use crate::domain::entities::user_job_preference::{
    NewUserJobPreference, UpdateUserJobPreference, UserJobPreferenceEntity,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserJobPreferenceRepository: Send + Sync {
    async fn create(
        &self,
        new_preference: &NewUserJobPreference,
    ) -> Result<UserJobPreferenceEntity>;

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserJobPreferenceEntity>>;

    async fn get_all_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserJobPreferenceEntity>>;

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserJobPreference,
    ) -> Result<UserJobPreferenceEntity>;

    async fn delete_by_id(&self, id: Uuid) -> Result<()>;

    async fn upsert_by_user_id(
        &self,
        user_id: Uuid,
        preference_data: &NewUserJobPreference,
    ) -> Result<UserJobPreferenceEntity>;

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;
}
