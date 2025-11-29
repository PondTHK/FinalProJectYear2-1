use crate::infrastructure::postgres::schema::user_job_matches;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = user_job_matches)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UserJobMatchEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub job_id: Uuid,
    pub match_score: i32,
    pub analysis: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_job_matches)]
pub struct NewUserJobMatch {
    pub user_id: Uuid,
    pub job_id: Uuid,
    pub match_score: i32,
    pub analysis: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserJobMatchRequest {
    pub job_id: Uuid,
    pub match_score: i32,
    pub analysis: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveJobMatchesRequest {
    pub matches: Vec<CreateUserJobMatchRequest>,
}
