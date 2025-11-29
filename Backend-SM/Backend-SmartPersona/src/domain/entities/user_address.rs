use crate::infrastructure::postgres::schema::user_addresses;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Queryable, Selectable, Identifiable)]
#[diesel(table_name = user_addresses)]
pub struct UserAddressEntity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub address_detail: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

// Custom Serialize implementation for JSON response
impl serde::Serialize for UserAddressEntity {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("UserAddressEntity", 9)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("user_id", &self.user_id)?;
        state.serialize_field("province", &self.province)?;
        state.serialize_field("district", &self.district)?;
        state.serialize_field("subdistrict", &self.subdistrict)?;
        state.serialize_field("postal_code", &self.postal_code)?;
        state.serialize_field("address_detail", &self.address_detail)?;
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
#[diesel(table_name = user_addresses)]
pub struct NewUserAddress {
    pub id: Uuid,
    pub user_id: Uuid,
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub address_detail: Option<String>,
}

impl NewUserAddress {
    pub fn new(
        user_id: Uuid,
        province: Option<String>,
        district: Option<String>,
        subdistrict: Option<String>,
        postal_code: Option<String>,
        address_detail: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            province,
            district,
            subdistrict,
            postal_code,
            address_detail,
        }
    }
}

#[derive(Debug, Clone, AsChangeset, Serialize, Deserialize)]
#[diesel(table_name = user_addresses)]
pub struct UpdateUserAddress {
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub address_detail: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// DTO สำหรับรับข้อมูลจาก API request (ไม่มี id และ user_id)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserAddressRequest {
    pub province: Option<String>,
    pub district: Option<String>,
    pub subdistrict: Option<String>,
    pub postal_code: Option<String>,
    pub address_detail: Option<String>,
}

impl UserAddressRequest {
    /// แปลง Request DTO เป็น NewUserAddress พร้อม user_id
    pub fn into_new_address(self, user_id: Uuid) -> NewUserAddress {
        NewUserAddress {
            id: Uuid::new_v4(),
            user_id,
            province: self.province,
            district: self.district,
            subdistrict: self.subdistrict,
            postal_code: self.postal_code,
            address_detail: self.address_detail,
        }
    }

    /// แปลง Request DTO เป็น UpdateUserAddress
    pub fn into_update_address(self) -> UpdateUserAddress {
        UpdateUserAddress {
            province: self.province,
            district: self.district,
            subdistrict: self.subdistrict,
            postal_code: self.postal_code,
            address_detail: self.address_detail,
            updated_at: Some(Utc::now()),
        }
    }
}
