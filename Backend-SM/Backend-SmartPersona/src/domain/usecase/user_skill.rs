use crate::domain::{
    entities::user_skill::{NewUserSkill, UpdateUserSkill, UserSkillEntity, UserSkillRequest},
    repo::user_skill::UserSkillRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserSkillUseCase<T>
where
    T: UserSkillRepository + Send + Sync,
{
    user_skill_repository: Arc<T>,
}

impl<T> UserSkillUseCase<T>
where
    T: UserSkillRepository + Send + Sync,
{
    pub fn new(user_skill_repository: Arc<T>) -> Self {
        Self {
            user_skill_repository,
        }
    }

    /// ดึงข้อมูล skills ของ user
    pub async fn get_user_skills(&self, user_id: Uuid) -> Result<Option<UserSkillEntity>> {
        self.user_skill_repository.get_by_user_id(user_id).await
    }

    /// สร้าง skills ใหม่
    pub async fn create_skills(
        &self,
        user_id: Uuid,
        skill_request: UserSkillRequest,
    ) -> Result<UserSkillEntity> {
        let new_skill = skill_request.into_new_skill(user_id);
        self.user_skill_repository.create(&new_skill).await
    }

    /// อัปเดต skills
    pub async fn update_skills(
        &self,
        user_id: Uuid,
        skill_request: UserSkillRequest,
    ) -> Result<UserSkillEntity> {
        let update_data = skill_request.into_update_skill();
        self.user_skill_repository
            .update_by_user_id(user_id, &update_data)
            .await
    }

    /// สร้างหรืออัปเดต skills (upsert)
    pub async fn upsert_skills(
        &self,
        user_id: Uuid,
        skill_request: UserSkillRequest,
    ) -> Result<UserSkillEntity> {
        let new_skill = skill_request.into_new_skill(user_id);
        self.user_skill_repository.upsert(user_id, &new_skill).await
    }

    /// ลบ skills
    pub async fn delete_skills(&self, user_id: Uuid) -> Result<()> {
        self.user_skill_repository.delete_by_user_id(user_id).await
    }
}

