use crate::infrastructure::postgres::schema::user_job_preferences;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = user_job_preferences)]
pub struct UserJobPreferenceEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub position: String,
    pub work_time: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub industry: Option<String>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_job_preferences)]
pub struct NewUserJobPreference {
    pub id: Uuid,
    pub user_id: Uuid,
    pub position: String,
    pub work_time: Option<String>,
    pub industry: Option<String>,
}

impl NewUserJobPreference {
    pub fn new(user_id: Uuid, industry: Option<String>, position: String, work_time: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            position,
            work_time,
            industry,
        }
    }
}

#[derive(Debug, Clone, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = user_job_preferences)]
pub struct UpdateUserJobPreference {
    pub industry: Option<String>,
    pub position: Option<String>,
    pub work_time: Option<String>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี id และ user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserJobPreferenceRequest {
    pub industry: Option<String>,
    pub position: String,
    pub work_time: Option<String>,
}

impl UserJobPreferenceRequest {
    /// แปลง Request DTO เป็น NewUserJobPreference พร้อม user_id
    pub fn into_new_preference(self, user_id: Uuid) -> NewUserJobPreference {
        NewUserJobPreference {
            id: Uuid::new_v4(),
            user_id,
            position: self.position,
            work_time: self.work_time,
            industry: self.industry,
        }
    }

    /// แปลง Request DTO เป็น UpdateUserJobPreference
    pub fn into_update_preference(self) -> UpdateUserJobPreference {
        UpdateUserJobPreference {
            industry: self.industry,
            position: Some(self.position),
            work_time: self.work_time,
        }
    }
}
