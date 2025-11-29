use crate::infrastructure::postgres::schema::user_portfolios;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = user_portfolios)]
pub struct UserPortfolioEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub link: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_portfolios)]
pub struct NewUserPortfolio {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub link: Option<String>,
}

impl NewUserPortfolio {
    pub fn new(
        user_id: Uuid,
        title: String,
        description: Option<String>,
        image_url: Option<String>,
        link: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            title,
            description,
            image_url,
            link,
        }
    }
}

#[derive(Debug, Clone, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = user_portfolios)]
pub struct UpdateUserPortfolio {
    pub title: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub link: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี id และ user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPortfolioRequest {
    pub title: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub link: Option<String>,
}

impl UserPortfolioRequest {
    /// แปลง Request DTO เป็น NewUserPortfolio พร้อม user_id
    pub fn into_new_portfolio(self, user_id: Uuid) -> NewUserPortfolio {
        NewUserPortfolio {
            id: Uuid::new_v4(),
            user_id,
            title: self.title,
            description: self.description,
            image_url: self.image_url,
            link: self.link,
        }
    }

    /// แปลง Request DTO เป็น UpdateUserPortfolio
    pub fn into_update_portfolio(self) -> UpdateUserPortfolio {
        UpdateUserPortfolio {
            title: Some(self.title),
            description: self.description,
            image_url: self.image_url,
            link: self.link,
            updated_at: Some(Utc::now()),
        }
    }
}

