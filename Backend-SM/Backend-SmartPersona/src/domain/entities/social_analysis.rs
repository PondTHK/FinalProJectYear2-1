use crate::infrastructure::postgres::schema::social_analysis;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = social_analysis)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SocialAnalysisEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub social_connection_id: Uuid,
    pub big_five_scores: Value, // JSONB
    pub analyzed_posts: Option<Value>, // JSONB
    pub strengths: Option<Vec<Option<String>>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub work_style: Option<String>, // สไตล์การทำงาน
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = social_analysis)]
pub struct NewSocialAnalysis {
    pub user_id: Uuid,
    pub social_connection_id: Uuid,
    pub big_five_scores: Value,
    pub analyzed_posts: Option<Value>,
    pub strengths: Option<Vec<Option<String>>>,
    pub work_style: Option<String>,
}

#[derive(Debug, Clone, Default, AsChangeset, Deserialize)]
#[diesel(table_name = social_analysis)]
pub struct UpdateSocialAnalysis {
    pub big_five_scores: Option<Value>,
    pub analyzed_posts: Option<Value>,
    pub strengths: Option<Vec<Option<String>>>,
    pub work_style: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
}

// Helper structs for Big Five scores
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BigFiveScores {
    pub openness: f64,
    pub conscientiousness: f64,
    pub extraversion: f64,
    pub agreeableness: f64,
    pub neuroticism: f64,
}

