use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::{
    entities::company_gallery::{CompanyGalleryEntity, CreateGalleryRequest},
    repo::company_gallery::CompanyGalleryRepository,
};

pub struct CompanyGalleryUsecase {
    repo: Arc<dyn CompanyGalleryRepository>,
}

impl CompanyGalleryUsecase {
    pub fn new(repo: Arc<dyn CompanyGalleryRepository>) -> Self {
        Self { repo }
    }

    pub async fn create_gallery(
        &self,
        company_id: Uuid,
        req: CreateGalleryRequest,
    ) -> Result<CompanyGalleryEntity> {
        let new_gallery = req.into_new_gallery(company_id);
        self.repo.create(&new_gallery).await
    }

    pub async fn get_galleries(&self, company_id: Uuid) -> Result<Vec<CompanyGalleryEntity>> {
        self.repo.get_by_company_id(company_id).await
    }

    pub async fn get_gallery(&self, id: Uuid) -> Result<Option<CompanyGalleryEntity>> {
        self.repo.get_by_id(id).await
    }

    pub async fn delete_gallery(&self, id: Uuid) -> Result<()> {
        self.repo.delete(id).await
    }
}
