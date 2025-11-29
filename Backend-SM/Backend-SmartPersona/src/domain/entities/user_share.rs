use crate::infrastructure::postgres::schema::profile_shares;
use chrono::{DateTime, Datelike, Utc};
use diesel::prelude::*;
use rand::{Rng, distributions::Alphanumeric};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// =================================================================
// 📊 ProfileShare Entity (สำหรับอ่านข้อมูลจาก database)
// =================================================================

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = profile_shares)]
pub struct ProfileShare {
    /// Primary key UUID
    pub id: Uuid,

    /// User ID ของเจ้าของ share link
    pub user_id: Uuid,

    /// Token สำหรับการเข้าถึง (64 characters random string)
    pub share_token: String,

    /// วันเวลาที่ share link จะหมดอายุ
    pub expires_at: DateTime<Utc>,

    /// จำนวนครั้งที่มีคนดูโปรไฟล์
    pub view_count: i32,

    /// วันเวลาที่มีคนดูล่าสุด
    pub last_viewed_at: Option<DateTime<Utc>>,

    /// สถานะว่า share link ยังใช้งานได้หรือไม่
    pub is_active: bool,

    /// วันเวลาที่สร้าง share link
    pub created_at: DateTime<Utc>,

    /// วันเวลาที่อัปเดตล่าสุด
    pub updated_at: DateTime<Utc>,
}

// =================================================================
// 🛠️ Helper methods สำหรับ ProfileShare
// =================================================================

impl ProfileShare {
    /// ตรวจสอบว่า share link หมดอายุแล้วหรือไม่
    pub fn is_expired(&self) -> bool {
        self.expires_at < Utc::now()
    }

    /// ตรวจสอบว่า share link สามารถเข้าถึงได้หรือไม่
    pub fn is_accessible(&self) -> bool {
        self.is_active && !self.is_expired()
    }

    /// สร้าง share URL จาก base URL
    pub fn get_share_url(&self, base_url: &str) -> String {
        format!(
            "{}/shared/{}",
            base_url.trim_end_matches('/'),
            self.share_token
        )
    }

    /// ตรวจสอบว่ากำลังจะหมดอายุในอีก X ชั่วโมงหรือไม่
    pub fn is_expiring_within(&self, hours: i64) -> bool {
        let threshold = Utc::now() + chrono::Duration::hours(hours);
        self.expires_at <= threshold && !self.is_expired()
    }
}

// =================================================================
// ➕ NewProfileShare Entity (สำหรับสร้างใหม่)
// =================================================================

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = profile_shares)]
pub struct NewProfileShare {
    /// User ID ของเจ้าของ share link
    pub user_id: Uuid,

    /// Token สำหรับการเข้าถึง (64 characters random string)
    pub share_token: String,

    /// วันเวลาที่ share link จะหมดอายุ (user กำหนด)
    pub expires_at: DateTime<Utc>,
}

// =================================================================
// 🛠️ Helper methods สำหรับ NewProfileShare
// =================================================================

impl NewProfileShare {
    /// สร้าง NewProfileShare ใหม่
    pub fn new(user_id: Uuid, expires_hours: i64) -> Self {
        let share_token = Self::generate_secure_token();
        let expires_at = Utc::now() + chrono::Duration::hours(expires_hours);

        Self {
            user_id,
            share_token,
            expires_at,
        }
    }

    /// สร้าง token ที่ปลอดภัย (64 characters)
    fn generate_secure_token() -> String {
        let token: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(64)
            .map(char::from)
            .collect();

        token
    }
}

// =================================================================
// 📝 UpdateProfileShare Entity (สำหรับอัปเดต)
// =================================================================

#[derive(Debug, Clone, AsChangeset, Deserialize)]
#[diesel(table_name = profile_shares)]
pub struct UpdateProfileShare {
    /// สถานะว่า share link ยังใช้งานได้หรือไม่
    pub is_active: Option<bool>,

    /// วันเวลาที่มีคนดูล่าสุด
    pub last_viewed_at: Option<Option<DateTime<Utc>>>,

    /// จำนวนครั้งที่มีคนดูโปรไฟล์
    pub view_count: Option<i32>,

    /// วันเวลาที่ share link จะหมดอายุ (สำหรับการ extend expiry)
    pub expires_at: Option<DateTime<Utc>>,
}

// =================================================================
// 📋 PublicProfileShare Entity (สำหรับ response ใน public view)
// =================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicProfileShare {
    /// Profile Share ID
    pub id: Uuid,

    /// Share Token (อาจจะตัดบางส่วนสำหรับ security)
    pub share_token_preview: String,

    /// วันเวลาหมดอายุ
    pub expires_at: DateTime<Utc>,

    /// จำนวนครั้งที่มีคนดู
    pub view_count: i32,

    /// วันเวลาที่มีคนดูล่าสุด
    pub last_viewed_at: Option<DateTime<Utc>>,

    /// สถานะว่า link ยังใช้งานได้หรือไม่
    pub is_active: bool,

    /// วันเวลาสร้าง
    pub created_at: DateTime<Utc>,

    /// วันเวลาอัปเดตล่าสุด
    pub updated_at: DateTime<Utc>,
}

// =================================================================
// 🔗 Share Statistics Entity (สำหรับ analytics)
// =================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareStatistics {
    /// Total shares ของ user
    pub total_shares: i64,

    /// Active shares ที่ยังไม่หมดอายุ
    pub active_shares: i64,

    /// Total views ทั้งหมดจากทุก share link
    pub total_views: i64,

    /// วันที่ share ล่าสุด
    pub latest_share_date: Option<DateTime<Utc>>,

    /// วันที่มีคนเข้าดูล่าสุด
    pub latest_view_date: Option<DateTime<Utc>>,
}

