use crate::domain::{
    entities::admin_data::{DashboardStats, NewUsersTodayResponse},
    repo::admin_data::AdminRepository,
};
use anyhow::Result;
use std::sync::Arc;

pub struct AdminUseCase<T>
where
    T: AdminRepository + Send + Sync,
{
    admin_repository: Arc<T>,
}

impl<T> AdminUseCase<T>
where
    T: AdminRepository + Send + Sync,
{
    pub fn new(admin_repository: Arc<T>) -> Self {
        Self { admin_repository }
    }

    pub async fn get_new_users_today(&self) -> Result<NewUsersTodayResponse> {
        self.admin_repository.get_new_users_today().await
    }

    pub async fn get_dashboard_stats(&self) -> Result<DashboardStats> {
        self.admin_repository.get_dashboard_stats().await
    }

    pub async fn get_users_last_7_days(&self) -> Result<Vec<crate::domain::entities::admin_data::UserSummary>> {
        self.admin_repository.get_users_last_7_days().await
    }
}
