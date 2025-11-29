use crate::domain::entities::user_skill::{NewUserSkill, UpdateUserSkill, UserSkillEntity};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserSkillRepository: Send + Sync {
    /// สร้าง skills ใหม่
    async fn create(&self, new_skill: &NewUserSkill) -> Result<UserSkillEntity>;

    /// ดึงข้อมูล skills ตาม user_id
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserSkillEntity>>;

    /// อัปเดตข้อมูล skills ตาม user_id
    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserSkill,
    ) -> Result<UserSkillEntity>;

    /// สร้างหรืออัปเดต (upsert) skills
    async fn upsert(&self, user_id: Uuid, skills: &NewUserSkill) -> Result<UserSkillEntity>;

    /// ลบข้อมูล skills ตาม user_id
    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;
}

