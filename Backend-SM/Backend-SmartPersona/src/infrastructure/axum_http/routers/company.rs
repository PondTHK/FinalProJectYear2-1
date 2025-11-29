use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, patch, post, put},
};
use uuid::Uuid;

use crate::{
    domain::{
        entities::company::CompanyRequest, repo::company::CompanyRepository,
        usecase::company::CompanyUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        email::EmailService,
        postgres::{postgres_connection::DbPool, repositories::company::CompanyPostgres},
    },
};

/// Custom extractor for user_id from JWT claims
pub struct AuthenticatedUserId(pub Uuid);

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for AuthenticatedUserId
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<Uuid>()
            .copied()
            .map(AuthenticatedUserId)
            .ok_or(StatusCode::UNAUTHORIZED)
    }
}

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let company_repository = CompanyPostgres::new(db_pool);
    let company_use_case =
        Arc::new(CompanyUseCase::new(Arc::new(company_repository)));

    // Initialize email service (optional)
    let email_service = match EmailService::new() {
        Ok(service) => {
            tracing::info!("Email service configured for company routes");
            Arc::new(service)
        }
        Err(e) => {
            tracing::warn!("Email service not configured for company routes: {}", e);
            Arc::new(EmailService::dummy())
        }
    };

    Router::new()
        .route("/company", get(get_company))
        .route("/company", post(create_company))
        .route("/company", put(upsert_company))
        .route("/company/:user_id", get(get_company_by_user_id))
        .route("/company", patch(update_company))
        .route("/company", delete(delete_company))
        .layer(middleware::from_fn(user_authorization))
        .with_state((company_use_case, email_service))
}

/// Public company routes (no authentication required)
pub fn public_routes(db_pool: Arc<DbPool>) -> Router {
    let company_repository = CompanyPostgres::new(db_pool);
    let company_use_case =
        Arc::new(CompanyUseCase::new(Arc::new(company_repository)));

    Router::new()
        .route("/companies/:company_id", get(get_company_by_id_public))
        .with_state(company_use_case)
}

/// Get current user's company
/// GET /api/user/company
pub async fn get_company<T>(
    State((company_use_case, _)): State<(Arc<CompanyUseCase<T>>, Arc<EmailService>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: CompanyRepository + Send + Sync + 'static,
{
    match company_use_case.get_company_by_user_id(user_id).await {
        Ok(Some(company)) => (StatusCode::OK, Json(company)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create a new company
/// POST /api/user/company
pub async fn create_company<T>(
    State((company_use_case, email_service)): State<(Arc<CompanyUseCase<T>>, Arc<EmailService>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(company_request): Json<CompanyRequest>,
) -> impl IntoResponse
where
    T: CompanyRepository + Send + Sync + 'static,
{
    // Convert request to NewCompany with user_id from JWT token
    let new_company = company_request.into_new_company(user_id);

    // Check if company already exists
    match company_use_case.get_company_by_user_id(user_id).await {
        Ok(Some(_)) => return (StatusCode::CONFLICT, "Company already exists").into_response(),
        Ok(None) => {} // Continue with creation
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    match company_use_case.create_company(new_company).await {
        Ok(company) => {
            // Send registration email
            if email_service.is_configured() {
                if let Some(email) = &company.email {
                    if let Err(e) = email_service
                        .send_company_registration_email(email, &company.company_name)
                        .await
                    {
                        tracing::error!("Failed to send registration email: {}", e);
                        // Don't fail the request if email fails
                    } else {
                        tracing::info!("Registration email sent to {}", email);
                    }
                }
            }

            (StatusCode::CREATED, Json(company)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Upsert company (create if not exists, update if exists)
/// PUT /api/user/company
///
/// ⭐ แนะนำให้ Frontend ใช้ endpoint นี้ - สะดวกที่สุด!
pub async fn upsert_company<T>(
    State((company_use_case, email_service)): State<(Arc<CompanyUseCase<T>>, Arc<EmailService>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(company_request): Json<CompanyRequest>,
) -> impl IntoResponse
where
    T: CompanyRepository + Send + Sync + 'static,
{
    // Check if this is a new company (doesn't exist yet)
    let is_new_company = company_use_case.get_company_by_user_id(user_id).await
        .map(|opt| opt.is_none())
        .unwrap_or(true);

    // Convert request to NewCompany with user_id from JWT token
    let company_data = company_request.into_new_company(user_id);

    match company_use_case
        .upsert_company(user_id, company_data)
        .await
    {
        Ok(company) => {
            // Send registration email if this is a new company
            if is_new_company && email_service.is_configured() {
                if let Some(email) = &company.email {
                    if let Err(e) = email_service
                        .send_company_registration_email(email, &company.company_name)
                        .await
                    {
                        tracing::error!("Failed to send registration email: {}", e);
                        // Don't fail the request if email fails
                    } else {
                        tracing::info!("Registration email sent to {}", email);
                    }
                }
            }

            (StatusCode::OK, Json(company)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get company by user_id
/// GET /api/user/company/:user_id
pub async fn get_company_by_user_id<T>(
    State((company_use_case, _)): State<(Arc<CompanyUseCase<T>>, Arc<EmailService>)>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: CompanyRepository + Send + Sync + 'static,
{
    match company_use_case.get_company_by_user_id(user_id).await {
        Ok(Some(company)) => (StatusCode::OK, Json(company)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Update current user's company
/// PATCH /api/user/company
pub async fn update_company<T>(
    State((company_use_case, _)): State<(Arc<CompanyUseCase<T>>, Arc<EmailService>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(company_request): Json<CompanyRequest>,
) -> impl IntoResponse
where
    T: CompanyRepository + Send + Sync + 'static,
{
    // Check if company exists before updating
    match company_use_case.get_company_by_user_id(user_id).await {
        Ok(None) => return (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Ok(Some(_)) => {} // Continue with update
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }

    // Convert request to UpdateCompany
    let update_data = company_request.into_update_company();

    match company_use_case
        .update_company(user_id, update_data)
        .await
    {
        Ok(company) => (StatusCode::OK, Json(company)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Delete current user's company
/// DELETE /api/user/company
pub async fn delete_company<T>(
    State((company_use_case, _)): State<(Arc<CompanyUseCase<T>>, Arc<EmailService>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: CompanyRepository + Send + Sync + 'static,
{
    match company_use_case.delete_company(user_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get company by company_id (Public endpoint - no authentication required)
/// GET /api/companies/:company_id
pub async fn get_company_by_id_public<T>(
    State(company_use_case): State<Arc<CompanyUseCase<T>>>,
    Path(company_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: CompanyRepository + Send + Sync + 'static,
{
    match company_use_case.get_company_by_id(company_id).await {
        Ok(Some(company)) => (StatusCode::OK, Json(company)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Company not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

