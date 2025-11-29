use crate::domain::entities::social_connection::{
    NewSocialConnection, SocialConnectionEntity, UpdateSocialConnection,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait SocialConnectionRepository: Send + Sync {
    /// สร้าง social connection ใหม่
    async fn create(&self, new_connection: &NewSocialConnection) -> Result<SocialConnectionEntity>;

    /// ดึงข้อมูล connection ตาม user_id และ platform
    async fn get_by_user_and_platform(
        &self,
        user_id: Uuid,
        platform: &str,
    ) -> Result<Option<SocialConnectionEntity>>;

    /// ดึงข้อมูล connection ตาม id
    async fn get_by_id(&self, id: Uuid) -> Result<Option<SocialConnectionEntity>>;

    /// ดึงข้อมูล connections ทั้งหมดของ user
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<SocialConnectionEntity>>;

    /// อัปเดตข้อมูล connection
    async fn update(
        &self,
        id: Uuid,
        update_data: &UpdateSocialConnection,
    ) -> Result<SocialConnectionEntity>;

    /// ลบ connection
    async fn delete(&self, id: Uuid) -> Result<()>;

    /// ลบ connection ตาม user_id และ platform
    async fn delete_by_user_and_platform(
        &self,
        user_id: Uuid,
        platform: &str,
    ) -> Result<()>;
}

