use anyhow::{Result, anyhow};
use chrono::{DateTime, Duration, Utc};
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::{
    entities::{
        user_share::ShareInfo,
        user_share::{
            NewProfileShare, ProfileShare, ShareStatistics, SharedProfileResponse,
            SharedProfileWithInfo, UpdateProfileShare,
        },
    },
    repo::{
        user_privacy_settings::UserPrivacySettingsRepository,
        user_share::{CleanupResult, ProfileShareRepository},
    },
};

/// UseCase สำหรับจัดการ ProfileShare
pub struct ProfileShareUseCase<T, TPrivacy>
where
    T: ProfileShareRepository + Send + Sync,
    TPrivacy: UserPrivacySettingsRepository + Send + Sync,
{
    repository: Arc<T>,
    privacy_settings_repository: Arc<TPrivacy>,
}

impl<T, TPrivacy> ProfileShareUseCase<T, TPrivacy>
where
    T: ProfileShareRepository + Send + Sync,
    TPrivacy: UserPrivacySettingsRepository + Send + Sync,
{
    /// สร้าง UseCase instance ใหม่
    pub fn new(repository: Arc<T>, privacy_settings_repository: Arc<TPrivacy>) -> Self {
        Self {
            repository,
            privacy_settings_repository,
        }
    }

    // =================================================================
    // 🔗 Core Share Operations
    // =================================================================

    /// สร้าง share link ใหม่สำหรับ user
    pub async fn create_share_link(
        &self,
        user_id: Uuid,
        expires_hours: i64,
    ) -> Result<ProfileShare> {
        // ตรวจสอบค่า expires_hours
        if expires_hours < 1 || expires_hours > 8760 {
            return Err(anyhow!(
                "expires_hours ต้องอยู่ระหว่าง 1-8760 ชั่วโมง (1 ชม - 1 ปี)"
            ));
        }

        // สร้าง new share ใหม่
        let new_share = NewProfileShare::new(user_id, expires_hours);

        // ตรวจสอบว่า token ซ้ำหรือไม่ (security check)
        if self.repository.token_exists(&new_share.share_token).await? {
            return Err(anyhow!("Token conflict - กรุณาลองใหม่"));
        }

        // สร้างใน database
        let share = self.repository.create(&new_share).await?;

        // ล็อกสร้างแล้ว
        tracing::info!(
            "Created share link: user_id={}, share_id={}, expires_at={}",
            user_id,
            share.id,
            share.expires_at
        );

        Ok(share)
    }

    /// ดูข้อมูล shared profile ผ่าน token (public access)
    pub async fn get_shared_profile(
        &self,
        token: &str,
    ) -> Result<SharedProfileResponse<SharedProfileWithInfo>> {
        // ดึงข้อมูล share จาก token
        let share = self
            .repository
            .get_by_token(token)
            .await?
            .ok_or_else(|| anyhow!("Share link not found"))?;

        // ตรวจสอบว่าใช้งานได้จริงหรือไม่
        if !share.is_active {
            return Err(anyhow!("Share link has been deactivated"));
        }

        if share.is_expired() {
            return Err(anyhow!("Share link has expired"));
        }

        // ตรวจสอบ privacy settings - ถ้า show_profile = false จะไม่สามารถดูได้แม้จะมี share link
        let privacy_settings = self
            .privacy_settings_repository
            .get_by_user_id(share.user_id)
            .await?;

        if let Some(settings) = privacy_settings {
            if !settings.show_profile {
                return Err(anyhow!("Profile is not available for viewing"));
            }
        } else {
            // ถ้าไม่มี privacy settings ให้ default เป็น private (show_profile = false) เพื่อความปลอดภัย
            // Users must explicitly enable public profile
            return Err(anyhow!("Profile is not available for viewing"));
        }

        // เพิ่ม view count
        self.repository.increment_view_count(share.id).await?;

        // ดึงข้อมูล profile ที่แชร์
        let shared_profile = self
            .repository
            .get_shared_profile_info(token)
            .await?
            .ok_or_else(|| anyhow!("Profile information not found"))?;

        // สร้าง response
        let response = SharedProfileResponse {
            profile: shared_profile,
            share_info: ShareInfo {
                total_views: share.view_count,
                shared_notification: "ข้อมูลนี้เป็นสาธารณะผ่านลิงค์แชร์".to_string(),
            },
        };

        // ล็อกการเข้าถึง
        tracing::info!(
            "Shared profile accessed: token={}, share_id={}, view_count={}",
            token,
            share.id,
            share.view_count
        );

        Ok(response)
    }

    /// ดูรายการ share links ทั้งหมดของ user
    pub async fn get_user_shares(&self, user_id: Uuid) -> Result<Vec<ProfileShare>> {
        let shares = self.repository.get_by_user_id(user_id).await?;
        Ok(shares)
    }

    /// ดูเฉพาะ share links ที่ยังใช้งานได้ของ user
    pub async fn get_user_active_shares(&self, user_id: Uuid) -> Result<Vec<ProfileShare>> {
        let shares = self.repository.get_active_by_user_id(user_id).await?;
        Ok(shares)
    }

    // =================================================================
    // 🔄 Share Management Operations
    // =================================================================

    /// Deactivate share link
    pub async fn deactivate_share(&self, share_id: Uuid, user_id: Uuid) -> Result<ProfileShare> {
        // ตรวจสอบว่าเป็นเจ้าของจริงหรือไม่
        let share = self
            .repository
            .get_by_id(share_id)
            .await?
            .ok_or_else(|| anyhow!("Share link not found"))?;

        if share.user_id != user_id {
            return Err(anyhow!("Not authorized to deactivate this share link"));
        }

        // Deactivate
        let updated_share = self.repository.deactivate(share_id).await?;

        // ล็อก
        tracing::info!(
            "Share link deactivated: share_id={}, user_id={}",
            share_id,
            user_id
        );

        Ok(updated_share)
    }

    /// Activate share link (restore)
    pub async fn activate_share(&self, share_id: Uuid, user_id: Uuid) -> Result<ProfileShare> {
        // ตรวจสอบว่าเป็นเจ้าของจริงหรือไม่
        let share = self
            .repository
            .get_by_id(share_id)
            .await?
            .ok_or_else(|| anyhow!("Share link not found"))?;

        if share.user_id != user_id {
            return Err(anyhow!("Not authorized to activate this share link"));
        }

        // ตรวจสอบว่าหมดอายุหรือไม่
        if share.is_expired() {
            return Err(anyhow!("Cannot activate expired share link"));
        }

        // Activate
        let updated_share = self.repository.activate(share_id).await?;

        // ล็อก
        tracing::info!(
            "Share link activated: share_id={}, user_id={}",
            share_id,
            user_id
        );

        Ok(updated_share)
    }

    /// ลบ share link (hard delete)
    pub async fn delete_share(&self, share_id: Uuid, user_id: Uuid) -> Result<()> {
        // ตรวจสอบว่าเป็นเจ้าของจริงหรือไม่
        let share = self
            .repository
            .get_by_id(share_id)
            .await?
            .ok_or_else(|| anyhow!("Share link not found"))?;

        if share.user_id != user_id {
            return Err(anyhow!("Not authorized to delete this share link"));
        }

        // ลบ
        self.repository.delete(share_id).await?;

        // ล็อก
        tracing::info!(
            "Share link deleted: share_id={}, user_id={}",
            share_id,
            user_id
        );

        Ok(())
    }

    /// Deactivate ทุก share links ของ user
    pub async fn deactivate_all_user_shares(&self, user_id: Uuid) -> Result<u64> {
        let count = self.repository.deactivate_all_user_shares(user_id).await?;

        // ล็อก
        tracing::info!(
            "Deactivated all shares for user: user_id={}, count={}",
            user_id,
            count
        );

        Ok(count)
    }

    // =================================================================
    // 📊 Analytics & Statistics
    // =================================================================

    /// ดูสถิติการแชร์ของ user
    pub async fn get_user_share_statistics(&self, user_id: Uuid) -> Result<ShareStatistics> {
        let stats = self.repository.get_user_share_statistics(user_id).await?;
        Ok(stats)
    }

    /// ดู share links ที่กำลังจะหมดอายุในอีก X ชั่วโมง
    pub async fn get_expiring_soon_shares(
        &self,
        user_id: Uuid,
        hours_within: i64,
    ) -> Result<Vec<ProfileShare>> {
        let shares = self
            .repository
            .get_expiring_soon(hours_within, 100)
            .await?
            .into_iter()
            .filter(|share| share.user_id == user_id)
            .collect();

        Ok(shares)
    }

    /// ดู share links ที่เคยมีคนเข้าดู (view_count > 0)
    pub async fn get_viewed_shares(&self, user_id: Uuid) -> Result<Vec<ProfileShare>> {
        let shares = self.repository.get_viewed_shares_by_user(user_id).await?;
        Ok(shares)
    }

    // =================================================================
    // 🧹 Maintenance & Cleanup Operations
    // =================================================================

    /// Cleanup ลิงก์ที่หมดอายุแล้วทั้งหมด
    pub async fn cleanup_expired_shares(&self) -> Result<CleanupResult> {
        let start_time = std::time::Instant::now();

        // ลบลิงก์ที่หมดอายุแล้ว
        let deleted_count = self.repository.delete_expired_shares().await?;

        let duration = start_time.elapsed();

        let result = CleanupResult {
            deactivated_count: 0, // เราลบทิ้งเลยไม่ได้ deactivate
            deleted_count,
            duration_ms: duration.as_millis() as u64,
            errors: Vec::new(),
        };

        // ล็อก
        tracing::info!(
            "Cleanup completed: deleted={}, duration_ms={}",
            deleted_count,
            result.duration_ms
        );

        Ok(result)
    }

    /// ตรวจสอบและ cleanup ทุกอย่างที่จำเป็น
    pub async fn perform_maintenance(&self) -> Result<MaintenanceReport> {
        let mut report = MaintenanceReport {
            expired_cleaned: 0,
            total_shares_before: 0,
            total_shares_after: 0,
            errors: Vec::new(),
            duration_ms: 0,
        };

        let start_time = std::time::Instant::now();

        // นับก่อน cleanup
        match self.repository.count_all_shares().await {
            Ok(count) => report.total_shares_before = count,
            Err(e) => report.errors.push(format!("Failed to count shares: {}", e)),
        }

        // Cleanup expired shares
        match self.cleanup_expired_shares().await {
            Ok(result) => report.expired_cleaned = result.deleted_count,
            Err(e) => report
                .errors
                .push(format!("Failed to cleanup expired shares: {}", e)),
        }

        // นับหลัง cleanup
        match self.repository.count_all_shares().await {
            Ok(count) => report.total_shares_after = count,
            Err(e) => report
                .errors
                .push(format!("Failed to count shares after cleanup: {}", e)),
        }

        report.duration_ms = start_time.elapsed().as_millis() as u64;

        // ล็อก
        tracing::info!(
            "Maintenance completed: expired_cleaned={}, total_before={}, total_after={}, duration_ms={}",
            report.expired_cleaned,
            report.total_shares_before,
            report.total_shares_after,
            report.duration_ms
        );

        Ok(report)
    }

    // =================================================================
    // 🔐 Validation & Security Operations
    // =================================================================

    /// ตรวจสอบว่า user สามารถสร้าง share link ได้หรือไม่
    pub async fn can_create_share(&self, user_id: Uuid) -> Result<bool> {
        // ตรวจสอบว่า user มี profile หรือไม่ (จะต้องเชื่อมกับ user profile repo)
        // สำหรับตอนนี้ return true ไปก่อน
        Ok(true)
    }

    /// ตรวจสอบว่า token ใช้งานได้จริงหรือไม่
    pub async fn validate_token(&self, token: &str) -> Result<bool> {
        self.repository.is_token_accessible(token).await
    }

    /// ตรวจสอบว่าเป็นเจ้าของ share link หรือไม่
    pub async fn is_share_owner(&self, share_id: Uuid, user_id: Uuid) -> Result<bool> {
        let share = self.repository.get_by_id(share_id).await?;
        Ok(share.map(|s| s.user_id == user_id).unwrap_or(false))
    }

    // =================================================================
    // ⚡ Batch Operations
    // =================================================================

    /// Deactivate หลาย share links พร้อมกัน
    pub async fn deactivate_multiple_shares(
        &self,
        share_ids: Vec<Uuid>,
        user_id: Uuid,
    ) -> Result<Vec<ProfileShare>> {
        // ตรวจสอสิทธิ์ทุก share link
        for &share_id in &share_ids {
            if !self.is_share_owner(share_id, user_id).await? {
                return Err(anyhow!("Not authorized to deactivate share: {}", share_id));
            }
        }

        // Deactivate ทั้งหมด
        let mut deactivated_shares = Vec::new();
        for share_id in share_ids {
            match self.repository.deactivate(share_id).await {
                Ok(share) => deactivated_shares.push(share),
                Err(e) => return Err(anyhow!("Failed to deactivate {}: {}", share_id, e)),
            }
        }

        Ok(deactivated_shares)
    }

    /// สร้าง share link แบบง่าย (ใช้ default expiry)
    pub async fn create_simple_share(&self, user_id: Uuid) -> Result<ProfileShare> {
        self.create_share_link(user_id, 24).await // 24 hours default
    }

    /// สร้าง share link สำหรับวันพิเศษ (30 days)
    pub async fn create_extended_share(&self, user_id: Uuid) -> Result<ProfileShare> {
        self.create_share_link(user_id, 720).await // 30 days (30 * 24)
    }
}

// =================================================================
// 📊 Report Types
// =================================================================

/// รายงานผลจากการ maintenance
#[derive(Debug, Clone)]
pub struct MaintenanceReport {
    /// จำนวนลิงก์ที่ถูกลบเพราะหมดอายุ
    pub expired_cleaned: u64,

    /// จำนวนลิงก์ทั้งหมดก่อน cleanup
    pub total_shares_before: i64,

    /// จำนวนลิงก์ทั้งหมดหลัง cleanup
    pub total_shares_after: i64,

    /// Error messages ที่เกิดขึ้น
    pub errors: Vec<String>,

    /// เวลาที่ใช้ในการ maintenance (milliseconds)
    pub duration_ms: u64,
}

impl MaintenanceReport {
    /// ตรวจสอบว่ามี error หรือไม่
    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    /// นับจำนวน errors
    pub fn error_count(&self) -> usize {
        self.errors.len()
    }
}
