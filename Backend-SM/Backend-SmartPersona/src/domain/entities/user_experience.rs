use crate::infrastructure::postgres::schema::user_experiences;
use chrono::{DateTime, NaiveDate, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable)]
#[diesel(table_name = user_experiences)]
#[diesel(primary_key(user_id, company, start_date))]
pub struct UserExperienceEntity {
    pub user_id: Uuid,
    pub company: String,
    pub position: String,
    pub position_type: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub description: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

// Custom Serialize implementation for JSON response
impl serde::Serialize for UserExperienceEntity {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("UserExperienceEntity", 9)?;
        state.serialize_field("user_id", &self.user_id)?;
        state.serialize_field("company", &self.company)?;
        state.serialize_field("position", &self.position)?;
        state.serialize_field("position_type", &self.position_type)?;
        state.serialize_field("start_date", &self.start_date.format("%Y-%m-%d").to_string())?;
        state.serialize_field("end_date", &self.end_date.format("%Y-%m-%d").to_string())?;
        state.serialize_field("description", &self.description)?;
        state.serialize_field(
            "created_at",
            &self.created_at.map(|dt| dt.to_rfc3339()),
        )?;
        state.serialize_field(
            "updated_at",
            &self.updated_at.map(|dt| dt.to_rfc3339()),
        )?;
        state.end()
    }
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_experiences)]
pub struct NewUserExperience {
    pub user_id: Uuid,
    pub company: String,
    pub position: String,
    pub position_type: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub description: String,
}

impl NewUserExperience {
    pub fn new(
        user_id: Uuid,
        company: String,
        position: String,
        position_type: Option<String>,
        start_date: NaiveDate,
        end_date: NaiveDate,
        description: String,
    ) -> Self {
        Self {
            user_id,
            company,
            position,
            position_type,
            start_date,
            end_date,
            description,
        }
    }
}

#[derive(Debug, Clone, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = user_experiences)]
#[diesel(primary_key(user_id, company, start_date))]
pub struct UpdateUserExperience {
    pub position: Option<String>,
    pub position_type: Option<String>,
    pub end_date: Option<NaiveDate>,
    pub description: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserExperienceRequest {
    pub company: String,
    pub position: String,
    pub position_type: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub description: String,
}

impl UserExperienceRequest {
    /// แปลง Request DTO เป็น NewUserExperience พร้อม user_id
    pub fn into_new_experience(self, user_id: Uuid) -> NewUserExperience {
        NewUserExperience {
            user_id,
            company: self.company,
            position: self.position,
            position_type: self.position_type,
            start_date: self.start_date,
            end_date: self.end_date,
            description: self.description,
        }
    }

    /// แปลง Request DTO เป็น UpdateUserExperience
    pub fn into_update_experience(self) -> UpdateUserExperience {
        UpdateUserExperience {
            position: Some(self.position),
            position_type: self.position_type,
            end_date: Some(self.end_date),
            description: Some(self.description),
            updated_at: Some(Utc::now()),
        }
    }
}

