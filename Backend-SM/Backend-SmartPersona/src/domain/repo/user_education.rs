use crate::domain::entities::user_education::{
    NewUserEducation, UpdateUserEducation, UserEducationEntity,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserEducationRepository: Send + Sync {
    /// สร้างการศึกษาใหม่
    async fn create(&self, new_education: &NewUserEducation) -> Result<UserEducationEntity>;

    /// ดึงข้อมูลการศึกษาตาม user_id
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserEducationEntity>>;

    /// ดึงข้อมูลการศึกษาตาม composite key (user_id, school, start_date)
    async fn get_by_key(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<Option<UserEducationEntity>>;

    /// อัปเดตข้อมูลการศึกษาตาม composite key
    async fn update_by_key(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserEducation,
    ) -> Result<UserEducationEntity>;

    /// ลบข้อมูลการศึกษาตาม composite key
    async fn delete_by_key(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<()>;

    /// ลบข้อมูลการศึกษาทั้งหมดของ user
    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()>;

    /// สร้างใหม่ (เพิ่มเข้าไปใน collection ของ user)
    async fn add_education(&self, new_education: &NewUserEducation) -> Result<UserEducationEntity>;

    /// อัปเดตการศึกษาที่มีอยู่แล้ว (ค้นหาตาม key แล้วอัปเดต)
    async fn update_existing_education(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserEducation,
    ) -> Result<UserEducationEntity>;
}
