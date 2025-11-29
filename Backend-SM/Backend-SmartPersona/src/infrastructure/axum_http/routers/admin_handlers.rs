use axum::{
    Json, Router, extract::{State, Path}, http::StatusCode, middleware, response::IntoResponse,
    routing::{get, post},
};
use std::sync::Arc;

use crate::{
    domain::{
        entities::company::UpdateCompany,
        repo::admin_data::AdminRepository,
        repo::company::CompanyRepository,
        repo::user::UserRepository,
        usecase::admin_data::AdminUseCase,
        usecase::company::CompanyUseCase,

        usecase::user::UserUseCase,
        usecase::user_skill::UserSkillUseCase,
    },
    infrastructure::{
        axum_http::middleware::admin_authorization,
        email::EmailService,
        postgres::{
            postgres_connection::DbPool,
            repositories::admin_data::AdminPostgres,
            repositories::company::CompanyPostgres,

            repositories::user::UserPostgres,
            repositories::user_skill::UserSkillPostgres,
        },
    },
};

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let admin_repository = AdminPostgres::new(Arc::clone(&db_pool));
    let admin_use_case = AdminUseCase::new(Arc::new(admin_repository));

    let company_repository = CompanyPostgres::new(Arc::clone(&db_pool));
    let company_use_case = CompanyUseCase::new(Arc::new(company_repository));

    let user_repository = UserPostgres::new(Arc::clone(&db_pool));
    let user_repository = UserPostgres::new(Arc::clone(&db_pool));
    let user_use_case = UserUseCase::new(Arc::new(user_repository));

    let user_skill_repository = UserSkillPostgres::new(Arc::clone(&db_pool));
    let user_skill_use_case = UserSkillUseCase::new(Arc::new(user_skill_repository));

    // Initialize email service (optional - will log warning if not configured)
    let email_service = match EmailService::new() {
        Ok(service) => {
            tracing::info!("Email service configured successfully");
            Arc::new(service)
        }
        Err(e) => {
            tracing::warn!("Email service not configured: {}. Email sending will be disabled.", e);
            // Create a dummy service - we'll check is_configured() before sending
            Arc::new(EmailService::dummy())
        }
    };

    Router::new()
        .route("/new-users-today", get(new_users_today))
        .route("/users-last-7-days", get(users_last_7_days))
        .route("/dashboard-stats", get(dashboard_stats))
        .route("/companies", get(get_all_companies))
        .route("/companies/:id/approve", post(approve_company))
        .route("/companies/:id/reject", post(reject_company))
        .route("/companies/:id/ban", post(ban_company))
        .route("/companies/:id/unban", post(unban_company))
        .route("/users/:id/ban", post(ban_user))
        .route("/users/:id/unban", post(unban_user))
        .route("/users/:id/skills", get(get_user_skills))
        .with_state((Arc::new(admin_use_case), Arc::new(company_use_case), Arc::new(user_use_case), email_service, Arc::new(user_skill_use_case)))
        .layer(middleware::from_fn(admin_authorization))
}

