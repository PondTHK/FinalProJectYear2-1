use crate::infrastructure::postgres::schema::user_privacy_settings;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = user_privacy_settings)]
#[serde(rename_all = "camelCase")]
pub struct UserPrivacySettingsEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub show_profile: bool,
    pub show_profile_image: bool,
    pub show_cover_image: bool,
    pub show_name: bool,
    pub show_title: bool,
    pub show_phone: bool,
    pub show_line_id: bool,
    pub show_email: bool,
    pub show_gender: bool,
    pub show_birth_date: bool,
    pub show_nationality: bool,
    pub show_religion: bool,
    pub show_military_status: bool,
    pub show_address: bool,
    pub show_experiences: bool,
    pub show_educations: bool,
    pub show_job_preference: bool,
    pub show_portfolios: bool,
    pub show_skills: bool,
    pub show_about_me: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_privacy_settings)]
pub struct NewUserPrivacySettings {
    pub id: Uuid,
    pub user_id: Uuid,
    pub show_profile: bool,
    pub show_profile_image: bool,
    pub show_cover_image: bool,
    pub show_name: bool,
    pub show_title: bool,
    pub show_phone: bool,
    pub show_line_id: bool,
    pub show_email: bool,
    pub show_gender: bool,
    pub show_birth_date: bool,
    pub show_nationality: bool,
    pub show_religion: bool,
    pub show_military_status: bool,
    pub show_address: bool,
    pub show_experiences: bool,
    pub show_educations: bool,
    pub show_job_preference: bool,
    pub show_portfolios: bool,
    pub show_skills: bool,
    pub show_about_me: bool,
}

impl NewUserPrivacySettings {
    pub fn new(user_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            show_profile: true,
            show_profile_image: true,
            show_cover_image: true,
            show_name: true,
            show_title: true,
            show_phone: false,
            show_line_id: false,
            show_email: false,
            show_gender: false,
            show_birth_date: false,
            show_nationality: true,
            show_religion: false,
            show_military_status: false,
            show_address: true,
            show_experiences: true,
            show_educations: true,
            show_job_preference: true,
            show_portfolios: true,
            show_skills: true,
            show_about_me: true,
        }
    }

    pub fn from_request(user_id: Uuid, request: UserPrivacySettingsRequest) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            show_profile: request.show_profile,
            show_profile_image: request.show_profile_image,
            show_cover_image: request.show_cover_image,
            show_name: request.show_name,
            show_title: request.show_title,
            show_phone: request.show_phone,
            show_line_id: request.show_line_id,
            show_email: request.show_email,
            show_gender: request.show_gender,
            show_birth_date: request.show_birth_date,
            show_nationality: request.show_nationality,
            show_religion: request.show_religion,
            show_military_status: request.show_military_status,
            show_address: request.show_address,
            show_experiences: request.show_experiences,
            show_educations: request.show_educations,
            show_job_preference: request.show_job_preference,
            show_portfolios: request.show_portfolios,
            show_skills: request.show_skills,
            show_about_me: request.show_about_me,
        }
    }
}

#[derive(Debug, Clone, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = user_privacy_settings)]
pub struct UpdateUserPrivacySettings {
    pub show_profile: Option<bool>,
    pub show_profile_image: Option<bool>,
    pub show_cover_image: Option<bool>,
    pub show_name: Option<bool>,
    pub show_title: Option<bool>,
    pub show_phone: Option<bool>,
    pub show_line_id: Option<bool>,
    pub show_email: Option<bool>,
    pub show_gender: Option<bool>,
    pub show_birth_date: Option<bool>,
    pub show_nationality: Option<bool>,
    pub show_religion: Option<bool>,
    pub show_military_status: Option<bool>,
    pub show_address: Option<bool>,
    pub show_experiences: Option<bool>,
    pub show_educations: Option<bool>,
    pub show_job_preference: Option<bool>,
    pub show_portfolios: Option<bool>,
    pub show_skills: Option<bool>,
    pub show_about_me: Option<bool>,
}

/// DTO สำหรับรับข้อมูลจาก API request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPrivacySettingsRequest {
    pub show_profile: bool,
    pub show_profile_image: bool,
    pub show_cover_image: bool,
    pub show_name: bool,
    pub show_title: bool,
    pub show_phone: bool,
    pub show_line_id: bool,
    pub show_email: bool,
    pub show_gender: bool,
    pub show_birth_date: bool,
    pub show_nationality: bool,
    pub show_religion: bool,
    pub show_military_status: bool,
    pub show_address: bool,
    pub show_experiences: bool,
    pub show_educations: bool,
    pub show_job_preference: bool,
    pub show_portfolios: bool,
    pub show_skills: bool,
    pub show_about_me: bool,
}

impl UserPrivacySettingsRequest {
    pub fn into_new_settings(self, user_id: Uuid) -> NewUserPrivacySettings {
        NewUserPrivacySettings::from_request(user_id, self)
    }

    pub fn into_update_settings(self) -> UpdateUserPrivacySettings {
        UpdateUserPrivacySettings {
            show_profile: Some(self.show_profile),
            show_profile_image: Some(self.show_profile_image),
            show_cover_image: Some(self.show_cover_image),
            show_name: Some(self.show_name),
            show_title: Some(self.show_title),
            show_phone: Some(self.show_phone),
            show_line_id: Some(self.show_line_id),
            show_email: Some(self.show_email),
            show_gender: Some(self.show_gender),
            show_birth_date: Some(self.show_birth_date),
            show_nationality: Some(self.show_nationality),
            show_religion: Some(self.show_religion),
            show_military_status: Some(self.show_military_status),
            show_address: Some(self.show_address),
            show_experiences: Some(self.show_experiences),
            show_educations: Some(self.show_educations),
            show_job_preference: Some(self.show_job_preference),
            show_portfolios: Some(self.show_portfolios),
            show_skills: Some(self.show_skills),
            show_about_me: Some(self.show_about_me),
        }
    }
}

