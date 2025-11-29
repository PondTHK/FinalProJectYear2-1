use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_job_preference::{
            NewUserJobPreference, UpdateUserJobPreference, UserJobPreferenceEntity,
        },
        repo::user_job_preference::UserJobPreferenceRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_job_preferences},
};

pub struct UserJobPreferencePostgres {
    db_pool: Arc<DbPool>,
}

impl UserJobPreferencePostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserJobPreferenceRepository for UserJobPreferencePostgres {
    async fn create(
        &self,
        new_preference: &NewUserJobPreference,
    ) -> Result<UserJobPreferenceEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_job_preferences::table)
            .values(new_preference)
            .returning(UserJobPreferenceEntity::as_returning())
            .get_result::<UserJobPreferenceEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserJobPreferenceEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_job_preferences::table
            .filter(user_job_preferences::user_id.eq(user_id))
            .first::<UserJobPreferenceEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_all_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserJobPreferenceEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = user_job_preferences::table
            .filter(user_job_preferences::user_id.eq(user_id))
            .order(user_job_preferences::created_at.desc())
            .load::<UserJobPreferenceEntity>(&mut conn)?;

        Ok(results)
    }

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserJobPreference,
    ) -> Result<UserJobPreferenceEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::update(user_job_preferences::table)
            .filter(user_job_preferences::user_id.eq(user_id))
            .set(update_data)
            .returning(UserJobPreferenceEntity::as_returning())
            .get_result::<UserJobPreferenceEntity>(&mut conn)?;

        Ok(result)
    }

    async fn upsert_by_user_id(
        &self,
        _user_id: Uuid,
        preference_data: &NewUserJobPreference,
    ) -> Result<UserJobPreferenceEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Since we removed unique constraint, we can just insert (allow multiple preferences per user)
        let result = diesel::insert_into(user_job_preferences::table)
            .values(preference_data)
            .returning(UserJobPreferenceEntity::as_returning())
            .get_result::<UserJobPreferenceEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_job_preferences::table)
            .filter(user_job_preferences::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_by_id(&self, id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_job_preferences::table)
            .filter(user_job_preferences::id.eq(id))
            .execute(&mut conn)?;

        Ok(())
    }
}
