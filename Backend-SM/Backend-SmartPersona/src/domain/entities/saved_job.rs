use crate::infrastructure::postgres::schema::saved_jobs;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = saved_jobs)]
pub struct SavedJobEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub post_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = saved_jobs)]
pub struct NewSavedJob {
    pub id: Uuid,
    pub user_id: Uuid,
    pub post_id: Uuid,
}

impl NewSavedJob {
    pub fn new(user_id: Uuid, post_id: Uuid) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            post_id,
        }
    }
}

/// DTO สำหรับรับข้อมูลจาก API request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedJobRequest {
    pub post_id: String,
}

impl SavedJobRequest {
    pub fn into_new_saved_job(self, user_id: Uuid) -> Result<NewSavedJob, uuid::Error> {
        let post_id = Uuid::parse_str(&self.post_id)?;
        Ok(NewSavedJob::new(user_id, post_id))
    }
}

