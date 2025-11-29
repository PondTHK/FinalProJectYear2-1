use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::saved_job::{NewSavedJob, SavedJobEntity},
        repo::saved_job::SavedJobRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::saved_jobs},
};

pub struct SavedJobPostgres {
    db_pool: Arc<DbPool>,
}

impl SavedJobPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl SavedJobRepository for SavedJobPostgres {
    async fn create(&self, new_saved_job: &NewSavedJob) -> Result<SavedJobEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(saved_jobs::table)
            .values(new_saved_job)
            .on_conflict((saved_jobs::user_id, saved_jobs::post_id))
            .do_nothing()
            .returning(SavedJobEntity::as_returning())
            .get_result::<SavedJobEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<SavedJobEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = saved_jobs::table
            .filter(saved_jobs::user_id.eq(user_id))
            .order(saved_jobs::created_at.desc())
            .load::<SavedJobEntity>(&mut conn)?;

        Ok(results)
    }

    async fn exists(&self, user_id: Uuid, post_id: Uuid) -> Result<bool> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let count: i64 = saved_jobs::table
            .filter(
                saved_jobs::user_id
                    .eq(user_id)
                    .and(saved_jobs::post_id.eq(post_id)),
            )
            .count()
            .get_result(&mut conn)?;

        Ok(count > 0)
    }

    async fn delete(&self, user_id: Uuid, post_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(saved_jobs::table)
            .filter(
                saved_jobs::user_id
                    .eq(user_id)
                    .and(saved_jobs::post_id.eq(post_id)),
            )
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_by_id(&self, id: Uuid, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(saved_jobs::table)
            .filter(
                saved_jobs::id
                    .eq(id)
                    .and(saved_jobs::user_id.eq(user_id)),
            )
            .execute(&mut conn)?;

        Ok(())
    }
}

