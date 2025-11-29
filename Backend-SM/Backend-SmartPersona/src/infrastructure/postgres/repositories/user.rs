use anyhow::{Ok, Result};
use axum::async_trait;
use diesel::{dsl::{insert_into, update}, prelude::*};
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

use crate::{
    domain::{
        entities::user::{RegisterUserEntity, UserEntity, UserStatusEnum},
        repo::user::UserRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::users},
};

pub struct UserPostgres {
    db_pool: Arc<DbPool>,
}
impl UserPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}
#[async_trait]
impl UserRepository for UserPostgres {
    async fn register(&self, register_user_entity: RegisterUserEntity) -> Result<Uuid> {
        use crate::domain::entities::user::{Role, UserStatusEnum};
        
        let mut conn = Arc::clone(&self.db_pool).get()?;
        
        // If role is None, use database default (PersonaUser)
        let role = register_user_entity.role.unwrap_or(Role::PersonaUser);
        
        // If status is None, use database default (Pending)
        let status = register_user_entity.status.unwrap_or(UserStatusEnum::Pending);
        
        let result = insert_into(users::table)
            .values((
                users::username.eq(register_user_entity.username),
                users::password_hash.eq(register_user_entity.password_hash),
                users::role.eq(role),
                users::status.eq(status),
                users::created_at.eq(register_user_entity.created_at),
                users::updated_at.eq(register_user_entity.updated_at),
            ))
            .returning(users::id)
            .get_result::<Uuid>(&mut conn)?;
        
        Ok(result)
    }
    async fn find_by_username(&self, username: String) -> Result<UserEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let result = users::table
            .filter(users::username.eq(username))
            .select(UserEntity::as_select())
            .first::<UserEntity>(&mut conn)?;
        Ok(result)
    }
    async fn find_by_id(&self, user_id: Uuid) -> Result<UserEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let result = users::table
            .filter(users::id.eq(user_id))
            .select(UserEntity::as_select())
            .first::<UserEntity>(&mut conn)?;
        Ok(result)
    }

    async fn update_status(&self, user_id: Uuid, status: String) -> Result<UserEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;
        
        // Convert string to UserStatusEnum
        let user_status = match status.to_lowercase().as_str() {
            "pending" => UserStatusEnum::Pending,
            "active" => UserStatusEnum::Active,
            "suspended" => UserStatusEnum::Suspended,
            _ => return Err(anyhow::anyhow!("Invalid status: {}", status)),
        };

        // Update the status
        let rows_affected = update(users::table.filter(users::id.eq(user_id)))
            .set((
                users::status.eq(user_status),
                users::updated_at.eq(Utc::now().naive_utc()),
            ))
            .execute(&mut conn)?;
        
        if rows_affected == 0 {
            return Err(anyhow::anyhow!("User not found: {}", user_id));
        }
        
        // Fetch the updated user
        let updated = self.find_by_id(user_id).await?;
        
        Ok(updated)
    }
}
