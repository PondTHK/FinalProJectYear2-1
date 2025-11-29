use crate::domain::entities::user_address::{NewUserAddress, UpdateUserAddress, UserAddressEntity};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserAddressRepository: Send + Sync {
    /// สร้างที่อยู่ใหม่
    async fn create(&self, new_address: &NewUserAddress) -> Result<UserAddressEntity>;

    /// ดึงที่อยู่ของ user
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserAddressEntity>>;

    /// อัปเดตที่อยู่ของ user
    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserAddress,
    ) -> Result<UserAddressEntity>;

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว (สะดวกสำหรับฟอร์มกรอกข้อมูล)
    async fn upsert_by_user_id(
        &self,
        user_id: Uuid,
        address_data: &NewUserAddress,
    ) -> Result<UserAddressEntity>;

    /// ลบที่อยู่ของ user
    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()>;
}
