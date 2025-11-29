use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::company_gallery::{CompanyGalleryEntity, NewCompanyGallery},
        repo::company_gallery::CompanyGalleryRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::company_galleries},
};

pub struct CompanyGalleryPostgres {
    db_pool: Arc<DbPool>,
}

impl CompanyGalleryPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl CompanyGalleryRepository for CompanyGalleryPostgres {
    async fn create(&self, new_gallery: &NewCompanyGallery) -> Result<CompanyGalleryEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(company_galleries::table)
            .values(new_gallery)
            .returning(CompanyGalleryEntity::as_returning())
            .get_result::<CompanyGalleryEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_company_id(&self, company_id: Uuid) -> Result<Vec<CompanyGalleryEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = company_galleries::table
            .filter(company_galleries::company_id.eq(company_id))
            .order(company_galleries::created_at.desc())
            .load::<CompanyGalleryEntity>(&mut conn)?;

        Ok(results)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<Option<CompanyGalleryEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = company_galleries::table
            .filter(company_galleries::id.eq(id))
            .first::<CompanyGalleryEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(company_galleries::table)
            .filter(company_galleries::id.eq(id))
            .execute(&mut conn)?;

        Ok(())
    }
}
