use serde::{Deserialize, Serialize};

use crate::domain::entities::user::{RegisterUserEntity, Role, UserStatusEnum};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterUserModel {
    pub username: String,
    pub password: String,
    #[serde(default)]
    pub role: Option<Role>,
}
impl RegisterUserModel {
    pub fn to_entity(&self) -> RegisterUserEntity {
        RegisterUserEntity {
            username: self.username.clone(),
            password_hash: self.password.clone(),
            role: self.role,
            status: Some(UserStatusEnum::Pending), // Default to Pending for new users
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
        }
    }
}
