use crate::infrastructure::postgres::schema::company_galleries;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Struct สำหรับ "อ่าน" (Queryable)
#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = company_galleries)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct CompanyGalleryEntity {
    pub id: Uuid,
    pub company_id: Uuid,
    pub image_url: String,
    pub created_at: DateTime<Utc>,
}

// Struct สำหรับ "สร้างใหม่" (Insertable)
#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = company_galleries)]
pub struct NewCompanyGallery {
    pub company_id: Uuid,
    pub image_url: String,
}

/// DTO สำหรับรับข้อมูลจาก API request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGalleryRequest {
    pub image_url: String,
}

impl CreateGalleryRequest {
    pub fn into_new_gallery(self, company_id: Uuid) -> NewCompanyGallery {
        NewCompanyGallery {
            company_id,
            image_url: self.image_url,
        }
    }
}
