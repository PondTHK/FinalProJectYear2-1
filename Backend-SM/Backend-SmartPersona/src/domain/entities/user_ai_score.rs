use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::postgres::schema::user_ai_scores)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UserAIScoreEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub score: i32,
    pub recommended_position: String,
    pub analysis: String,
    pub education_score: Option<i32>,
    pub experience_score: Option<i32>,
    pub skill_score: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub level: Option<String>,
}

#[derive(Debug, Clone, Insertable, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::postgres::schema::user_ai_scores)]
pub struct UpsertUserAIScore {
    pub user_id: Uuid,
    pub score: i32,
    pub recommended_position: String,
    pub analysis: String,
    pub education_score: Option<i32>,
    pub experience_score: Option<i32>,
    pub skill_score: Option<i32>,
    pub level: Option<String>,
    pub updated_at: NaiveDateTime,
}
