use crate::infrastructure::postgres::schema::social_connections;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = social_connections)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SocialConnectionEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub platform: String,
    pub platform_user_id: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub name: Option<String>,
    pub profile_image: Option<String>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = social_connections)]
pub struct NewSocialConnection {
    pub user_id: Uuid,
    pub platform: String,
    pub platform_user_id: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub name: Option<String>,
    pub profile_image: Option<String>,
}

#[derive(Debug, Clone, Default, AsChangeset, Deserialize)]
#[diesel(table_name = social_connections)]
pub struct UpdateSocialConnection {
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub name: Option<String>,
    pub profile_image: Option<String>,
}

