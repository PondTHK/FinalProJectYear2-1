use crate::domain::entities::user_portfolio::{
    NewUserPortfolio, UpdateUserPortfolio, UserPortfolioEntity,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserPortfolioRepository: Send + Sync {
    /// สร้างผลงานใหม่
    async fn create(&self, new_portfolio: &NewUserPortfolio) -> Result<UserPortfolioEntity>;

    /// ดึงข้อมูลผลงานตาม user_id
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<UserPortfolioEntity>>;

    /// ดึงข้อมูลผลงานตาม id
    async fn get_by_id(&self, id: Uuid, user_id: Uuid) -> Result<Option<UserPortfolioEntity>>;

    /// อัปเดตข้อมูลผลงานตาม id
    async fn update_by_id(
        &self,
        id: Uuid,
        user_id: Uuid,
        update_data: &UpdateUserPortfolio,
    ) -> Result<UserPortfolioEntity>;

    /// ลบข้อมูลผลงานตาม id
    async fn delete_by_id(&self, id: Uuid, user_id: Uuid) -> Result<()>;

    /// ลบข้อมูลผลงานทั้งหมดของ user
    async fn delete_all_by_user_id(&self, user_id: Uuid) -> Result<()>;
}

