use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::{
    entities::company_post::{CompanyPostEntity, CreatePostRequest, UpdatePostRequest},
    repo::company_post::CompanyPostRepository,
};

pub struct CompanyPostUsecase {
    repo: Arc<dyn CompanyPostRepository>,
}

impl CompanyPostUsecase {
    pub fn new(repo: Arc<dyn CompanyPostRepository>) -> Self {
        Self { repo }
    }

    pub async fn create_post(
        &self,
        company_id: Uuid,
        req: CreatePostRequest,
    ) -> Result<CompanyPostEntity> {
        let new_post = req.into_new_post(company_id);
        self.repo.create(&new_post).await
    }

    pub async fn get_posts(&self, company_id: Uuid) -> Result<Vec<CompanyPostEntity>> {
        self.repo.get_by_company_id(company_id).await
    }

    pub async fn get_post(&self, id: Uuid) -> Result<Option<CompanyPostEntity>> {
        self.repo.get_by_id(id).await
    }

    pub async fn update_post(
        &self,
        id: Uuid,
        req: UpdatePostRequest,
    ) -> Result<CompanyPostEntity> {
        let update_data = req.into_update_post();
        self.repo.update(id, &update_data).await
    }

    pub async fn delete_post(&self, id: Uuid) -> Result<()> {
        self.repo.delete(id).await
    }

    pub async fn get_all_posts(&self) -> Result<Vec<CompanyPostEntity>> {
        self.repo.get_all().await
    }
}
