use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::company::{CompanyEntity, NewCompany, UpdateCompany},
        repo::company::CompanyRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::companies},
};

pub struct CompanyPostgres {
    db_pool: Arc<DbPool>,
}

impl CompanyPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl CompanyRepository for CompanyPostgres {
    async fn create(&self, new_company: &NewCompany) -> Result<CompanyEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(companies::table)
            .values(new_company)
            .returning(CompanyEntity::as_returning())
            .get_result::<CompanyEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<CompanyEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = companies::table
            .filter(companies::user_id.eq(user_id))
            .first::<CompanyEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<Option<CompanyEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = companies::table
            .filter(companies::id.eq(id))
            .first::<CompanyEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateCompany,
    ) -> Result<CompanyEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::update(companies::table)
            .filter(companies::user_id.eq(user_id))
            .set(update_data)
            .returning(CompanyEntity::as_returning())
            .get_result::<CompanyEntity>(&mut conn)?;

        Ok(result)
    }

    async fn upsert_by_user_id(
        &self,
        user_id: Uuid,
        company_data: &NewCompany,
    ) -> Result<CompanyEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // ใช้ ON CONFLICT สำหรับ upsert (insert หรือ update อัตโนมัติ)
        let result = diesel::insert_into(companies::table)
            .values(company_data)
            .on_conflict(companies::user_id)
            .do_update()
            .set((
                companies::company_name.eq(&company_data.company_name),
                companies::industry.eq(&company_data.industry),
                companies::email.eq(&company_data.email),
                companies::company_size.eq(&company_data.company_size),
                companies::description.eq(&company_data.description),
                companies::phone.eq(&company_data.phone),
                companies::address_detail.eq(&company_data.address_detail),
                companies::province.eq(&company_data.province),
                companies::district.eq(&company_data.district),
                companies::subdistrict.eq(&company_data.subdistrict),
                companies::postal_code.eq(&company_data.postal_code),
                companies::status.eq(&company_data.status),
                companies::logo_url.eq(&company_data.logo_url),
                companies::founded_year.eq(&company_data.founded_year),
                companies::mission.eq(&company_data.mission),
                companies::vision.eq(&company_data.vision),
                companies::is_verified.eq(&company_data.is_verified),
            ))
            .returning(CompanyEntity::as_returning())
            .get_result::<CompanyEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(companies::table)
            .filter(companies::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn get_all(&self) -> Result<Vec<CompanyEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = companies::table
            .order(companies::created_at.desc())
            .load::<CompanyEntity>(&mut conn)?;

        Ok(results)
    }
}
