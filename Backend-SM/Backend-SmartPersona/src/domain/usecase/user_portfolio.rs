use crate::domain::{
    entities::user_portfolio::{
        NewUserPortfolio, UpdateUserPortfolio, UserPortfolioEntity, UserPortfolioRequest,
    },
    repo::user_portfolio::UserPortfolioRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserPortfolioUseCase<T>
where
    T: UserPortfolioRepository + Send + Sync,
{
    user_portfolio_repository: Arc<T>,
}

impl<T> UserPortfolioUseCase<T>
where
    T: UserPortfolioRepository + Send + Sync,
{
    pub fn new(user_portfolio_repository: Arc<T>) -> Self {
        Self {
            user_portfolio_repository,
        }
    }

    /// สร้างข้อมูลผลงานใหม่
    pub async fn create_portfolio(
        &self,
        new_portfolio: NewUserPortfolio,
    ) -> Result<UserPortfolioEntity> {
        self.user_portfolio_repository.create(&new_portfolio).await
    }

    /// ดึงข้อมูลผลงานทั้งหมดของ user
    pub async fn get_user_portfolios(&self, user_id: Uuid) -> Result<Vec<UserPortfolioEntity>> {
        self.user_portfolio_repository
            .get_by_user_id(user_id)
            .await
    }

    /// ดึงข้อมูลผลงานตาม id
    pub async fn get_portfolio_by_id(
        &self,
        id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<UserPortfolioEntity>> {
        self.user_portfolio_repository.get_by_id(id, user_id).await
    }

    /// อัปเดตข้อมูลผลงาน
    pub async fn update_portfolio(
        &self,
        id: Uuid,
        user_id: Uuid,
        update_data: UpdateUserPortfolio,
    ) -> Result<UserPortfolioEntity> {
        // Check if portfolio exists
        let _existing = self
            .user_portfolio_repository
            .get_by_id(id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Portfolio with id '{}' not found", id))?;

        self.user_portfolio_repository
            .update_by_id(id, user_id, &update_data)
            .await
    }

    /// ลบข้อมูลผลงานตาม id
    pub async fn delete_portfolio(&self, id: Uuid, user_id: Uuid) -> Result<()> {
        // Check if portfolio exists before deleting
        let _existing = self
            .user_portfolio_repository
            .get_by_id(id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Portfolio with id '{}' not found", id))?;

        self.user_portfolio_repository.delete_by_id(id, user_id).await
    }

    /// ลบข้อมูลผลงานทั้งหมดของ user
    pub async fn delete_all_user_portfolios(&self, user_id: Uuid) -> Result<()> {
        self.user_portfolio_repository
            .delete_all_by_user_id(user_id)
            .await
    }
}

