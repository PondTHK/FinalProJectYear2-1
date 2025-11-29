use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::company_post::{CompanyPostEntity, NewCompanyPost, UpdateCompanyPost},
        repo::company_post::CompanyPostRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::company_posts},
};

pub struct CompanyPostPostgres {
    db_pool: Arc<DbPool>,
}

impl CompanyPostPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl CompanyPostRepository for CompanyPostPostgres {
    async fn create(&self, new_post: &NewCompanyPost) -> Result<CompanyPostEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(company_posts::table)
            .values(new_post)
            .returning(CompanyPostEntity::as_returning())
            .get_result::<CompanyPostEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_company_id(&self, company_id: Uuid) -> Result<Vec<CompanyPostEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = company_posts::table
            .filter(company_posts::company_id.eq(company_id))
            .order(company_posts::created_at.desc())
            .select(CompanyPostEntity::as_select())
            .load::<CompanyPostEntity>(&mut conn)?;

        Ok(results)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<Option<CompanyPostEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = company_posts::table
            .filter(company_posts::id.eq(id))
            .select(CompanyPostEntity::as_select())
            .first::<CompanyPostEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_all(&self) -> Result<Vec<CompanyPostEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = company_posts::table
            .order(company_posts::created_at.desc())
            .select(CompanyPostEntity::as_select())
            .load::<CompanyPostEntity>(&mut conn)?;

        Ok(results)
    }

    async fn update(&self, id: Uuid, update_data: &UpdateCompanyPost) -> Result<CompanyPostEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::update(company_posts::table)
            .filter(company_posts::id.eq(id))
            .set(update_data)
            .returning(CompanyPostEntity::as_returning())
            .get_result::<CompanyPostEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(company_posts::table)
            .filter(company_posts::id.eq(id))
            .execute(&mut conn)?;

        Ok(())
    }
}
