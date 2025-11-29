use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;
use uuid::Uuid;
use std::sync::Arc;
use crate::domain::entities::job_application::{JobApplicationEntity, NewJobApplication, JobApplicationWithUser};
use crate::domain::repo::job_application::JobApplicationRepository;
use crate::infrastructure::postgres::schema::{job_applications, user_profiles};
use crate::infrastructure::postgres::postgres_connection::DbPool;

pub struct JobApplicationPostgres {
    pool: Arc<DbPool>,
}

impl JobApplicationPostgres {
    pub fn new(pool: Arc<DbPool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl JobApplicationRepository for JobApplicationPostgres {
    async fn create(&self, application: NewJobApplication) -> Result<JobApplicationEntity> {
        let mut conn = self.pool.get()?;

        let result = diesel::insert_into(job_applications::table)
            .values(&application)
            .get_result(&mut conn)?;

        Ok(result)
    }

    async fn find_by_job_id(&self, job_id: Uuid) -> Result<Vec<JobApplicationWithUser>> {
        let mut conn = self.pool.get()?;

        // Join job_applications with user_profiles to get candidate details
        let results = job_applications::table
            .filter(job_applications::job_id.eq(job_id))
            .left_join(user_profiles::table.on(user_profiles::user_id.eq(job_applications::user_id)))
            .select((
                job_applications::all_columns,
                user_profiles::email.nullable(),
                user_profiles::first_name_en.nullable(),
                user_profiles::last_name_en.nullable(),
                user_profiles::first_name_th.nullable(),
                user_profiles::last_name_th.nullable(),
                user_profiles::phone.nullable(),
                user_profiles::profile_image_url.nullable(),
            ))
            .load::<(
                JobApplicationEntity,
                Option<String>, // email
                Option<String>, // first_name_en
                Option<String>, // last_name_en
                Option<String>, // first_name_th
                Option<String>, // last_name_th
                Option<String>, // phone
                Option<String>, // profile_image_url
            )>(&mut conn)?;

        let mapped_results = results.into_iter().map(|(app, email, fn_en, ln_en, fn_th, ln_th, phone, img)| {
            let first_name = fn_en.or(fn_th);
            let last_name = ln_en.or(ln_th);
            
            JobApplicationWithUser {
                id: app.id,
                job_id: app.job_id,
                user_id: app.user_id,
                status: app.status,
                created_at: app.created_at,
                updated_at: app.updated_at,
                first_name,
                last_name,
                email,
                phone,
                profile_image_url: img,
            }
        }).collect();

        Ok(mapped_results)
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> Result<Vec<JobApplicationEntity>> {
        let mut conn = self.pool.get()?;

        let results = job_applications::table
            .filter(job_applications::user_id.eq(user_id))
            .order(job_applications::created_at.desc())
            .load::<JobApplicationEntity>(&mut conn)?;

        Ok(results)
    }

    async fn check_existing(&self, user_id: Uuid, job_id: Uuid) -> Result<bool> {
        let mut conn = self.pool.get()?;

        let count: i64 = job_applications::table
            .filter(job_applications::user_id.eq(user_id))
            .filter(job_applications::job_id.eq(job_id))
            .count()
            .get_result(&mut conn)?;

        Ok(count > 0)
    }

    async fn update_status(&self, application_id: Uuid, status: String) -> Result<JobApplicationEntity> {
        let mut conn = self.pool.get()?;

        let result = diesel::update(job_applications::table.find(application_id))
            .set(job_applications::status.eq(status))
            .get_result(&mut conn)?;

        Ok(result)
    }
}
