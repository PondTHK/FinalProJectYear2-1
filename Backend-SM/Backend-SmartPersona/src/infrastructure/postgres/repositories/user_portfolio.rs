use anyhow::Result;
use axum::async_trait;
use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_portfolio::{NewUserPortfolio, UpdateUserPortfolio, UserPortfolioEntity},
        repo::user_portfolio::UserPortfolioRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_portfolios},
};

pub struct UserPortfolioPostgres {
    db_pool: Arc<DbPool>,
}

impl UserPortfolioPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserPortfolioRepository for UserPortfolioPostgres {
    async fn create(&self, new_portfolio: &NewUserPortfolio) -> Result<UserPortfolioEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_portfolios::table)
            .values(new_portfolio)
            .returning(UserPortfolioEntity::as_returning())
            .get_result::<UserPortfolioEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserPortfolioEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let results = user_portfolios::table
            .filter(user_portfolios::user_id.eq(user_id))
            .order(user_portfolios::created_at.desc())
            .load::<UserPortfolioEntity>(&mut conn)?;

        Ok(results)
    }

    async fn get_by_id(&self, id: Uuid, user_id: Uuid) -> Result<Option<UserPortfolioEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_portfolios::table
            .filter(
                user_portfolios::id
                    .eq(id)
                    .and(user_portfolios::user_id.eq(user_id)),
            )
            .first::<UserPortfolioEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_id(
        &self,
        id: Uuid,
        user_id: Uuid,
        update_data: &UpdateUserPortfolio,
    ) -> Result<UserPortfolioEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // Ensure updated_at is set
        let mut data = update_data.clone();
        if data.updated_at.is_none() {
            data.updated_at = Some(Utc::now());
        }

        let result = diesel::update(user_portfolios::table)
            .filter(
                user_portfolios::id
                    .eq(id)
                    .and(user_portfolios::user_id.eq(user_id)),
            )
            .set(&data)
            .returning(UserPortfolioEntity::as_returning())
            .get_result::<UserPortfolioEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_id(&self, id: Uuid, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_portfolios::table)
            .filter(
                user_portfolios::id
                    .eq(id)
                    .and(user_portfolios::user_id.eq(user_id)),
            )
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_portfolios::table)
            .filter(user_portfolios::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }
}

