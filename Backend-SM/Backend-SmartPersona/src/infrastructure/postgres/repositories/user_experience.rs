use anyhow::Result;
use axum::async_trait;
use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_experience::{NewUserExperience, UpdateUserExperience, UserExperienceEntity},
        repo::user_experience::UserExperienceRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_experiences},
};

pub struct UserExperiencePostgres {
    db_pool: Arc<DbPool>,
}

impl UserExperiencePostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserExperienceRepository for UserExperiencePostgres {
    async fn create(&self, new_experience: &NewUserExperience) -> Result<UserExperienceEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_experiences::table)
            .values(new_experience)
            .returning(UserExperienceEntity::as_returning())
            .get_result::<UserExperienceEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserExperienceEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = user_experiences::table
            .filter(user_experiences::user_id.eq(user_id))
            .order(user_experiences::start_date.desc())
            .load::<UserExperienceEntity>(&mut conn)?;

        Ok(results)
    }

    async fn get_by_key(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<Option<UserExperienceEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_experiences::table
            .filter(
                user_experiences::user_id
                    .eq(user_id)
                    .and(user_experiences::company.eq(company))
                    .and(user_experiences::start_date.eq(start_date)),
            )
            .first::<UserExperienceEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_key(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserExperience,
    ) -> Result<UserExperienceEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Ensure updated_at is set
        let mut data = update_data.clone();
        if data.updated_at.is_none() {
            data.updated_at = Some(Utc::now());
        }

        let result = diesel::update(user_experiences::table)
            .filter(
                user_experiences::user_id
                    .eq(user_id)
                    .and(user_experiences::company.eq(company))
                    .and(user_experiences::start_date.eq(start_date)),
            )
            .set(&data)
            .returning(UserExperienceEntity::as_returning())
            .get_result::<UserExperienceEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_key(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_experiences::table)
            .filter(
                user_experiences::user_id
                    .eq(user_id)
                    .and(user_experiences::company.eq(company))
                    .and(user_experiences::start_date.eq(start_date)),
            )
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_experiences::table)
            .filter(user_experiences::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn add_experience(&self, new_experience: &NewUserExperience) -> Result<UserExperienceEntity> {
        // Same as create - just an alias for semantic clarity
        self.create(new_experience).await
    }

    async fn update_existing_experience(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserExperience,
    ) -> Result<UserExperienceEntity> {
        // Same as update_by_key - just an alias for semantic clarity
        self.update_by_key(user_id, company, start_date, update_data)
            .await
    }
}

