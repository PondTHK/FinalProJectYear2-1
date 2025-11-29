use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::social_connection::{
            NewSocialConnection, SocialConnectionEntity, UpdateSocialConnection,
        },
        repo::social_connection::SocialConnectionRepository,
    },
    infrastructure::postgres::{
        postgres_connection::DbPool,
        schema::social_connections,
    },
};

pub struct SocialConnectionPostgres {
    db_pool: Arc<DbPool>,
}

impl SocialConnectionPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl SocialConnectionRepository for SocialConnectionPostgres {
    async fn create(&self, new_connection: &NewSocialConnection) -> Result<SocialConnectionEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(social_connections::table)
            .values(new_connection)
            .returning(SocialConnectionEntity::as_returning())
            .get_result::<SocialConnectionEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_and_platform(
        &self,
        user_id: Uuid,
        platform: &str,
    ) -> Result<Option<SocialConnectionEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = social_connections::table
            .filter(
                social_connections::user_id
                    .eq(user_id)
                    .and(social_connections::platform.eq(platform)),
            )
            .first::<SocialConnectionEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<Option<SocialConnectionEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = social_connections::table
            .filter(social_connections::id.eq(id))
            .first::<SocialConnectionEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<SocialConnectionEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = social_connections::table
            .filter(social_connections::user_id.eq(user_id))
            .order(social_connections::created_at.desc())
            .load::<SocialConnectionEntity>(&mut conn)?;

        Ok(results)
    }

    async fn update(
        &self,
        id: Uuid,
        update_data: &UpdateSocialConnection,
    ) -> Result<SocialConnectionEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::update(social_connections::table)
            .filter(social_connections::id.eq(id))
            .set(update_data)
            .returning(SocialConnectionEntity::as_returning())
            .get_result::<SocialConnectionEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(social_connections::table)
            .filter(social_connections::id.eq(id))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_by_user_and_platform(
        &self,
        user_id: Uuid,
        platform: &str,
    ) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(social_connections::table)
            .filter(
                social_connections::user_id
                    .eq(user_id)
                    .and(social_connections::platform.eq(platform)),
            )
            .execute(&mut conn)?;

        Ok(())
    }
}

