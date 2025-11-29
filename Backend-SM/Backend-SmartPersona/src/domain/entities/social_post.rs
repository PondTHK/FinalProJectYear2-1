use crate::infrastructure::postgres::schema::social_posts;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = social_posts)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SocialPostEntity {
    pub id: Uuid,
    pub social_connection_id: Uuid,
    pub platform_post_id: String,
    pub content: String,
    pub posted_at: Option<DateTime<Utc>>,
    pub likes_count: Option<i32>,
    pub comments_count: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = social_posts)]
pub struct NewSocialPost {
    pub social_connection_id: Uuid,
    pub platform_post_id: String,
    pub content: String,
    pub posted_at: Option<DateTime<Utc>>,
    pub likes_count: Option<i32>,
    pub comments_count: Option<i32>,
}

#[derive(Debug, Clone, Default, AsChangeset, Deserialize)]
#[diesel(table_name = social_posts)]
pub struct UpdateSocialPost {
    pub content: Option<String>,
    pub posted_at: Option<DateTime<Utc>>,
    pub likes_count: Option<i32>,
    pub comments_count: Option<i32>,
}

