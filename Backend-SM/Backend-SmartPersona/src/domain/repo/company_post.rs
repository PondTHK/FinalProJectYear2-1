use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

use crate::domain::entities::company_post::{CompanyPostEntity, NewCompanyPost, UpdateCompanyPost};

#[async_trait]
pub trait CompanyPostRepository: Send + Sync {
    async fn create(&self, new_post: &NewCompanyPost) -> Result<CompanyPostEntity>;
    async fn get_by_company_id(&self, company_id: Uuid) -> Result<Vec<CompanyPostEntity>>;
    async fn get_by_id(&self, id: Uuid) -> Result<Option<CompanyPostEntity>>;
    async fn get_all(&self) -> Result<Vec<CompanyPostEntity>>;
    async fn update(&self, id: Uuid, update_data: &UpdateCompanyPost) -> Result<CompanyPostEntity>;
    async fn delete(&self, id: Uuid) -> Result<()>;
}
