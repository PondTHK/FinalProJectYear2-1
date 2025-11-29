use crate::domain::{
    entities::user_experience::{
        NewUserExperience, UpdateUserExperience, UserExperienceEntity, UserExperienceRequest,
    },
    repo::user_experience::UserExperienceRepository,
};
use anyhow::Result;
use chrono::NaiveDate;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserExperienceUseCase<T>
where
    T: UserExperienceRepository + Send + Sync,
{
    user_experience_repository: Arc<T>,
}

impl<T> UserExperienceUseCase<T>
where
    T: UserExperienceRepository + Send + Sync,
{
    pub fn new(user_experience_repository: Arc<T>) -> Self {
        Self {
            user_experience_repository,
        }
    }

    /// สร้างข้อมูลประสบการณ์ใหม่
    pub async fn create_experience(
        &self,
        new_experience: NewUserExperience,
    ) -> Result<UserExperienceEntity> {
        // Validate business rules
        self.validate_experience_dates(new_experience.start_date, new_experience.end_date)?;

        // Check if experience with same key already exists
        let existing = self
            .user_experience_repository
            .get_by_key(
                new_experience.user_id,
                &new_experience.company,
                new_experience.start_date,
            )
            .await?;

        if existing.is_some() {
            return Err(anyhow::anyhow!(
                "Experience with company '{}' and start date '{}' already exists",
                new_experience.company,
                new_experience.start_date
            ));
        }

        self.user_experience_repository.create(&new_experience).await
    }

    /// ดึงข้อมูลประสบการณ์ทั้งหมดของ user
    pub async fn get_user_experiences(&self, user_id: Uuid) -> Result<Vec<UserExperienceEntity>> {
        let mut experiences = self
            .user_experience_repository
            .get_by_user_id(user_id)
            .await?;

        // Sort by start_date descending (most recent first)
        experiences.sort_by(|a, b| b.start_date.cmp(&a.start_date));

        Ok(experiences)
    }

    /// ดึงข้อมูลประสบการณ์ตาม composite key
    pub async fn get_experience_by_key(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: NaiveDate,
    ) -> Result<Option<UserExperienceEntity>> {
        self.user_experience_repository
            .get_by_key(user_id, company, start_date)
            .await
    }

    /// อัปเดตข้อมูลประสบการณ์
    pub async fn update_experience(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: NaiveDate,
        update_data: UpdateUserExperience,
    ) -> Result<UserExperienceEntity> {
        // Validate business rules for dates if provided
        if let Some(end_date) = &update_data.end_date {
            self.validate_experience_dates(start_date, *end_date)?;
        }

        // Check if experience exists
        let existing = self
            .user_experience_repository
            .get_by_key(user_id, company, start_date)
            .await?
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Experience with company '{}' and start date '{}' not found",
                    company,
                    start_date
                )
            })?;

        self.user_experience_repository
            .update_by_key(user_id, company, start_date, &update_data)
            .await
    }

    /// ลบข้อมูลประสบการณ์ตาม composite key
    pub async fn delete_experience(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: NaiveDate,
    ) -> Result<()> {
        // Check if experience exists before deleting
        let _existing = self
            .user_experience_repository
            .get_by_key(user_id, company, start_date)
            .await?
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Experience with company '{}' and start date '{}' not found",
                    company,
                    start_date
                )
            })?;

        self.user_experience_repository
            .delete_by_key(user_id, company, start_date)
            .await
    }

    /// ลบข้อมูลประสบการณ์ทั้งหมดของ user
    pub async fn delete_all_user_experiences(&self, user_id: Uuid) -> Result<()> {
        self.user_experience_repository
            .delete_all_by_user_id(user_id)
            .await
    }

    /// สร้างใหม่ (เพิ่มเข้าไปใน collection ของ user)
    pub async fn add_experience(
        &self,
        new_experience: NewUserExperience,
    ) -> Result<UserExperienceEntity> {
        self.validate_experience_dates(new_experience.start_date, new_experience.end_date)?;

        self.user_experience_repository
            .add_experience(&new_experience)
            .await
    }

    /// อัปเดตประสบการณ์ที่มีอยู่แล้ว (ค้นหาตาม key แล้วอัปเดต)
    pub async fn update_existing_experience(
        &self,
        user_id: Uuid,
        company: &str,
        start_date: NaiveDate,
        update_data: UpdateUserExperience,
    ) -> Result<UserExperienceEntity> {
        // Validate business rules for dates if provided
        if let Some(end_date) = &update_data.end_date {
            self.validate_experience_dates(start_date, *end_date)?;
        }

        self.user_experience_repository
            .update_existing_experience(user_id, company, start_date, &update_data)
            .await
    }

    /// สร้างหรืออัปเดตประสบการณ์ (convenience method for frontend)
    /// ถ้ามี company และ start_date เดิมอยู่แล้ว -> อัปเดต
    /// ถ้าไม่มี -> สร้างใหม่
    pub async fn upsert_experience(
        &self,
        user_id: Uuid,
        experience_request: UserExperienceRequest,
    ) -> Result<UserExperienceEntity> {
        // Validate business rules
        self.validate_experience_dates(experience_request.start_date, experience_request.end_date)?;

        // Check if experience with same key already exists
        let existing = self
            .user_experience_repository
            .get_by_key(
                user_id,
                &experience_request.company,
                experience_request.start_date,
            )
            .await?;

        match existing {
            Some(_) => {
                // Update existing - clone values before moving
                let company = experience_request.company.clone();
                let start_date = experience_request.start_date;
                let update_data = experience_request.into_update_experience();
                self.update_existing_experience(user_id, &company, start_date, update_data)
                    .await
            }
            None => {
                // Create new
                let new_experience = experience_request.into_new_experience(user_id);
                self.create_experience(new_experience).await
            }
        }
    }

    /// ตรวจสอบ business rules สำหรับวันที่
    fn validate_experience_dates(&self, start_date: NaiveDate, end_date: NaiveDate) -> Result<()> {
        if start_date > end_date {
            return Err(anyhow::anyhow!(
                "Start date ({}) cannot be after end date ({})",
                start_date,
                end_date
            ));
        }

        let today = chrono::Utc::now().date_naive();
        if start_date > today {
            return Err(anyhow::anyhow!(
                "Start date ({}) cannot be in the future",
                start_date
            ));
        }

        Ok(())
    }
}

