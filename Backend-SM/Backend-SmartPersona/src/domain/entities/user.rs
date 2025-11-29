use crate::infrastructure::postgres::schema::{sql_types::{UserRole, UserStatus}, users};
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use diesel_derive_enum::DbEnum;
#[derive(Debug, Clone, Copy, PartialEq, Eq, DbEnum, Serialize, Deserialize)]
#[ExistingTypePath = "UserRole"]
pub enum Role {
    PersonaUser,
    CompanyUser,
    Admin,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, DbEnum, Serialize, Deserialize)]
#[ExistingTypePath = "UserStatus"]
pub enum UserStatusEnum {
    Pending,
    Active,
    Suspended,
}

#[derive(Debug, Clone, Queryable, Selectable, Serialize, Deserialize)]
#[diesel(table_name = users)]
pub struct UserEntity {
    pub id: Uuid,
    pub username: String,
    pub password_hash: String,
    pub display_name: Option<String>,
    pub role: Role,
    pub status: UserStatusEnum,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Insertable, Queryable)]
#[diesel(table_name = users)]
pub struct RegisterUserEntity {
    pub username: String,
    pub password_hash: String,
    pub role: Option<Role>,
    pub status: Option<UserStatusEnum>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}
