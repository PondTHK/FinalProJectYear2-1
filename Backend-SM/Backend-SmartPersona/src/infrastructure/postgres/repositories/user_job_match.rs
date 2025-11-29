use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use diesel::upsert::excluded;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_job_match::{NewUserJobMatch, UserJobMatchEntity},
        repo::user_job_match::UserJobMatchRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_job_matches},
};

pub struct UserJobMatchPostgres {
    pool: Arc<DbPool>,
}

impl UserJobMatchPostgres {
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserJobMatchRepository for UserJobMatchPostgres {
    async fn create(&self, new_match: &NewUserJobMatch) -> Result<UserJobMatchEntity> {
        let mut conn = self.pool.get()?;
        let result = diesel::insert_into(user_job_matches::table)
            .values(new_match)
            .on_conflict((user_job_matches::user_id, user_job_matches::job_id))
            .do_update()
            .set((
                user_job_matches::match_score.eq(new_match.match_score),
                user_job_matches::analysis.eq(&new_match.analysis),
                user_job_matches::updated_at.eq(diesel::dsl::now),
            ))
            .get_result(&mut conn)?;
        Ok(result)
    }

    async fn create_many(&self, new_matches: &[NewUserJobMatch]) -> Result<Vec<UserJobMatchEntity>> {
        let mut conn = self.pool.get()?;
        let results = diesel::insert_into(user_job_matches::table)
            .values(new_matches)
            .on_conflict((user_job_matches::user_id, user_job_matches::job_id))
            .do_update()
            .set((
                user_job_matches::match_score.eq(excluded(user_job_matches::match_score)),
                user_job_matches::analysis.eq(excluded(user_job_matches::analysis)),
                user_job_matches::updated_at.eq(diesel::dsl::now),
            ))
            .get_results(&mut conn)?;
        Ok(results)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserJobMatchEntity>> {
        let mut conn = self.pool.get()?;
        let results = user_job_matches::table
            .filter(user_job_matches::user_id.eq(user_id))
            .order(user_job_matches::match_score.desc())
            .load::<UserJobMatchEntity>(&mut conn)?;
        Ok(results)
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = self.pool.get()?;
        diesel::delete(user_job_matches::table.filter(user_job_matches::user_id.eq(user_id)))
            .execute(&mut conn)?;
        Ok(())
    }
}
