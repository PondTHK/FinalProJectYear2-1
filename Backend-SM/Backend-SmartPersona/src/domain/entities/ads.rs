use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::infrastructure::postgres::schema::ads;

#[derive(Queryable, Serialize, Deserialize, Debug, Clone)]
pub struct AdsEntity {
    pub id: Uuid,
    pub title: String,
    pub sponsor_name: Option<String>,
    pub sponsor_tag: Option<String>,
    pub profile_image_url: Option<String>,
    pub details: Option<String>,
    pub link_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: Option<String>,
}

#[derive(Insertable, Debug)]
#[diesel(table_name = ads)]
pub struct NewAds {
    pub title: String,
    pub sponsor_name: Option<String>,
    pub sponsor_tag: Option<String>,
    pub profile_image_url: Option<String>,
    pub details: Option<String>,
    pub link_url: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CreateAdsRequest {
    pub title: String,
    pub sponsor_name: Option<String>,
    pub sponsor_tag: Option<String>,
    pub profile_image_url: Option<String>,
    pub details: Option<String>,
    pub link_url: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: Option<String>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct UpdateAdsRequest {
    pub title: Option<String>,
    pub sponsor_name: Option<String>,
    pub sponsor_tag: Option<String>,
    pub profile_image_url: Option<String>,
    pub details: Option<String>,
    pub link_url: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: Option<String>,
}
