use crate::domain::entities::company::{NewCompany, UpdateCompany, CompanyEntity};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait CompanyRepository: Send + Sync {
    async fn create(&self, new_company: &NewCompany) -> Result<CompanyEntity>;

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<CompanyEntity>>;

    async fn get_by_id(&self, id: Uuid) -> Result<Option<CompanyEntity>>;

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateCompany,
    ) -> Result<CompanyEntity>;

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว (สะดวกสำหรับฟอร์มกรอกข้อมูล)
    async fn upsert_by_user_id(
        &self,
        user_id: Uuid,
        company_data: &NewCompany,
    ) -> Result<CompanyEntity>;

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;

    /// Get all companies (for admin)
    async fn get_all(&self) -> Result<Vec<CompanyEntity>>;
}

