use crate::domain::{
    entities::company::{NewCompany, UpdateCompany, CompanyEntity},
    repo::company::CompanyRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct CompanyUseCase<T>
where
    T: CompanyRepository + Send + Sync,
{
    company_repository: Arc<T>,
}

impl<T> CompanyUseCase<T>
where
    T: CompanyRepository + Send + Sync,
{
    pub fn new(company_repository: Arc<T>) -> Self {
        Self {
            company_repository,
        }
    }

    pub async fn create_company(&self, new_company: NewCompany) -> Result<CompanyEntity> {
        self.company_repository.create(&new_company).await
    }

    pub async fn get_company_by_user_id(&self, user_id: Uuid) -> Result<Option<CompanyEntity>> {
        self.company_repository.get_by_user_id(user_id).await
    }

    pub async fn get_company_by_id(&self, id: Uuid) -> Result<Option<CompanyEntity>> {
        self.company_repository.get_by_id(id).await
    }

    pub async fn update_company(
        &self,
        user_id: Uuid,
        update_data: UpdateCompany,
    ) -> Result<CompanyEntity> {
        self.company_repository
            .update_by_user_id(user_id, &update_data)
            .await
    }

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว - สะดวกสำหรับฟอร์มกรอกข้อมูล
    pub async fn upsert_company(
        &self,
        user_id: Uuid,
        company_data: NewCompany,
    ) -> Result<CompanyEntity> {
        self.company_repository
            .upsert_by_user_id(user_id, &company_data)
            .await
    }

    /// ลบข้อมูลบริษัทตาม user_id
    pub async fn delete_company(&self, user_id: Uuid) -> Result<()> {
        // ตรวจสอบว่ามีข้อมูลบริษัทอยู่ก่อนลบ
        let _existing = self
            .company_repository
            .get_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Company not found for user_id: {}", user_id))?;

        self.company_repository
            .delete_by_user_id(user_id)
            .await?;
        Ok(())
    }

    /// Get all companies (for admin)
    pub async fn get_all_companies(&self) -> Result<Vec<CompanyEntity>> {
        self.company_repository.get_all().await
    }
}

