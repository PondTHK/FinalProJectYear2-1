use anyhow::Result;
use axum::async_trait;
use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_skill::{NewUserSkill, UpdateUserSkill, UserSkillEntity},
        repo::user_skill::UserSkillRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_skills},
};

pub struct UserSkillPostgres {
    db_pool: Arc<DbPool>,
}

impl UserSkillPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserSkillRepository for UserSkillPostgres {
    async fn create(&self, new_skill: &NewUserSkill) -> Result<UserSkillEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_skills::table)
            .values(new_skill)
            .returning(UserSkillEntity::as_returning())
            .get_result::<UserSkillEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserSkillEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_skills::table
            .filter(user_skills::user_id.eq(user_id))
            .first::<UserSkillEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserSkill,
    ) -> Result<UserSkillEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Ensure updated_at is set
        let mut data = update_data.clone();
        if data.updated_at.is_none() {
            data.updated_at = Some(Utc::now());
        }

        let result = diesel::update(user_skills::table)
            .filter(user_skills::user_id.eq(user_id))
            .set(&data)
            .returning(UserSkillEntity::as_returning())
            .get_result::<UserSkillEntity>(&mut conn)?;

        Ok(result)
    }

    async fn upsert(&self, user_id: Uuid, skills: &NewUserSkill) -> Result<UserSkillEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Check if record exists
        let existing = user_skills::table
            .filter(user_skills::user_id.eq(user_id))
            .first::<UserSkillEntity>(&mut conn)
            .optional()?;

        if existing.is_some() {
            // Update existing record
            let result = diesel::update(user_skills::table)
                .filter(user_skills::user_id.eq(user_id))
                .set((
                    user_skills::skills.eq(&skills.skills),
                    user_skills::updated_at.eq(Utc::now()),
                ))
                .returning(UserSkillEntity::as_returning())
                .get_result::<UserSkillEntity>(&mut conn)?;
            Ok(result)
        } else {
            // Create new record
            let result = diesel::insert_into(user_skills::table)
                .values(skills)
                .returning(UserSkillEntity::as_returning())
                .get_result::<UserSkillEntity>(&mut conn)?;
            Ok(result)
        }
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_skills::table)
            .filter(user_skills::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }
}

