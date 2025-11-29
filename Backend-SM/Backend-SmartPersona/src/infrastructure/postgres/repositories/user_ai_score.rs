use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_ai_score::{UpsertUserAIScore, UserAIScoreEntity},
        repo::user_ai_score::UserAIScoreRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_ai_scores},
};

pub struct UserAIScorePostgres {
    db_pool: Arc<DbPool>,
}

impl UserAIScorePostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserAIScoreRepository for UserAIScorePostgres {
    async fn upsert(&self, data: UpsertUserAIScore) -> Result<UserAIScoreEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_ai_scores::table)
            .values(&data)
            .on_conflict(user_ai_scores::user_id)
            .do_update()
            .set(&data)
            .returning(UserAIScoreEntity::as_returning())
            .get_result::<UserAIScoreEntity>(&mut conn)?;

        Ok(result)
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Option<UserAIScoreEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_ai_scores::table
            .filter(user_ai_scores::user_id.eq(user_id))
            .select(UserAIScoreEntity::as_select())
            .first::<UserAIScoreEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }
}
