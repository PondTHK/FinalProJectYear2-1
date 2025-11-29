use crate::infrastructure::postgres::schema::company_posts;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Struct สำหรับ "อ่าน" (Queryable)
#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = company_posts)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct CompanyPostEntity {
    pub id: Uuid,
    pub company_id: Uuid,
    pub title: String,
    pub location: String,
    pub job_type: String,
    pub salary_range: Option<String>,
    pub tags: Option<Vec<Option<String>>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub description: Option<String>,
    pub responsibilities: Option<String>,
    pub qualifications: Option<String>,
    pub benefits: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

// Struct สำหรับ "สร้างใหม่" (Insertable)
#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = company_posts)]
pub struct NewCompanyPost {
    pub company_id: Uuid,
    pub title: String,
    pub location: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub job_type: String,
    pub salary_range: Option<String>,
    pub tags: Option<Vec<Option<String>>>,
    pub description: Option<String>,
    pub status: String,
    pub responsibilities: Option<String>,
    pub qualifications: Option<String>,
    pub benefits: Option<String>,
}

// Struct สำหรับ "อัปเดต" (AsChangeset)
#[derive(Debug, Clone, AsChangeset, Deserialize)]
#[diesel(table_name = company_posts)]
pub struct UpdateCompanyPost {
    pub title: Option<String>,
    pub location: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub job_type: Option<String>,
    pub salary_range: Option<String>,
    pub tags: Option<Vec<Option<String>>>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
    pub responsibilities: Option<String>,
    pub qualifications: Option<String>,
    pub benefits: Option<String>,
}

/// DTO สำหรับรับข้อมูลจาก API request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePostRequest {
    pub title: String,
    pub location: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub job_type: String,
    pub salary_range: Option<String>,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub responsibilities: Option<String>,
    pub qualifications: Option<String>,
    pub benefits: Option<String>,
}

impl CreatePostRequest {
    pub fn into_new_post(self, company_id: Uuid) -> NewCompanyPost {
        NewCompanyPost {
            company_id,
            title: self.title,
            location: self.location,
            latitude: self.latitude,
            longitude: self.longitude,
            job_type: self.job_type,
            salary_range: self.salary_range,
            tags: self.tags.map(|t| t.into_iter().map(Some).collect()),
            description: self.description,
            status: self.status.unwrap_or_else(|| "active".to_string()),
            responsibilities: self.responsibilities,
            qualifications: self.qualifications,
            benefits: self.benefits,
        }
    }
}

/// DTO สำหรับรับข้อมูล Update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePostRequest {
    pub title: Option<String>,
    pub location: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub job_type: Option<String>,
    pub salary_range: Option<String>,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub responsibilities: Option<String>,
    pub qualifications: Option<String>,
    pub benefits: Option<String>,
}

impl UpdatePostRequest {
    pub fn into_update_post(self) -> UpdateCompanyPost {
        UpdateCompanyPost {
            title: self.title,
            location: self.location,
            latitude: self.latitude,
            longitude: self.longitude,
            job_type: self.job_type,
            salary_range: self.salary_range,
            tags: self.tags.map(|t| t.into_iter().map(Some).collect()),
            description: self.description,
            status: self.status,
            updated_at: None, // Will be set by DB or Repo logic if needed, or default to now()
            responsibilities: self.responsibilities,
            qualifications: self.qualifications,
            benefits: self.benefits,
        }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanyPostWithCompany {
    #[serde(flatten)]
    pub post: CompanyPostEntity,
    pub company_name: String,
    pub company_logo: Option<String>,
}
