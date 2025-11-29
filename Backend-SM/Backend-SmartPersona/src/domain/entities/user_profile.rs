use crate::infrastructure::postgres::schema::user_profiles;
use chrono::{DateTime, NaiveDate, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Struct สำหรับ "อ่าน" (Queryable)
// แก้ไข created_at/updated_at ตาม database schema
#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = user_profiles)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UserProfileEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: Option<String>,
    pub first_name_th: Option<String>,
    pub last_name_th: Option<String>,
    pub first_name_en: Option<String>,
    pub last_name_en: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub religion: Option<String>,
    pub nationality: Option<String>,
    pub phone: Option<String>,
    pub line_id: Option<String>,
    pub military_status: Option<String>,
    pub is_disabled: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub profile_image_url: Option<String>,
    pub cover_image_url: Option<String>,
    pub template: Option<String>,
    pub email: Option<String>,
}

// Struct สำหรับ "สร้างใหม่" (Insertable)
// (โค้ดเดิมของคุณดีมากแล้ว)
#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_profiles)]
pub struct NewUserProfile {
    pub user_id: Uuid,
    pub title: Option<String>,
    pub first_name_th: Option<String>,
    pub last_name_th: Option<String>,
    pub first_name_en: Option<String>,
    pub last_name_en: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub religion: Option<String>,
    pub nationality: Option<String>,
    pub phone: Option<String>,
    pub line_id: Option<String>,
    pub email: Option<String>,
    pub military_status: Option<String>,
    pub is_disabled: Option<bool>,
    pub profile_image_url: Option<String>,
    pub cover_image_url: Option<String>,
    pub template: Option<String>,
    // ไม่ต้องมี created_at/updated_at ถูกต้องแล้ว
}

// *** เพิ่ม Struct นี้ ***
// Struct สำหรับ "อัปเดต" (AsChangeset)
// เหมาะสำหรับการทำ PATCH (อัปเดตแค่บางฟิลด์)
#[derive(Debug, Clone, AsChangeset, Deserialize)]
#[diesel(table_name = user_profiles)]
pub struct UpdateUserProfile {
    // ไม่มี user_id เพราะเราไม่ควรเปลี่ยนเจ้าของ
    // ไม่มี id เพราะเราจะใช้ id ในการ query
    pub title: Option<String>,
    pub first_name_th: Option<String>,
    pub last_name_th: Option<String>,
    pub first_name_en: Option<String>,
    pub last_name_en: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub religion: Option<String>,
    pub nationality: Option<String>,
    pub phone: Option<String>,
    pub line_id: Option<String>,
    pub email: Option<String>,
    pub military_status: Option<String>,
    pub is_disabled: Option<bool>,
    pub profile_image_url: Option<String>,
    pub cover_image_url: Option<String>,
    pub template: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfileRequest {
    pub title: Option<String>,
    pub first_name_th: Option<String>,
    pub last_name_th: Option<String>,
    pub first_name_en: Option<String>,
    pub last_name_en: Option<String>,
    pub gender: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub religion: Option<String>,
    pub nationality: Option<String>,
    pub phone: Option<String>,
    pub line_id: Option<String>,
    pub email: Option<String>,
    pub military_status: Option<String>,
    pub is_disabled: Option<bool>,
    pub profile_image_url: Option<String>,
    pub cover_image_url: Option<String>,
    pub template: Option<String>,
}

impl UserProfileRequest {
    /// แปลง Request DTO เป็น NewUserProfile พร้อม user_id
    pub fn into_new_profile(self, user_id: Uuid) -> NewUserProfile {
        NewUserProfile {
            user_id,
            title: self.title,
            first_name_th: self.first_name_th,
            last_name_th: self.last_name_th,
            first_name_en: self.first_name_en,
            last_name_en: self.last_name_en,
            gender: self.gender,
            birth_date: self.birth_date,
            religion: self.religion,
            nationality: self.nationality,
            phone: self.phone,
            line_id: self.line_id,
            email: self.email,
            military_status: self.military_status,
            is_disabled: self.is_disabled,
            profile_image_url: self.profile_image_url,
            cover_image_url: self.cover_image_url,
            template: self.template,
        }
    }

    /// แปลง Request DTO เป็น UpdateUserProfile
    pub fn into_update_profile(self) -> UpdateUserProfile {
        UpdateUserProfile {
            title: self.title,
            first_name_th: self.first_name_th,
            last_name_th: self.last_name_th,
            first_name_en: self.first_name_en,
            last_name_en: self.last_name_en,
            gender: self.gender,
            birth_date: self.birth_date,
            religion: self.religion,
            nationality: self.nationality,
            phone: self.phone,
            line_id: self.line_id,
            email: self.email,
            military_status: self.military_status,
            is_disabled: self.is_disabled,
            profile_image_url: self.profile_image_url,
            cover_image_url: self.cover_image_url,
            template: self.template,
            updated_at: None,
        }
    }
}
