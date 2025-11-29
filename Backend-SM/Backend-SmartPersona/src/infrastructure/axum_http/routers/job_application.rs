use axum::{
    extract::{Path, State, Extension},
    routing::{get, post},
    http::StatusCode,
    response::IntoResponse,
    middleware,
    Json, Router,
};
use std::sync::Arc;
use uuid::Uuid;
use tracing::{info, error};
use crate::domain::entities::job_application::{NewJobApplication, JobApplicationWithUser};
use crate::domain::repo::job_application::JobApplicationRepository;
use crate::infrastructure::jwt_authentication::jwt_model::Claims;
use crate::infrastructure::axum_http::middleware::user_authorization;
use crate::infrastructure::email::service::EmailService;

// State struct to hold both repository and email service
pub struct JobApplicationState {
    pub repo: Arc<dyn JobApplicationRepository>,
    pub email_service: Arc<EmailService>,
    pub db_pool: Arc<crate::infrastructure::postgres::postgres_connection::DbPool>,
}

pub fn router(
    repo: Arc<dyn JobApplicationRepository>,
    email_service: Arc<EmailService>,
    db_pool: Arc<crate::infrastructure::postgres::postgres_connection::DbPool>,
) -> Router {
    let state = Arc::new(JobApplicationState {
        repo,
        email_service,
        db_pool,
    });

    Router::new()
        .route("/apply", post(apply_for_job))
        .route("/candidates/:job_id", get(get_job_candidates))
        .route("/my-applications", get(get_my_applications))
        .route("/applications/:application_id/status", axum::routing::patch(update_application_status))
        .layer(middleware::from_fn(user_authorization))
        .with_state(state)
}

#[derive(serde::Deserialize)]
struct ApplyRequest {
    job_id: Uuid,
}

