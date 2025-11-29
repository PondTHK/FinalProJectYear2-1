use crate::domain::entities::user_experience::{
    NewUserExperience, UpdateUserExperience, UserExperienceEntity,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserExperienceRepository: Send + Sync {
    /// สร้างประสบการณ์ใหม่
    async fn create(&self, new_experience: &NewUserExperience) -> Result<UserExperienceEntity>;

    /// ดึงข้อมูลประสบการณ์ตาม user_id
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserExperienceEntity>>;

    /// ดึงข้อมูลประสบการณ์ตาม composite key (user_id, company, start_date)
    async fn get_by_key(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<Option<UserExperienceEntity>>;

    /// อัปเดตข้อมูลประสบการณ์ตาม composite key
    async fn update_by_key(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserExperience,
    ) -> Result<UserExperienceEntity>;

    /// ลบข้อมูลประสบการณ์ตาม composite key
    async fn delete_by_key(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<()>;

    /// ลบข้อมูลประสบการณ์ทั้งหมดของ user
    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()>;

    /// สร้างใหม่ (เพิ่มเข้าไปใน collection ของ user)
    async fn add_experience(&self, new_experience: &NewUserExperience) -> Result<UserExperienceEntity>;

    /// อัปเดตประสบการณ์ที่มีอยู่แล้ว (ค้นหาตาม key แล้วอัปเดต)
    async fn update_existing_experience(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserExperience,
    ) -> Result<UserExperienceEntity>;
}

