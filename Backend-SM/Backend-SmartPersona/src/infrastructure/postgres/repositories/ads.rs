use std::sync::Arc;

use anyhow::Result;
use diesel::prelude::*;
use uuid::Uuid;

use crate::{
    domain::entities::ads::{AdsEntity, NewAds, UpdateAdsRequest},
    infrastructure::postgres::{postgres_connection::DbPool, schema::ads},
};

pub struct AdsPostgres {
    db_pool: Arc<DbPool>,
}

impl AdsPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }

    pub async fn create(&self, new_ad: NewAds) -> Result<AdsEntity> {
        let mut conn = self.db_pool.get()?;
        let result = diesel::insert_into(ads::table)
            .values(&new_ad)
            .get_result(&mut conn)?;
        Ok(result)
    }

    pub async fn get_all(&self) -> Result<Vec<AdsEntity>> {
        let mut conn = self.db_pool.get()?;
        let result = ads::table.load::<AdsEntity>(&mut conn)?;
        Ok(result)
    }

    pub async fn get_by_id(&self, id: Uuid) -> Result<Option<AdsEntity>> {
        let mut conn = self.db_pool.get()?;
        let result = ads::table
            .filter(ads::id.eq(id))
            .first::<AdsEntity>(&mut conn)
            .optional()?;
        Ok(result)
    }

    pub async fn update(&self, id: Uuid, req: UpdateAdsRequest) -> Result<AdsEntity> {
        let mut conn = self.db_pool.get()?;
        
        let target = ads::table.filter(ads::id.eq(id));
        
        let result = diesel::update(target)
            .set((
                req.title.map(|v| ads::title.eq(v)),
                req.sponsor_name.map(|v| ads::sponsor_name.eq(v)),
                req.sponsor_tag.map(|v| ads::sponsor_tag.eq(v)),
                req.profile_image_url.map(|v| ads::profile_image_url.eq(v)),
                req.details.map(|v| ads::details.eq(v)),
                req.link_url.map(|v| ads::link_url.eq(v)),
                req.start_date.map(|v| ads::start_date.eq(v)),
                req.end_date.map(|v| ads::end_date.eq(v)),
                req.status.map(|v| ads::status.eq(v)),
            ))
            .get_result(&mut conn)?;
        Ok(result)
    }

    pub async fn delete(&self, id: Uuid) -> Result<()> {
        let mut conn = self.db_pool.get()?;
        diesel::delete(ads::table.filter(ads::id.eq(id))).execute(&mut conn)?;
        Ok(())
    }
}