async fn apply_for_job(
    State(state): State<Arc<JobApplicationState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ApplyRequest>,
) -> impl IntoResponse {
    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid user ID").into_response(),
    };

    // Check if already applied
    match state.repo.check_existing(user_id, payload.job_id).await {
        Ok(true) => return (StatusCode::CONFLICT, "You have already applied for this job").into_response(),
        Ok(false) => {},
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    let new_application = NewJobApplication {
        job_id: payload.job_id,
        user_id,
        status: "pending".to_string(),
    };

    // Create application
    match state.repo.create(new_application).await {
        Ok(_) => {
            // Send email notification to company
            tokio::spawn({
                let email_service = Arc::clone(&state.email_service);
                let db_pool = Arc::clone(&state.db_pool);
                let job_id = payload.job_id;
                let user_id = user_id;

                async move {
                    // Fetch job details and company info
                    use diesel::prelude::*;
                    use crate::infrastructure::postgres::schema::{company_posts, companies, user_profiles};

                    let mut conn = match db_pool.get() {
                        Ok(conn) => conn,
                        Err(e) => {
                            error!("Failed to get database connection: {}", e);
                            return;
                        }
                    };

                    // Get job and company details
                    let job_company_result: Result<(String, String, Uuid), diesel::result::Error> = company_posts::table
                        .inner_join(companies::table.on(companies::id.eq(company_posts::company_id)))
                        .filter(company_posts::id.eq(job_id))
                        .select((
                            company_posts::title,
                            companies::company_name,
                            companies::user_id,
                        ))
                        .first(&mut conn);

                    // Get applicant details
                    let applicant_result: Result<(String, String), diesel::result::Error> = user_profiles::table
                        .filter(user_profiles::user_id.eq(user_id))
                        .select((
                            user_profiles::email.nullable(),
                            user_profiles::first_name_en.nullable(),
                            user_profiles::last_name_en.nullable(),
                        ))
                        .first::<(Option<String>, Option<String>, Option<String>)>(&mut conn)
                        .and_then(|(email_opt, fn_opt, ln_opt)| {
                            let email = email_opt.ok_or_else(|| diesel::result::Error::NotFound)?;
                            let first_name = fn_opt.unwrap_or_else(|| "".to_string());
                            let last_name = ln_opt.unwrap_or_else(|| "".to_string());
                            let full_name = format!("{} {}", first_name, last_name).trim().to_string();
                            Ok((email, full_name))
                        });

                    match (job_company_result, applicant_result) {
                        (Ok((job_title, company_name, company_user_id)), Ok((applicant_email, applicant_name))) => {
                            // Get company email from user_profiles
                            let company_email_result: Result<Option<String>, diesel::result::Error> = user_profiles::table
                                .filter(user_profiles::user_id.eq(company_user_id))
                                .select(user_profiles::email.nullable())
                                .first(&mut conn);

                            if let Ok(Some(company_email)) = company_email_result {
                                info!("Sending job application email to company: {}", company_email);
                                if let Err(e) = email_service.send_job_application_notification(
                                    &company_email,
                                    &company_name,
                                    &applicant_name,
                                    &job_title,
                                    &applicant_email,
                                ).await {
                                    error!("Failed to send job application email: {}", e);
                                } else {
                                    info!("Job application email sent successfully");
                                }
                            } else {
                                error!("Failed to fetch company email");
                            }
                        }
                        _ => {
                            error!("Failed to fetch job/company/applicant details for email notification");
                        }
                    }
                }
            });

            (StatusCode::CREATED, Json(serde_json::json!({
                "message": "Application submitted successfully"
            }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_job_candidates(
    State(state): State<Arc<JobApplicationState>>,
    Path(job_id): Path<Uuid>,
) -> impl IntoResponse {
    match state.repo.find_by_job_id(job_id).await {
        Ok(candidates) => (StatusCode::OK, Json(candidates)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_my_applications(
    State(state): State<Arc<JobApplicationState>>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return (StatusCode::BAD_REQUEST, "Invalid user ID").into_response(),
    };
    
    match state.repo.find_by_user_id(user_id).await {
        Ok(applications) => (StatusCode::OK, Json(applications)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[derive(serde::Deserialize)]
struct UpdateStatusRequest {
    status: String,
}

async fn update_application_status(
    State(state): State<Arc<JobApplicationState>>,
    Path(application_id): Path<Uuid>,
    Json(payload): Json<UpdateStatusRequest>,
) -> impl IntoResponse {
    // Validate status
    if !["pending", "accepted", "rejected"].contains(&payload.status.as_str()) {
        return (StatusCode::BAD_REQUEST, "Invalid status. Must be 'pending', 'accepted', or 'rejected'").into_response();
    }

    match state.repo.update_status(application_id, payload.status.clone()).await {
        Ok(_) => {
            // Send email notification if accepted
            if payload.status == "accepted" {
                tokio::spawn({
                    let email_service = Arc::clone(&state.email_service);
                    let db_pool = Arc::clone(&state.db_pool);

                    async move {
                        use diesel::prelude::*;
                        use crate::infrastructure::postgres::schema::{job_applications, company_posts, companies, user_profiles};

                        let mut conn = match db_pool.get() {
                            Ok(conn) => conn,
                            Err(e) => {
                                error!("Failed to get database connection: {}", e);
                                return;
                            }
                        };

                        // Fetch application and job details
                        let app_job_result: Result<(Uuid, Uuid, String), diesel::result::Error> = job_applications::table
                            .inner_join(company_posts::table.on(company_posts::id.eq(job_applications::job_id)))
                            .filter(job_applications::id.eq(application_id))
                            .select((
                                job_applications::user_id,
                                company_posts::company_id,
                                company_posts::title,
                            ))
                            .first(&mut conn);

                        match app_job_result {
                            Ok((applicant_user_id, company_id, job_title)) => {
                                // Get applicant details
                                let applicant_result: Result<(String, String), diesel::result::Error> = user_profiles::table
                                    .filter(user_profiles::user_id.eq(applicant_user_id))
                                    .select((
                                        user_profiles::email.nullable(),
                                        user_profiles::first_name_en.nullable(),
                                        user_profiles::last_name_en.nullable(),
                                    ))
                                    .first::<(Option<String>, Option<String>, Option<String>)>(&mut conn)
                                    .and_then(|(email_opt, fn_opt, ln_opt)| {
                                        let email = email_opt.ok_or_else(|| diesel::result::Error::NotFound)?;
                                        let first_name = fn_opt.unwrap_or_else(|| "".to_string());
                                        let last_name = ln_opt.unwrap_or_else(|| "".to_string());
                                        let full_name = format!("{} {}", first_name, last_name).trim().to_string();
                                        Ok((email, full_name))
                                    });

                                // Get company details
                                let company_result: Result<(String, Uuid), diesel::result::Error> = companies::table
                                    .filter(companies::id.eq(company_id))
                                    .select((
                                        companies::company_name,
                                        companies::user_id,
                                    ))
                                    .first(&mut conn);

                                match (applicant_result, company_result) {
                                    (Ok((applicant_email, applicant_name)), Ok((company_name, company_user_id))) => {
                                        // Get company email
                                        let company_email_result: Result<Option<String>, diesel::result::Error> = user_profiles::table
                                            .filter(user_profiles::user_id.eq(company_user_id))
                                            .select(user_profiles::email.nullable())
                                            .first(&mut conn);

                                        if let Ok(Some(company_email)) = company_email_result {
                                            info!("Sending job acceptance email to applicant: {}", applicant_email);
                                            if let Err(e) = email_service.send_job_acceptance_notification(
                                                &applicant_email,
                                                &applicant_name,
                                                &company_name,
                                                &job_title,
                                                &company_email,
                                            ).await {
                                                error!("Failed to send job acceptance email: {}", e);
                                            } else {
                                                info!("Job acceptance email sent successfully");
                                            }
                                        } else {
                                            error!("Failed to fetch company email");
                                        }
                                    }
                                    _ => {
                                        error!("Failed to fetch applicant or company details");
                                    }
                                }
                            }
                            Err(e) => {
                                error!("Failed to fetch application details for email notification: {}", e);
                            }
                        }
                    }
                });
            }

            (StatusCode::OK, Json(serde_json::json!({
                "message": "Application status updated successfully"
            }))).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
