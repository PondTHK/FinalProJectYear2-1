use anyhow::Result;
use axum::async_trait;
use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_education::{NewUserEducation, UpdateUserEducation, UserEducationEntity},
        repo::user_education::UserEducationRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_educations},
};

pub struct UserEducationPostgres {
    db_pool: Arc<DbPool>,
}

impl UserEducationPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserEducationRepository for UserEducationPostgres {
    async fn create(&self, new_education: &NewUserEducation) -> Result<UserEducationEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_educations::table)
            .values(new_education)
            .returning(UserEducationEntity::as_returning())
            .get_result::<UserEducationEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserEducationEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = user_educations::table
            .filter(user_educations::user_id.eq(user_id))
            .order(user_educations::start_date.desc())
            .load::<UserEducationEntity>(&mut conn)?;

        Ok(results)
    }

    async fn get_by_key(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<Option<UserEducationEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_educations::table
            .filter(
                user_educations::user_id
                    .eq(user_id)
                    .and(user_educations::school.eq(school))
                    .and(user_educations::start_date.eq(start_date)),
            )
            .first::<UserEducationEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_key(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserEducation,
    ) -> Result<UserEducationEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Ensure updated_at is set
        let mut data = update_data.clone();
        if data.updated_at.is_none() {
            data.updated_at = Some(Utc::now());
        }

        let result = diesel::update(user_educations::table)
            .filter(
                user_educations::user_id
                    .eq(user_id)
                    .and(user_educations::school.eq(school))
                    .and(user_educations::start_date.eq(start_date)),
            )
            .set(&data)
            .returning(UserEducationEntity::as_returning())
            .get_result::<UserEducationEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_key(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
    ) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_educations::table)
            .filter(
                user_educations::user_id
                    .eq(user_id)
                    .and(user_educations::school.eq(school))
                    .and(user_educations::start_date.eq(start_date)),
            )
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_educations::table)
            .filter(user_educations::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn add_education(&self, new_education: &NewUserEducation) -> Result<UserEducationEntity> {
        // Same as create - just an alias for semantic clarity
        self.create(new_education).await
    }

    async fn update_existing_education(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: chrono::NaiveDate,
        update_data: &UpdateUserEducation,
    ) -> Result<UserEducationEntity> {
        // Same as update_by_key - just an alias for semantic clarity
        self.update_by_key(user_id, school, start_date, update_data)
            .await
    }
}
