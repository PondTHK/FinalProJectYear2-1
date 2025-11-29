use anyhow::Result;
use axum::async_trait;
use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_address::{NewUserAddress, UpdateUserAddress, UserAddressEntity},
        repo::user_address::UserAddressRepository,
    },
    infrastructure::postgres::{postgres_connection::DbPool, schema::user_addresses},
};

pub struct UserAddressPostgres {
    db_pool: Arc<DbPool>,
}

impl UserAddressPostgres {
    pub fn new(db_pool: Arc<DbPool>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl UserAddressRepository for UserAddressPostgres {
    async fn create(&self, new_address: &NewUserAddress) -> Result<UserAddressEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = diesel::insert_into(user_addresses::table)
            .values(new_address)
            .returning(UserAddressEntity::as_returning())
            .get_result::<UserAddressEntity>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Option<UserAddressEntity>> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let result = user_addresses::table
            .filter(user_addresses::user_id.eq(user_id))
            .first::<UserAddressEntity>(&mut conn)
            .optional()?;

        Ok(result)
    }

    async fn update_by_user_id(
        &self,
        user_id: Uuid,
        update_data: &UpdateUserAddress,
    ) -> Result<UserAddressEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // เพิ่ม updated_at timestamp
        let mut data = update_data.clone();
        data.updated_at = Some(Utc::now());

        let result = diesel::update(user_addresses::table)
            .filter(user_addresses::user_id.eq(user_id))
            .set(&data)
            .returning(UserAddressEntity::as_returning())
            .get_result::<UserAddressEntity>(&mut conn)?;

        Ok(result)
    }

    async fn upsert_by_user_id(
        &self,
        _user_id: Uuid,
        address_data: &NewUserAddress,
    ) -> Result<UserAddressEntity> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // ใช้ ON CONFLICT สำหรับ upsert (insert หรือ update อัตโนมัติ)
        let result = diesel::insert_into(user_addresses::table)
            .values(address_data)
            .on_conflict(user_addresses::user_id)
            .do_update()
            .set((
                user_addresses::province.eq(&address_data.province),
                user_addresses::district.eq(&address_data.district),
                user_addresses::subdistrict.eq(&address_data.subdistrict),
                user_addresses::postal_code.eq(&address_data.postal_code),
                user_addresses::address_detail.eq(&address_data.address_detail),
                user_addresses::updated_at.eq(Utc::now()),
            ))
            .returning(UserAddressEntity::as_returning())
            .get_result::<UserAddressEntity>(&mut conn)?;

        Ok(result)
    }

    async fn delete_by_user_id(&self, user_id: Uuid) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        diesel::delete(user_addresses::table)
            .filter(user_addresses::user_id.eq(user_id))
            .execute(&mut conn)?;

        Ok(())
    }
}