async fn new_users_today<T>(State((admin_use_case, _, _, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    match admin_use_case.get_new_users_today().await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn users_last_7_days<T>(State((admin_use_case, _, _, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    match admin_use_case.get_users_last_7_days().await {
        Ok(users) => {
            let response = serde_json::json!({
                "count": users.len(),
                "users": users
            });
            (StatusCode::OK, Json(response)).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn dashboard_stats<T>(State((admin_use_case, _, _, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    match admin_use_case.get_dashboard_stats().await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_all_companies<T>(State((_, company_use_case, _, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    match company_use_case.get_all_companies().await {
        Ok(companies) => (StatusCode::OK, Json(companies)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn approve_company<T>(
    State((_, company_use_case, _, email_service, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>,
    Path(company_id): Path<uuid::Uuid>,
) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    // Get company first
    let company = match company_use_case.get_company_by_id(company_id).await {
        Ok(Some(company)) => company,
        Ok(None) => return (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    // Update company status to "approved"
    let mut update_data = UpdateCompany::default();
    update_data.status = Some("approved".to_string());
    update_data.updated_at = Some(chrono::Utc::now());

    match company_use_case.update_company(company.user_id, update_data).await {
        Ok(updated_company) => {
            // Send approval email (only if email service is configured)
            if email_service.is_configured() {
                if let Some(email) = &updated_company.email {
                    if let Err(e) = email_service
                        .send_company_approval_email(email, &updated_company.company_name)
                        .await
                    {
                        tracing::error!("Failed to send approval email: {}", e);
                        // Don't fail the request if email fails
                    } else {
                        tracing::info!("Approval email sent to {}", email);
                    }
                }
            } else {
                tracing::debug!("Email service not configured, skipping approval email");
            }

            (StatusCode::OK, Json(updated_company)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn reject_company<T>(
    State((_, company_use_case, _, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>,
    Path(company_id): Path<uuid::Uuid>,
) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    
    match company_use_case.get_company_by_id(company_id).await {
        Ok(Some(company)) => {
            match company_use_case.delete_company(company.user_id).await {
                Ok(_) => (StatusCode::OK, "Company rejected successfully").into_response(),
                Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
            }
        }
        Ok(None) => (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[derive(serde::Deserialize)]
struct BanRequest {
    reason: Option<String>,
}

async fn ban_user<T>(
    State((_, _, user_use_case, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>,
    Path(user_id): Path<uuid::Uuid>,
    Json(payload): Json<BanRequest>,
) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    // Check if user exists first
    match user_use_case.get_user_by_id(user_id).await {
        Ok(_) => {
            // User exists, proceed with ban
            match user_use_case.ban_user(user_id).await {
                Ok(user) => {
                    if let Some(reason) = payload.reason {
                        tracing::info!("User {} banned. Reason: {}", user_id, reason);
                    } else {
                        tracing::info!("User {} banned", user_id);
                    }
                    (StatusCode::OK, Json(user)).into_response()
                }
                Err(e) => {
                    tracing::error!("Failed to ban user {}: {}", user_id, e);
                    (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
                }
            }
        }
        Err(e) => {
            tracing::warn!("User {} not found: {}", user_id, e);
            let error_response = serde_json::json!({
                "error": "User not found",
                "message": format!("User with ID {} does not exist", user_id),
                "user_id": user_id.to_string()
            });
            (StatusCode::NOT_FOUND, Json(error_response)).into_response()
        }
    }
}

async fn unban_user<T>(
    State((_, _, user_use_case, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>,
    Path(user_id): Path<uuid::Uuid>,
) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    // Check if user exists first
    match user_use_case.get_user_by_id(user_id).await {
        Ok(_) => {
            // User exists, proceed with unban
            match user_use_case.unban_user(user_id).await {
                Ok(user) => {
                    tracing::info!("User {} unbanned", user_id);
                    (StatusCode::OK, Json(user)).into_response()
                }
                Err(e) => {
                    tracing::error!("Failed to unban user {}: {}", user_id, e);
                    (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
                }
            }
        }
        Err(e) => {
            tracing::warn!("User {} not found: {}", user_id, e);
            let error_response = serde_json::json!({
                "error": "User not found",
                "message": format!("User with ID {} does not exist", user_id),
                "user_id": user_id.to_string()
            });
            (StatusCode::NOT_FOUND, Json(error_response)).into_response()
        }
    }
}

async fn ban_company<T>(
    State((_, company_use_case, _, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>,
    Path(company_id): Path<uuid::Uuid>,
    Json(payload): Json<BanRequest>,
) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    // Get company first
    let company = match company_use_case.get_company_by_id(company_id).await {
        Ok(Some(company)) => company,
        Ok(None) => return (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    // Update company status to "banned"
    let mut update_data = UpdateCompany::default();
    update_data.status = Some("banned".to_string());
    update_data.updated_at = Some(chrono::Utc::now());

    match company_use_case.update_company(company.user_id, update_data).await {
        Ok(updated_company) => {
            if let Some(reason) = payload.reason {
                tracing::info!("Company {} banned. Reason: {}", company_id, reason);
            } else {
                tracing::info!("Company {} banned", company_id);
            }
            (StatusCode::OK, Json(updated_company)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn unban_company<T>(
    State((_, company_use_case, _, _, _)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>,
    Path(company_id): Path<uuid::Uuid>,
) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    // Get company first
    let company = match company_use_case.get_company_by_id(company_id).await {
        Ok(Some(company)) => company,
        Ok(None) => return (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    };

    // Update company status to "approved" (or "active" if preferred)
    let mut update_data = UpdateCompany::default();
    update_data.status = Some("approved".to_string());
    update_data.updated_at = Some(chrono::Utc::now());

    match company_use_case.update_company(company.user_id, update_data).await {
        Ok(updated_company) => {
            tracing::info!("Company {} unbanned", company_id);
            (StatusCode::OK, Json(updated_company)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_user_skills<T>(
    State((_, _, _, _, user_skill_use_case)): State<(Arc<AdminUseCase<T>>, Arc<CompanyUseCase<CompanyPostgres>>, Arc<UserUseCase<UserPostgres>>, Arc<EmailService>, Arc<UserSkillUseCase<UserSkillPostgres>>)>,
    Path(user_id): Path<uuid::Uuid>,
) -> impl IntoResponse
where
    T: AdminRepository + Send + Sync,
{
    match user_skill_use_case.get_user_skills(user_id).await {
        Ok(Some(skills)) => (StatusCode::OK, Json(skills)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(serde_json::json!({
            "error": "Skills not found",
            "message": "User has not set any skills yet"
        }))).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
