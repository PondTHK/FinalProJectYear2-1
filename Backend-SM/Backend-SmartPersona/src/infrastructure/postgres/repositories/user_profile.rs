use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_profile::{NewUserProfile, UpdateUserProfile, UserProfileEntity},
        repo::user_profile::UserProfileRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_profiles},
};

pub struct UserProfilePostgres {
    db_pool: Arc<DbPool>,
}

impl UserProfilePostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserProfileRepository for UserProfilePostgres {
    async fn create(&self, new_profile: &NewUserProfile) -> Result<UserProfileEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_profiles::table)
            .values(new_profile)
            .returning(UserProfileEntity::as_returning())
            .get_result::<UserProfileEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserProfileEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_profiles::table
            .filter(user_profiles::user_id.eq(user_id))
            .first::<UserProfileEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserProfile,
    ) -> Result<UserProfileEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::update(user_profiles::table)
            .filter(user_profiles::user_id.eq(user_id))
            .set(update_data)
            .returning(UserProfileEntity::as_returning())
            .get_result::<UserProfileEntity>(&mut conn)?;

        Ok(result)
    }

    async fn upsert_by_user_id(
        &self,
        _user_id: Uuid,
        profile_data: &NewUserProfile,
    ) -> Result<UserProfileEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // ใช้ ON CONFLICT สำหรับ upsert (insert หรือ update อัตโนมัติ)
        let result = diesel::insert_into(user_profiles::table)
            .values(profile_data)
            .on_conflict(user_profiles::user_id)
            .do_update()
            .set((
                user_profiles::title.eq(&profile_data.title),
                user_profiles::first_name_th.eq(&profile_data.first_name_th),
                user_profiles::last_name_th.eq(&profile_data.last_name_th),
                user_profiles::first_name_en.eq(&profile_data.first_name_en),
                user_profiles::last_name_en.eq(&profile_data.last_name_en),
                user_profiles::gender.eq(&profile_data.gender),
                user_profiles::birth_date.eq(&profile_data.birth_date),
                user_profiles::religion.eq(&profile_data.religion),
                user_profiles::nationality.eq(&profile_data.nationality),
                user_profiles::phone.eq(&profile_data.phone),
                user_profiles::line_id.eq(&profile_data.line_id),
                user_profiles::email.eq(&profile_data.email),
                user_profiles::military_status.eq(&profile_data.military_status),
                user_profiles::is_disabled.eq(&profile_data.is_disabled),
                user_profiles::profile_image_url.eq(&profile_data.profile_image_url),
                user_profiles::cover_image_url.eq(&profile_data.cover_image_url),
                user_profiles::template.eq(&profile_data.template),
            ))
            .returning(UserProfileEntity::as_returning())
            .get_result::<UserProfileEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_profiles::table)
            .filter(user_profiles::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }
}
