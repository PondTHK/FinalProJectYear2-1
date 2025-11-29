use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::social_post::{NewSocialPost, SocialPostEntity, UpdateSocialPost},
        repo::social_post::SocialPostRepository,
    },
    infrastructure::postgres::{
        postgres_connection::DbPool,
        schema::social_posts,
    },
};

pub struct SocialPostPostgres {
    db_pool: Arc<DbPool>,
}

impl SocialPostPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl SocialPostRepository for SocialPostPostgres {
    async fn create(&self, new_post: &NewSocialPost) -> Result<SocialPostEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(social_posts::table)
            .values(new_post)
            .returning(SocialPostEntity::as_returning())
            .get_result::<SocialPostEntity>(&mut conn)?;

        Ok(result)
    }

    async fn create_batch(&self, posts: &[NewSocialPost]) -> Result<Vec<SocialPostEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = diesel::insert_into(social_posts::table)
            .values(posts)
            .returning(SocialPostEntity::as_returning())
            .get_results::<SocialPostEntity>(&mut conn)?;

        Ok(results)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<Option<SocialPostEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = social_posts::table
            .filter(social_posts::id.eq(id))
            .first::<SocialPostEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_by_connection_id(
        &self,
        connection_id: Uuid,
    ) -> Result<Vec<SocialPostEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = social_posts::table
            .filter(social_posts::social_connection_id.eq(connection_id))
            .order(social_posts::posted_at.desc().nulls_last())
            .load::<SocialPostEntity>(&mut conn)?;

        Ok(results)
    }

    async fn get_by_platform_post_id(
        &self,
        connection_id: Uuid,
        platform_post_id: &str,
    ) -> Result<Option<SocialPostEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = social_posts::table
            .filter(
                social_posts::social_connection_id
                    .eq(connection_id)
                    .and(social_posts::platform_post_id.eq(platform_post_id)),
            )
            .first::<SocialPostEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update(&self, id: Uuid, update_data: &UpdateSocialPost) -> Result<SocialPostEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::update(social_posts::table)
            .filter(social_posts::id.eq(id))
            .set(update_data)
            .returning(SocialPostEntity::as_returning())
            .get_result::<SocialPostEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(social_posts::table)
            .filter(social_posts::id.eq(id))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_by_connection_id(&self, connection_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(social_posts::table)
            .filter(social_posts::social_connection_id.eq(connection_id))
            .execute(&mut conn)?;

        Ok(())
    }
}

