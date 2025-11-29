use crate::infrastructure::postgres::schema::companies;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Struct สำหรับ "อ่าน" (Queryable)
#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = companies)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct CompanyEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub company_name: String,
    pub industry: Option<String>,
    pub company_size: Option<String>,
    pub description: Option<String>,
    pub phone: Option<String>,
    pub address_detail: Option<String>,
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub status: String,
    pub logo_url: Option<String>,
    pub founded_year: Option<String>,
    pub mission: Option<String>,
    pub vision: Option<String>,
    pub is_verified: Option<bool>,
    pub email: Option<String>,
}

// Struct สำหรับ "สร้างใหม่" (Insertable)
#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = companies)]
pub struct NewCompany {
    pub user_id: Uuid,
    pub company_name: String,
    pub industry: Option<String>,
    pub email: Option<String>,
    pub company_size: Option<String>,
    pub description: Option<String>,
    pub phone: Option<String>,
    pub address_detail: Option<String>,
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub status: String,
    pub logo_url: Option<String>,
    pub founded_year: Option<String>,
    pub mission: Option<String>,
    pub vision: Option<String>,
    pub is_verified: Option<bool>,
}

// Struct สำหรับ "อัปเดต" (AsChangeset)
#[derive(Debug, Clone, Default, AsChangeset, Deserialize)]
#[diesel(table_name = companies)]
pub struct UpdateCompany {
    pub company_name: Option<String>,
    pub industry: Option<String>,
    pub email: Option<String>,
    pub company_size: Option<String>,
    pub description: Option<String>,
    pub phone: Option<String>,
    pub address_detail: Option<String>,
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
    pub status: Option<String>,
    pub logo_url: Option<String>,
    pub founded_year: Option<String>,
    pub mission: Option<String>,
    pub vision: Option<String>,
    pub is_verified: Option<bool>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanyRequest {
    pub company_name: String,
    pub industry: Option<String>,
    pub email: Option<String>,
    pub company_size: Option<String>,
    pub description: Option<String>,
    pub phone: Option<String>,
    pub address_detail: Option<String>,
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub status: Option<String>,
    pub logo_url: Option<String>,
    pub founded_year: Option<String>,
    pub mission: Option<String>,
    pub vision: Option<String>,
}

impl CompanyRequest {
    /// แปลง Request DTO เป็น NewCompany พร้อม user_id
    pub fn into_new_company(self, user_id: Uuid) -> NewCompany {
        NewCompany {
            user_id,
            company_name: self.company_name,
            industry: self.industry,
            email: self.email,
            company_size: self.company_size,
            description: self.description,
            phone: self.phone,
            address_detail: self.address_detail,
            province: self.province,
            district: self.district,
            subdistrict: self.subdistrict,
            postal_code: self.postal_code,
            status: self.status.unwrap_or_else(|| "pending".to_string()),
            logo_url: self.logo_url,
            founded_year: self.founded_year,
            mission: self.mission,
            vision: self.vision,
            is_verified: Some(false),
        }
    }

    /// แปลง Request DTO เป็น UpdateCompany
    pub fn into_update_company(self) -> UpdateCompany {
        UpdateCompany {
            company_name: Some(self.company_name),
            industry: self.industry,
            email: self.email,
            company_size: self.company_size,
            description: self.description,
            phone: self.phone,
            address_detail: self.address_detail,
            province: self.province,
            district: self.district,
            subdistrict: self.subdistrict,
            postal_code: self.postal_code,
            updated_at: None,
            status: self.status,
            logo_url: self.logo_url,
            founded_year: self.founded_year,
            mission: self.mission,
            vision: self.vision,
            is_verified: None,
        }
    }
}
