use crate::infrastructure::postgres::schema::user_educations;
use chrono::{DateTime, NaiveDate, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = user_educations)]
#[diesel(primary_key(user_id, school, start_date))]
pub struct UserEducationEntity {
    pub user_id: Uuid,
    pub school: String,
    pub degree: String,
    pub major: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub description: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_educations)]
pub struct NewUserEducation {
    pub user_id: Uuid,
    pub school: String,
    pub degree: String,
    pub major: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub description: String,
}

impl NewUserEducation {
    pub fn new(
        user_id: Uuid,
        school: String,
        degree: String,
        major: Option<String>,
        start_date: NaiveDate,
        end_date: NaiveDate,
        description: String,
    ) -> Self {
        Self {
            user_id,
            school,
            degree,
            major,
            start_date,
            end_date,
            description,
        }
    }
}

#[derive(Debug, Clone, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = user_educations)]
#[diesel(primary_key(user_id, school, start_date))]
pub struct UpdateUserEducation {
    pub degree: Option<String>,
    pub major: Option<String>,
    pub end_date: Option<NaiveDate>,
    pub description: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserEducationRequest {
    pub school: String,
    pub degree: String,
    pub major: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub description: String,
}

impl UserEducationRequest {
    /// แปลง Request DTO เป็น NewUserEducation พร้อม user_id
    pub fn into_new_education(self, user_id: Uuid) -> NewUserEducation {
        NewUserEducation {
            user_id,
            school: self.school,
            degree: self.degree,
            major: self.major,
            start_date: self.start_date,
            end_date: self.end_date,
            description: self.description,
        }
    }

    /// แปลง Request DTO เป็น UpdateUserEducation
    pub fn into_update_education(self) -> UpdateUserEducation {
        UpdateUserEducation {
            degree: Some(self.degree),
            major: self.major,
            end_date: Some(self.end_date),
            description: Some(self.description),
            updated_at: Some(Utc::now()),
        }
    }
}
