use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    domain::{
        entities::user_portfolio::UserPortfolioRequest,
        repo::user_portfolio::UserPortfolioRepository,
        usecase::user_portfolio::UserPortfolioUseCase,
        usecase::user_privacy_settings::UserPrivacySettingsUseCase,
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        postgres::{
            postgres_connection::DbPool,
            repositories::user_portfolio::UserPortfolioPostgres,
            repositories::user_privacy_settings::UserPrivacySettingsPostgres,
        },
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
    let user_portfolio_repository = UserPortfolioPostgres::new(Arc::clone(&db_pool));
    let user_portfolio_use_case = Arc::new(UserPortfolioUseCase::new(Arc::new(
        user_portfolio_repository,
    )));
    
    let user_privacy_settings_repository = UserPrivacySettingsPostgres::new(Arc::clone(&db_pool));
    let user_privacy_settings_use_case = Arc::new(UserPrivacySettingsUseCase::new(Arc::new(
        user_privacy_settings_repository,
    )));

    Router::new()
        .route("/portfolios", get(get_user_portfolios))
        .route("/portfolios", post(create_user_portfolio))
        .route("/portfolios/user/:user_id", get(get_portfolios_by_user_id))
        .route("/portfolios/:id", get(get_portfolio_by_id))
        .route("/portfolios/:id", put(update_user_portfolio))
        .route("/portfolios/:id", delete(delete_portfolio))
        .route("/portfolios", delete(delete_all_user_portfolios))
        .layer(middleware::from_fn(user_authorization))
        .with_state((user_portfolio_use_case, user_privacy_settings_use_case))
}

/// Get all portfolios for current user
/// GET /api/user/portfolios
pub async fn get_user_portfolios<T, TPrivacy>(
    State((user_portfolio_use_case, _)): State<(Arc<UserPortfolioUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
) -> impl IntoResponse
where
    T: UserPortfolioRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_portfolio_use_case.get_user_portfolios(user_id).await {
        Ok(portfolios) => (StatusCode::OK, Json(portfolios)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get portfolios by user_id (filtered by privacy settings)
/// GET /api/user/portfolios/:user_id
pub async fn get_portfolios_by_user_id<T, TPrivacy>(
    State((user_portfolio_use_case, privacy_settings_use_case)): State<(Arc<UserPortfolioUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserPortfolioRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Get privacy settings
    let privacy_settings = match privacy_settings_use_case.get_settings_by_user_id(user_id).await {
        Ok(Some(settings)) => settings,
        Ok(None) => {
            use crate::infrastructure::axum_http::routers::user_privacy_settings::get_default_privacy_settings;
            get_default_privacy_settings(user_id)
        }
        Err(_) => {
            use crate::infrastructure::axum_http::routers::user_privacy_settings::get_default_privacy_settings;
            get_default_privacy_settings(user_id)
        }
    };

    // Check if portfolios are allowed to be shown
    if !privacy_settings.show_portfolios {
        return (StatusCode::OK, Json::<Vec<crate::domain::entities::user_portfolio::UserPortfolioEntity>>(vec![])).into_response();
    }

    match user_portfolio_use_case.get_user_portfolios(user_id).await {
        Ok(portfolios) => (StatusCode::OK, Json(portfolios)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Get specific portfolio by id
/// GET /api/user/portfolios/:id
pub async fn get_portfolio_by_id<T, TPrivacy>(
    State((user_portfolio_use_case, _)): State<(Arc<UserPortfolioUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserPortfolioRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_portfolio_use_case
        .get_portfolio_by_id(id, user_id)
        .await
    {
        Ok(Some(portfolio)) => (StatusCode::OK, Json(portfolio)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Portfolio not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Create new portfolio
/// POST /api/user/portfolios
pub async fn create_user_portfolio<T, TPrivacy>(
    State((user_portfolio_use_case, _)): State<(Arc<UserPortfolioUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Json(portfolio_request): Json<UserPortfolioRequest>,
) -> impl IntoResponse
where
    T: UserPortfolioRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    // Convert request to NewUserPortfolio with user_id from JWT token
    let new_portfolio = portfolio_request.into_new_portfolio(user_id);

    match user_portfolio_use_case
        .create_portfolio(new_portfolio)
        .await
    {
        Ok(portfolio) => (StatusCode::CREATED, Json(portfolio)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Update portfolio
/// PUT /api/user/portfolios/:id
pub async fn update_user_portfolio<T, TPrivacy>(
    State((user_portfolio_use_case, _)): State<(Arc<UserPortfolioUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(id): Path<Uuid>,
    Json(portfolio_request): Json<UserPortfolioRequest>,
) -> impl IntoResponse
where
    T: UserPortfolioRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    let update_data = portfolio_request.into_update_portfolio();

    match user_portfolio_use_case
        .update_portfolio(id, user_id, update_data)
        .await
    {
        Ok(portfolio) => (StatusCode::OK, Json(portfolio)).into_response(),
        Err(e) => {
            if e.to_string().contains("not found") {
                (StatusCode::NOT_FOUND, e.to_string()).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
        }
    }
}

/// Delete specific portfolio by id
/// DELETE /api/user/portfolios/:id
pub async fn delete_portfolio<T, TPrivacy>(
    State((user_portfolio_use_case, _)): State<(Arc<UserPortfolioUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Path(id): Path<Uuid>,
) -> impl IntoResponse
where
    T: UserPortfolioRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    match user_portfolio_use_case.delete_portfolio(id, user_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => {
            if e.to_string().contains("not found") {
                (StatusCode::NOT_FOUND, e.to_string()).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
        }
    }
}

/// Delete all portfolios for current user
/// DELETE /api/user/portfolios
/// Use with query parameter ?confirm=true to prevent accidental deletion
pub async fn delete_all_user_portfolios<T, TPrivacy>(
    State((user_portfolio_use_case, _)): State<(Arc<UserPortfolioUseCase<T>>, Arc<UserPrivacySettingsUseCase<TPrivacy>>)>,
    AuthenticatedUserId(user_id): AuthenticatedUserId,
    Query(params): Query<DeleteAllParams>,
) -> impl IntoResponse
where
    T: UserPortfolioRepository + Send + Sync + 'static,
    TPrivacy: crate::domain::repo::user_privacy_settings::UserPrivacySettingsRepository + Send + Sync + 'static,
{
    if !params.confirm {
        return (
            StatusCode::BAD_REQUEST,
            "Add ?confirm=true to confirm deletion of all portfolios",
        )
            .into_response();
    }

    match user_portfolio_use_case
        .delete_all_user_portfolios(user_id)
        .await
    {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// Query parameters for delete all endpoint
#[derive(Debug, Deserialize)]
pub struct DeleteAllParams {
    pub confirm: bool,
}

