use anyhow::Result;
use axum::async_trait;
use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::social_analysis::{
            NewSocialAnalysis, SocialAnalysisEntity, UpdateSocialAnalysis,
        },
        repo::social_analysis::SocialAnalysisRepository,
    },
    infrastructure::postgres::{
        postgres_connection::DbPool,
        schema::social_analysis,
    },
};

pub struct SocialAnalysisPostgres {
    db_pool: Arc<DbPool>,
}

impl SocialAnalysisPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }

    fn create_internal(
        conn: &mut PgConnection,
        new_analysis: &NewSocialAnalysis,
    ) -> Result<SocialAnalysisEntity> {
        let result = diesel::insert_into(social_analysis::table)
            .values(new_analysis)
            .returning(SocialAnalysisEntity::as_returning())
            .get_result::<SocialAnalysisEntity>(conn)?;

        Ok(result)
    }

    fn update_internal(
        conn: &mut PgConnection,
        id: Uuid,
        update_data: &UpdateSocialAnalysis,
    ) -> Result<SocialAnalysisEntity> {
        // Ensure updated_at is set
        let mut data = update_data.clone();
        if data.updated_at.is_none() {
            data.updated_at = Some(Utc::now());
        }

        let result = diesel::update(social_analysis::table)
            .filter(social_analysis::id.eq(id))
            .set(&data)
            .returning(SocialAnalysisEntity::as_returning())
            .get_result::<SocialAnalysisEntity>(conn)?;

        Ok(result)
    }
}

#[async_trait]
impl SocialAnalysisRepository for SocialAnalysisPostgres {
    async fn create(&self, new_analysis: &NewSocialAnalysis) -> Result<SocialAnalysisEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        Self::create_internal(&mut conn, new_analysis)
    }

    async fn get_by_user_and_connection(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
    ) -> Result<Option<SocialAnalysisEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = social_analysis::table
            .filter(
                social_analysis::user_id
                    .eq(user_id)
                    .and(social_analysis::social_connection_id.eq(connection_id)),
            )
            .first::<SocialAnalysisEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_by_id(&self, id: Uuid) -> Result<Option<SocialAnalysisEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = social_analysis::table
            .filter(social_analysis::id.eq(id))
            .first::<SocialAnalysisEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<SocialAnalysisEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = social_analysis::table
            .filter(social_analysis::user_id.eq(user_id))
            .order(social_analysis::created_at.desc())
            .load::<SocialAnalysisEntity>(&mut conn)?;

        Ok(results)
    }

    async fn update(
        &self,
        id: Uuid,
        update_data: &UpdateSocialAnalysis,
    ) -> Result<SocialAnalysisEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        Self::update_internal(&mut conn, id, update_data)
    }

    async fn upsert(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
        analysis_data: &NewSocialAnalysis,
    ) -> Result<SocialAnalysisEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Try to get existing analysis
        let existing = social_analysis::table
            .filter(
                social_analysis::user_id
                    .eq(user_id)
                    .and(social_analysis::social_connection_id.eq(connection_id)),
            )
            .first::<SocialAnalysisEntity>(&mut conn)
            .optional()?;

        if let Some(existing_analysis) = existing {
            // Update existing
            let update_data = UpdateSocialAnalysis {
                big_five_scores: Some(analysis_data.big_five_scores.clone()),
                analyzed_posts: analysis_data.analyzed_posts.clone(),
                strengths: analysis_data.strengths.clone(),
                work_style: analysis_data.work_style.clone(),
                updated_at: Some(Utc::now()),
            };

            Self::update_internal(&mut conn, existing_analysis.id, &update_data)
        } else {
            // Create new
            Self::create_internal(&mut conn, analysis_data)
        }
    }

    async fn delete(&self, id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(social_analysis::table)
            .filter(social_analysis::id.eq(id))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_by_user_and_connection(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
    ) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(social_analysis::table)
            .filter(
                social_analysis::user_id
                    .eq(user_id)
                    .and(social_analysis::social_connection_id.eq(connection_id)),
            )
            .execute(&mut conn)?;

        Ok(())
    }
}

