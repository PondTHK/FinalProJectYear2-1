use std::sync::Arc;

use anyhow::Result;
use uuid::Uuid;

use crate::{
    domain::entities::ads::{AdsEntity, CreateAdsRequest, NewAds, UpdateAdsRequest},
    infrastructure::postgres::repositories::ads::AdsPostgres,
};

pub struct AdsUseCase {
    repo: Arc<AdsPostgres>,
}

impl AdsUseCase {
    pub fn new(repo: Arc<AdsPostgres>) -> Self {
        Self { repo }
    }

    pub async fn create_ad(&self, req: CreateAdsRequest) -> Result<AdsEntity> {
        let new_ad = NewAds {
            title: req.title,
            sponsor_name: req.sponsor_name,
            sponsor_tag: req.sponsor_tag,
            profile_image_url: req.profile_image_url,
            details: req.details,
            link_url: req.link_url,
            start_date: req.start_date,
            end_date: req.end_date,
            status: req.status.unwrap_or_else(|| "Active".to_string()),
        };
        self.repo.create(new_ad).await
    }

    pub async fn get_all_ads(&self) -> Result<Vec<AdsEntity>> {
        self.repo.get_all().await
    }

    pub async fn get_ad_by_id(&self, id: Uuid) -> Result<Option<AdsEntity>> {
        self.repo.get_by_id(id).await
    }

    pub async fn update_ad(&self, id: Uuid, req: UpdateAdsRequest) -> Result<AdsEntity> {
        self.repo.update(id, req).await
    }

    pub async fn delete_ad(&self, id: Uuid) -> Result<()> {
        self.repo.delete(id).await
    }
}
