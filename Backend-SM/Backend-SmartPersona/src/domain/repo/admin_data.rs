use crate::domain::entities::admin_data::{DashboardStats, NewUsersTodayResponse, UserSummary};
use anyhow::Result;
use axum::async_trait;

#[async_trait]
pub trait AdminRepository: Send + Sync {
    async fn get_new_users_today(&self) -> Result<NewUsersTodayResponse>;
    async fn get_dashboard_stats(&self) -> Result<DashboardStats>;
    async fn get_total_users(&self) -> Result<i64>;
    async fn get_total_companies(&self) -> Result<i64>;
    async fn get_total_job_posts(&self) -> Result<i64>;
    async fn get_users_count_last_7_days(&self) -> Result<i64>;
    async fn get_users_last_7_days(
        &self,
    ) -> Result<Vec<UserSummary>>;
}
