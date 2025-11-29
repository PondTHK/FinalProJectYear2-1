use crate::domain::{
    entities::user_address::{NewUserAddress, UpdateUserAddress, UserAddressEntity},
    repo::user_address::UserAddressRepository,
};
use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserAddressUseCase<T>
where
    T: UserAddressRepository + Send + Sync,
{
    user_address_repository: Arc<T>,
}

impl<T> UserAddressUseCase<T>
where
    T: UserAddressRepository + Send + Sync,
{
    pub fn new(user_address_repository: Arc<T>) -> Self {
        Self {
            user_address_repository,
        }
    }

    pub async fn create_address(&self, new_address: NewUserAddress) -> Result<UserAddressEntity> {
        self.user_address_repository.create(&new_address).await
    }

    pub async fn get_address_by_user_id(&self, user_id: Uuid) -> Result<Option<UserAddressEntity>> {
        self.user_address_repository.get_by_user_id(user_id).await
    }

    pub async fn update_address(
        &self,
        user_id: Uuid,
        update_data: UpdateUserAddress,
    ) -> Result<UserAddressEntity> {
        self.user_address_repository
            .update_by_user_id(user_id, &update_data)
            .await
    }

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว - สะดวกสำหรับฟอร์มกรอกข้อมูล
    pub async fn upsert_address(
        &self,
        user_id: Uuid,
        address_data: NewUserAddress,
    ) -> Result<UserAddressEntity> {
        self.user_address_repository
            .upsert_by_user_id(user_id, &address_data)
            .await
    }

    /// ลบที่อยู่ของผู้ใช้ตาม user_id
    pub async fn delete_address(&self, user_id: Uuid) -> Result<()> {
        // ตรวจสอบว่ามีที่อยู่อยู่ก่อนลบ
        let _existing = self
            .user_address_repository
            .get_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User address not found for user_id: {}", user_id))?;

        self.user_address_repository
            .delete_by_user_id(user_id)
            .await?;
        Ok(())
    }
}
