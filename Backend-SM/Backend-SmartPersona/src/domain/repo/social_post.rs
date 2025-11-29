use crate::domain::entities::social_post::{NewSocialPost, SocialPostEntity, UpdateSocialPost};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait SocialPostRepository: Send + Sync {
    /// สร้าง social post ใหม่
    async fn create(&self, new_post: &NewSocialPost) -> Result<SocialPostEntity>;

    /// สร้างหลาย posts พร้อมกัน (batch insert)
    async fn create_batch(&self, posts: &[NewSocialPost]) -> Result<Vec<SocialPostEntity>>;

    /// ดึงข้อมูล post ตาม id
    async fn get_by_id(&self, id: Uuid) -> Result<Option<SocialPostEntity>>;

    /// ดึงข้อมูล posts ทั้งหมดของ connection
    async fn get_by_connection_id(
        &self,
        connection_id: Uuid,
    ) -> Result<Vec<SocialPostEntity>>;

    /// ดึงข้อมูล post ตาม platform_post_id
    async fn get_by_platform_post_id(
        &self,
        connection_id: Uuid,
        platform_post_id: &str,
    ) -> Result<Option<SocialPostEntity>>;

    /// อัปเดตข้อมูล post
    async fn update(&self, id: Uuid, update_data: &UpdateSocialPost) -> Result<SocialPostEntity>;

    /// ลบ post
    async fn delete(&self, id: Uuid) -> Result<()>;

    /// ลบ posts ทั้งหมดของ connection
    async fn delete_by_connection_id(&self, connection_id: Uuid) -> Result<()>;
}

