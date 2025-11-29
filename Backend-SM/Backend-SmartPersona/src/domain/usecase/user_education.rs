use crate::domain::{
    entities::user_education::{
        NewUserEducation, UpdateUserEducation, UserEducationEntity, UserEducationRequest,
    },
    repo::user_education::UserEducationRepository,
};
use anyhow::Result;
use chrono::NaiveDate;
use std::sync::Arc;
use uuid::Uuid;

pub struct UserEducationUseCase<T>
where
    T: UserEducationRepository + Send + Sync,
{
    user_education_repository: Arc<T>,
}

impl<T> UserEducationUseCase<T>
where
    T: UserEducationRepository + Send + Sync,
{
    pub fn new(user_education_repository: Arc<T>) -> Self {
        Self {
            user_education_repository,
        }
    }

    /// สร้างข้อมูลการศึกษาใหม่
    pub async fn create_education(
        &self,
        new_education: NewUserEducation,
    ) -> Result<UserEducationEntity> {
        // Validate business rules
        self.validate_education_dates(new_education.start_date, new_education.end_date)?;

        // Check if education with same key already exists
        let existing = self
            .user_education_repository
            .get_by_key(
                new_education.user_id,
                &new_education.school,
                new_education.start_date,
            )
            .await?;

        if existing.is_some() {
            return Err(anyhow::anyhow!(
                "Education with school '{}' and start date '{}' already exists",
                new_education.school,
                new_education.start_date
            ));
        }

        self.user_education_repository.create(&new_education).await
    }

    /// ดึงข้อมูลการศึกษาทั้งหมดของ user
    pub async fn get_user_educations(&self, user_id: Uuid) -> Result<Vec<UserEducationEntity>> {
        let mut educations = self
            .user_education_repository
            .get_by_user_id(user_id)
            .await?;

        // Sort by start_date descending (most recent first)
        educations.sort_by(|a, b| b.start_date.cmp(&a.start_date));

        Ok(educations)
    }

    /// ดึงข้อมูลการศึกษาตาม composite key
    pub async fn get_education_by_key(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: NaiveDate,
    ) -> Result<Option<UserEducationEntity>> {
        self.user_education_repository
            .get_by_key(user_id, school, start_date)
            .await
    }

    /// อัปเดตข้อมูลการศึกษา
    pub async fn update_education(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: NaiveDate,
        update_data: UpdateUserEducation,
    ) -> Result<UserEducationEntity> {
        // Validate business rules for dates if provided
        if let Some(end_date) = &update_data.end_date {
            self.validate_education_dates(start_date, *end_date)?;
        }

        // Check if education exists
        let existing = self
            .user_education_repository
            .get_by_key(user_id, school, start_date)
            .await?
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Education with school '{}' and start date '{}' not found",
                    school,
                    start_date
                )
            })?;

        self.user_education_repository
            .update_by_key(user_id, school, start_date, &update_data)
            .await
    }

    /// ลบข้อมูลการศึกษาตาม composite key
    pub async fn delete_education(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: NaiveDate,
    ) -> Result<()> {
        // Check if education exists before deleting
        let _existing = self
            .user_education_repository
            .get_by_key(user_id, school, start_date)
            .await?
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Education with school '{}' and start date '{}' not found",
                    school,
                    start_date
                )
            })?;

        self.user_education_repository
            .delete_by_key(user_id, school, start_date)
            .await
    }

    /// ลบข้อมูลการศึกษาทั้งหมดของ user
    pub async fn delete_all_user_educations(&self, user_id: Uuid) -> Result<()> {
        self.user_education_repository
            .delete_all_by_user_id(user_id)
            .await
    }

    /// สร้างใหม่ (เพิ่มเข้าไปใน collection ของ user)
    pub async fn add_education(
        &self,
        new_education: NewUserEducation,
    ) -> Result<UserEducationEntity> {
        self.validate_education_dates(new_education.start_date, new_education.end_date)?;

        self.user_education_repository
            .add_education(&new_education)
            .await
    }

    /// อัปเดตการศึกษาที่มีอยู่แล้ว (ค้นหาตาม key แล้วอัปเดต)
    pub async fn update_existing_education(
        &self,
        user_id: Uuid,
        school: &str,
        start_date: NaiveDate,
        update_data: UpdateUserEducation,
    ) -> Result<UserEducationEntity> {
        // Validate business rules for dates if provided
        if let Some(end_date) = &update_data.end_date {
            self.validate_education_dates(start_date, *end_date)?;
        }

        self.user_education_repository
            .update_existing_education(user_id, school, start_date, &update_data)
            .await
    }

    /// สร้างหรืออัปเดตการศึกษา (convenience method for frontend)
    /// ถ้ามี school และ start_date เดิมอยู่แล้ว -> อัปเดต
    /// ถ้าไม่มี -> สร้างใหม่
    pub async fn upsert_education(
        &self,
        user_id: Uuid,
        education_request: UserEducationRequest,
    ) -> Result<UserEducationEntity> {
        // Validate business rules
        self.validate_education_dates(education_request.start_date, education_request.end_date)?;

        // Check if education with same key already exists
        let existing = self
            .user_education_repository
            .get_by_key(
                user_id,
                &education_request.school,
                education_request.start_date,
            )
            .await?;

        match existing {
            Some(_) => {
                // Update existing - clone values before moving
                let school = education_request.school.clone();
                let start_date = education_request.start_date;
                let update_data = education_request.into_update_education();
                self.update_existing_education(user_id, &school, start_date, update_data)
                    .await
            }
            None => {
                // Create new
                let new_education = education_request.into_new_education(user_id);
                self.create_education(new_education).await
            }
        }
    }

    /// ตรวจสอบ business rules สำหรับวันที่
    fn validate_education_dates(&self, start_date: NaiveDate, end_date: NaiveDate) -> Result<()> {
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