// =================================================================
// 🛡️ การแปลงจาก ProfileShare เป็น PublicProfileShare
// =================================================================

impl From<ProfileShare> for PublicProfileShare {
    fn from(share: ProfileShare) -> Self {
        // ตัด share_token เหลือแค่ต้นและท้ายเพื่อความปลอดภัย
        let share_token_preview = if share.share_token.len() > 16 {
            format!(
                "{}...{}",
                &share.share_token[..8],
                &share.share_token[share.share_token.len() - 8..]
            )
        } else {
            "...".to_string()
        };

        Self {
            id: share.id,
            share_token_preview,
            expires_at: share.expires_at,
            view_count: share.view_count,
            last_viewed_at: share.last_viewed_at,
            is_active: share.is_active,
            created_at: share.created_at,
            updated_at: share.updated_at,
        }
    }
}

// =================================================================
// 📄 Additional DTOs สำหรับ Request/Response
// =================================================================

/// สำหรับสร้าง share link request
#[derive(Debug, Deserialize)]
pub struct CreateShareRequest {
    /// จำนวนชั่วโมงที่จะให้หมดอายุ
    pub expires_hours: i64,
}

/// สำหรับ response หลังสร้าง share link
#[derive(Debug, Serialize)]
pub struct CreateShareResponse {
    /// URL สำหรับแชร์ (complete URL)
    pub share_url: String,

    /// Token แบบเต็ม (แสดงครั้งเดียวตอนสร้าง)
    pub share_token: String,

    /// วันเวลาหมดอายุ
    pub expires_at: DateTime<Utc>,
}

/// สำหรับ response แสดงรายการ shares ของ user
#[derive(Debug, Serialize)]
pub struct ShareListResponse {
    /// รายการ share links ทั้งหมดของ user
    pub shares: Vec<PublicProfileShare>,

    /// สถิติเพิ่มเติม
    pub statistics: ShareStatistics,
}

/// สำหรับ response เมื่อคนดู shared profile
#[derive(Debug, Serialize)]
pub struct SharedProfileResponse<T> {
    /// ข้อมูลโปรไฟล์ (แบบ public)
    pub profile: T,

    /// ข้อมูลการแชร์ (ไม่รวม token)
    pub share_info: ShareInfo,
}

/// ข้อมูลการแชร์สำหรับ public view
#[derive(Debug, Serialize)]
pub struct ShareInfo {
    /// ว่ากี่คนแล้วที่ดูโปรไฟล์นี้
    pub total_views: i32,

    /// ข้อความแจ้งว่านี่คือข้อมูลแชร์
    pub shared_notification: String,
}

// =================================================================
// 🔗 SharedProfileWithInfo Entity (สำหรับ join query)
// =================================================================

#[derive(Debug, Clone, Queryable, Serialize, Deserialize)]
pub struct SharedProfileWithInfo {
    /// Share token
    pub share_token: String,

    /// จำนวนครั้งที่ดู
    pub view_count: i32,

    /// ดูล่าสุดเมื่อไหร่
    pub last_viewed_at: Option<DateTime<Utc>>,

    /// หมดอายุเมื่อไหร่
    pub expires_at: DateTime<Utc>,

    // ============== User Profile Fields ==============
    /// User ID
    pub user_id: Uuid,

    /// คำนำหน้าชื่อ
    pub title: Option<String>,

    /// ชื่อ (ภาษาไทย)
    pub first_name_th: Option<String>,

    /// นามสกุล (ภาษาไทย)
    pub last_name_th: Option<String>,

    /// ชื่อ (ภาษาอังกฤษ)
    pub first_name_en: Option<String>,

    /// นามสกุล (ภาษาอังกฤษ)
    pub last_name_en: Option<String>,

    /// เพศ
    pub gender: Option<String>,

    /// วันเกิด
    pub birth_date: Option<chrono::NaiveDate>,

    /// ศาสนา
    pub religion: Option<String>,

    /// สัญชาติ
    pub nationality: Option<String>,
}

// =================================================================
// 🛠️ Helper methods สำหรับ SharedProfileWithInfo
// =================================================================

impl SharedProfileWithInfo {
    /// แสดงชื่อเต็ม (ภาษาไทย)
    pub fn full_name_th(&self) -> String {
        match (&self.first_name_th, &self.last_name_th) {
            (Some(first), Some(last)) => format!("{} {}", first, last),
            (Some(first), None) => first.to_string(),
            (None, Some(last)) => last.to_string(),
            (None, None) => "ไม่ระบุ".to_string(),
        }
    }

    /// แสดงชื่อเต็ม (ภาษาอังกฤษ)
    pub fn full_name_en(&self) -> String {
        match (&self.first_name_en, &self.last_name_en) {
            (Some(first), Some(last)) => format!("{} {}", first, last),
            (Some(first), None) => first.to_string(),
            (None, Some(last)) => last.to_string(),
            (None, None) => "Not specified".to_string(),
        }
    }

    /// คำนวณอายุจากวันเกิด
    pub fn age(&self) -> Option<i32> {
        self.birth_date.map(|birth_date| {
            let today = chrono::Utc::now().date_naive();
            let age = today.year() - birth_date.year();

            if today.month() < birth_date.month()
                || (today.month() == birth_date.month() && today.day() < birth_date.day())
            {
                age - 1
            } else {
                age
            }
        })
    }
}
