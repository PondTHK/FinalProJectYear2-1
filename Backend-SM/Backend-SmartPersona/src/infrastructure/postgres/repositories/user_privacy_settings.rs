use anyhow::Result;
use axum::async_trait;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_privacy_settings::{
            NewUserPrivacySettings, UpdateUserPrivacySettings, UserPrivacySettingsEntity,
        },
        repo::user_privacy_settings::UserPrivacySettingsRepository,
    },
    infrastructure::postgres::{
        postgres_connection::DbPool,
        schema::user_privacy_settings,
    },
};

pub struct UserPrivacySettingsPostgres {
    db_pool: Arc<DbPool>,
}

impl UserPrivacySettingsPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserPrivacySettingsRepository for UserPrivacySettingsPostgres {
    async fn create(
        &self,
        new_settings: &NewUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_privacy_settings::table)
            .values(new_settings)
            .returning(UserPrivacySettingsEntity::as_returning())
            .get_result::<UserPrivacySettingsEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserPrivacySettingsEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_privacy_settings::table
            .filter(user_privacy_settings::user_id.eq(user_id))
            .first::<UserPrivacySettingsEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::update(user_privacy_settings::table)
            .filter(user_privacy_settings::user_id.eq(user_id))
            .set(update_data)
            .returning(UserPrivacySettingsEntity::as_returning())
            .get_result::<UserPrivacySettingsEntity>(&mut conn)?;

        Ok(result)
    }

    async fn upsert_by_user_id(
        &self,
        _user_id: Uuid,
        settings_data: &NewUserPrivacySettings,
    ) -> Result<UserPrivacySettingsEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // ใช้ ON CONFLICT สำหรับ upsert (insert หรือ update อัตโนมัติ)
        let result = diesel::insert_into(user_privacy_settings::table)
            .values(settings_data)
            .on_conflict(user_privacy_settings::user_id)
            .do_update()
            .set((
                user_privacy_settings::show_profile.eq(&settings_data.show_profile),
                user_privacy_settings::show_profile_image.eq(&settings_data.show_profile_image),
                user_privacy_settings::show_cover_image.eq(&settings_data.show_cover_image),
                user_privacy_settings::show_name.eq(&settings_data.show_name),
                user_privacy_settings::show_title.eq(&settings_data.show_title),
                user_privacy_settings::show_phone.eq(&settings_data.show_phone),
                user_privacy_settings::show_line_id.eq(&settings_data.show_line_id),
                user_privacy_settings::show_email.eq(&settings_data.show_email),
                user_privacy_settings::show_gender.eq(&settings_data.show_gender),
                user_privacy_settings::show_birth_date.eq(&settings_data.show_birth_date),
                user_privacy_settings::show_nationality.eq(&settings_data.show_nationality),
                user_privacy_settings::show_religion.eq(&settings_data.show_religion),
                user_privacy_settings::show_military_status.eq(&settings_data.show_military_status),
                user_privacy_settings::show_address.eq(&settings_data.show_address),
                user_privacy_settings::show_experiences.eq(&settings_data.show_experiences),
                user_privacy_settings::show_educations.eq(&settings_data.show_educations),
                user_privacy_settings::show_job_preference.eq(&settings_data.show_job_preference),
                user_privacy_settings::show_portfolios.eq(&settings_data.show_portfolios),
                user_privacy_settings::show_skills.eq(&settings_data.show_skills),
                user_privacy_settings::show_about_me.eq(&settings_data.show_about_me),
            ))
            .returning(UserPrivacySettingsEntity::as_returning())
            .get_result::<UserPrivacySettingsEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_privacy_settings::table)
            .filter(user_privacy_settings::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }
}


