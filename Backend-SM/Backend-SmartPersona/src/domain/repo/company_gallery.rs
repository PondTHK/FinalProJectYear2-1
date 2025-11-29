use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

use crate::domain::entities::company_gallery::{CompanyGalleryEntity, NewCompanyGallery};

#[async_trait]
pub trait CompanyGalleryRepository: Send + Sync {
    async fn create(&self, new_gallery: &NewCompanyGallery) -> Result<CompanyGalleryEntity>;
    async fn get_by_company_id(&self, company_id: Uuid) -> Result<Vec<CompanyGalleryEntity>>;
    async fn get_by_id(&self, id: Uuid) -> Result<Option<CompanyGalleryEntity>>;
    async fn delete(&self, id: Uuid) -> Result<()>;
}
