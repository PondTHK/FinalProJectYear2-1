use crate::infrastructure::postgres::schema::user_skills;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = user_skills)]
pub struct UserSkillEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub skills: Option<Vec<Option<String>>>, // Array<Nullable<Text>>
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = user_skills)]
pub struct NewUserSkill {
    pub user_id: Uuid,
    pub skills: Option<Vec<Option<String>>>,
}

#[derive(Debug, Clone, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = user_skills)]
pub struct UpdateUserSkill {
    pub skills: Option<Vec<Option<String>>>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSkillRequest {
    pub skills: Vec<String>,
}

impl UserSkillRequest {
    /// แปลง Request DTO เป็น NewUserSkill พร้อม user_id
    pub fn into_new_skill(self, user_id: Uuid) -> NewUserSkill {
        let skills_array: Vec<Option<String>> = self.skills.into_iter().map(Some).collect();
        NewUserSkill {
            user_id,
            skills: Some(skills_array),
        }
    }

    /// แปลง Request DTO เป็น UpdateUserSkill
    pub fn into_update_skill(self) -> UpdateUserSkill {
        let skills_array: Vec<Option<String>> = self.skills.into_iter().map(Some).collect();
        UpdateUserSkill {
            skills: Some(skills_array),
            updated_at: Some(Utc::now()),
        }
    }
}

