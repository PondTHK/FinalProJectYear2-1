use crate::domain::entities::user_share::{
    NewProfileShare, ProfileShare, ShareStatistics, SharedProfileWithInfo, UpdateProfileShare,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait ProfileShareRepository: Send + Sync {
    // =================================================================
    // 🔗 Basic CRUD Operations
    // =================================================================

/// สร้าง share link ใหม่
async fn create(&self, new_share: &NewProfileShare) -> Result<ProfileShare>;

/// ดึงข้อมูล share link ตาม token
async fn get_by_token(&self, token: &str) -> Result<Option<ProfileShare>>;

/// ดึงข้อมูล share link ตาม ID
async fn get_by_id(&self, share_id: Uuid) -> Result<Option<ProfileShare>>;

/// ดึงรายการ share links ทั้งหมดของ user
async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<ProfileShare>>;

/// ดึงเฉพาะ share links ที่ยังใช้งานได้ของ user
async fn get_active_by_user_id(&self, user_id: Uuid) -> Result<Vec<ProfileShare>>;

/// อัปเดตข้อมูล share link
async fn update(&self, share_id: Uuid, update_data: &UpdateProfileShare) -> Result<ProfileShare>;

/// ลบ share link
async fn delete(&self, share_id: Uuid) -> Result<()>;

// =================================================================
// 📈 Specialized Operations
// =================================================================

/// เพิ่มจำนวนครั้งที่ดู และอัปเดตเวลาล่าสุด
async fn increment_view_count(&self, share_id: Uuid) -> Result<ProfileShare>;

/// Deactivate share link (soft delete)
async fn deactivate(&self, share_id: Uuid) -> Result<ProfileShare>;

/// Activate share link
async fn activate(&self, share_id: Uuid) -> Result<ProfileShare>;

/// ตรวจสอบว่า token ใช้งานได้หรือไม่ (active + not expired)
async fn is_token_accessible(&self, token: &str) -> Result<bool>;

// =================================================================
// 🧹 Cleanup Operations
// =================================================================

/// ลบ share links ที่หมดอายุแล้วทั้งหมด
async fn delete_expired_shares(&self) -> Result<u64>;

/// Deactivate ทุก share links ของ user
async fn deactivate_all_user_shares(&self, user_id: Uuid) -> Result<u64>;

// =================================================================
// 📊 Analytics & Statistics
// =================================================================

/// ดึงสถิติการแชร์ของ user
async fn get_user_share_statistics(&self, user_id: Uuid) -> Result<ShareStatistics>;

/// นับจำนวน share links ทั้งหมดในระบบ
async fn count_all_shares(&self) -> Result<i64>;

/// นับจำนวน active shares ทั้งหมดในระบบ
async fn count_active_shares(&self) -> Result<i64>;

/// ดึงข้อมูล share links ที่กำลังจะหมดอายุในอีก X ชั่วโมง
async fn get_expiring_soon(&self, hours_threshold: i64, limit: i64) -> Result<Vec<ProfileShare>>;

// =================================================================
// 🔍 Advanced Queries
// =================================================================

    /// ดึงข้อมูล shared profile พร้อมข้อมูลผู้ใช้สำหรับ public view
    async fn get_shared_profile_info(&self, token: &str) -> Result<Option<SharedProfileWithInfo>>;

    /// ดึงรายการ share links ที่เคยมีคนเข้าดู (มี view_count > 0)
    async fn get_viewed_shares_by_user(&self, user_id: Uuid) -> Result<Vec<ProfileShare>>;

    /// ค้นหา share links ตาม token (partial match)
    async fn search_by_token(
        &self,
        token_fragment: &str,
        user_id: Uuid,
    ) -> Result<Vec<ProfileShare>>;

    // =================================================================
    // 🔐 Validation Operations
    // =================================================================

    /// ตรวจสอบว่า token ซ้ำหรือไม่ (สำหรับก่อนสร้าง)
    async fn token_exists(&self, token: &str) -> Result<bool>;

    /// ตรวจสอบว่า user มี share link อยู่แล้วหรือไม่
    async fn user_has_active_share(&self, user_id: Uuid) -> Result<bool>;

    // =================================================================
    // ⚡ Batch Operations
    // =================================================================

    /// Deactivate multiple share links พร้อมกัน
    async fn deactivate_multiple(&self, share_ids: &[Uuid]) -> Result<u64>;

    /// ตรวจสอบและ deactivate expired shares (cleanup job)
    async fn cleanup_expired_shares(&self) -> Result<CleanupResult>;
}

// =================================================================
// 📦 Result Types
// =================================================================

/// ผลลัพธ์จากการ cleanup
#[derive(Debug, Clone)]
pub struct CleanupResult {
    /// จำนวน shares ที่ถูก deactivated
    pub deactivated_count: u64,

        /// จำนวน shares ที่ถูกลบทิ้ง
        pub deleted_count: u64,

        /// เวลาที่ใช้ในการ cleanup (milliseconds)
        pub duration_ms: u64,

        /// Error messages (ถ้ามี)
        pub errors: Vec<String>,
    }
