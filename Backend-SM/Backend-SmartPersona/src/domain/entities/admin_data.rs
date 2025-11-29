use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::entities::user::{Role, UserEntity};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewUsersTodayResponse {
    pub count: usize,
    pub users: Vec<UserSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserGrowthData {
    pub date: String,
    pub new_users: i64,
    pub total_users: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_users: i64,
    pub total_companies: i64,
    pub total_job_posts: i64,
    pub new_users_today: usize,
    pub active_users_last_7_days: i64,
    pub average_users_per_day: f64,
    pub user_growth: Vec<UserGrowthData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSummary {
    pub id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub role: Role,
    pub created_at: DateTime<Utc>,
}

impl From<UserEntity> for UserSummary {
    fn from(user: UserEntity) -> Self {
        Self {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
            created_at: user.created_at.and_utc(),
        }
    }
}
