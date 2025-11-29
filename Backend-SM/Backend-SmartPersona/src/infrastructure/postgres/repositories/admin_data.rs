use anyhow::{Ok, Result};
use axum::async_trait;
use chrono::{Duration, NaiveDate, Utc};
use diesel::{dsl::count_star, prelude::*};
use std::sync::Arc;

use crate::{
    domain::{
        entities::{
            admin_data::{DashboardStats, NewUsersTodayResponse, UserSummary, UserGrowthData},
            user::UserEntity,
        },
        repo::admin_data::AdminRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::{users, companies, company_posts}},
};

pub struct AdminPostgres {
    db_pool: Arc<DbPool>,
}

impl AdminPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl AdminRepository for AdminPostgres {
    async fn get_new_users_today(&self) -> Result<NewUsersTodayResponse> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let today = Utc::now().date_naive();

        let users = users::table
            .filter(users::created_at.ge(today.and_hms_opt(0, 0, 0).unwrap()))
            .filter(users::created_at.lt(today.and_hms_opt(23, 59, 59).unwrap()))
            .select(UserEntity::as_select())
            .load::<UserEntity>(&mut conn)?;

        let user_summaries: Vec<UserSummary> = users.into_iter().map(|u| u.into()).collect();
        let count = user_summaries.len();

        Ok(NewUsersTodayResponse {
            count,
            users: user_summaries,
        })
    }
    async fn get_total_users(&self) -> Result<i64> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let count: i64 = users::table.select(count_star()).first(&mut conn)?;
        Ok(count)
    }

    async fn get_total_companies(&self) -> Result<i64> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let count: i64 = companies::table.select(count_star()).first(&mut conn)?;
        Ok(count)
    }

    async fn get_total_job_posts(&self) -> Result<i64> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let count: i64 = company_posts::table.select(count_star()).first(&mut conn)?;
        Ok(count)
    }

    async fn get_dashboard_stats(&self) -> Result<DashboardStats> {
        let total_users = self.get_total_users().await?;
        let total_companies = self.get_total_companies().await?;
        let total_job_posts = self.get_total_job_posts().await?;
        let new_users_today = self.get_new_users_today().await?.count;
        let active_users_last_7_days = 0i64;
        let average_users_per_day = self.calculate_average_users_per_day().await?;
        let user_growth = self.get_user_growth().await?;

        Ok(DashboardStats {
            total_users,
            total_companies,
            total_job_posts,
            new_users_today,
            active_users_last_7_days,
            average_users_per_day,
            user_growth,
        })
    }

    async fn get_users_count_last_7_days(&self) -> Result<i64> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let seven_days_ago = Utc::now().date_naive() - Duration::days(7);

        let count: i64 = users::table
            .filter(users::created_at.ge(seven_days_ago.and_hms_opt(0, 0, 0).unwrap()))
            .select(count_star())
            .first(&mut conn)?;

        Ok(count)
    }

    async fn get_users_last_7_days(
        &self,
    ) -> Result<Vec<crate::domain::entities::admin_data::UserSummary>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let seven_days_ago = Utc::now().date_naive() - Duration::days(7);

        let users = users::table
            .filter(users::created_at.ge(seven_days_ago.and_hms_opt(0, 0, 0).unwrap()))
            .select(UserEntity::as_select())
            .load::<UserEntity>(&mut conn)?;

        let user_summaries: Vec<crate::domain::entities::admin_data::UserSummary> =
            users.into_iter().map(|u| u.into()).collect();

        Ok(user_summaries)
    }
}

impl AdminPostgres {
    async fn calculate_average_users_per_day(&self) -> Result<f64> {
        let users_last_7_days = self.get_users_count_last_7_days().await?;
        Ok(users_last_7_days as f64 / 7.0)
    }

    async fn get_user_growth(&self) -> Result<Vec<UserGrowthData>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let mut current_total: i64 = users::table.select(count_star()).first(&mut conn)?;
        let mut growth_data = Vec::new();
        let today = Utc::now().date_naive();

        for i in 0..7 {
            let target_date = today - Duration::days(i);
            let start_of_day = target_date.and_hms_opt(0, 0, 0).unwrap();
            let end_of_day = target_date.and_hms_opt(23, 59, 59).unwrap();

            let new_users_count: i64 = users::table
                .filter(users::created_at.ge(start_of_day))
                .filter(users::created_at.le(end_of_day))
                .select(count_star())
                .first(&mut conn)?;

            growth_data.push(UserGrowthData {
                date: target_date.format("%b %d").to_string(),
                new_users: new_users_count,
                total_users: current_total,
            });

            current_total -= new_users_count;
        }

        growth_data.reverse();
        Ok(growth_data)
    }
}
