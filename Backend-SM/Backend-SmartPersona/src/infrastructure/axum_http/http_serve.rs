use std::{net::SocketAddr, sync::Arc, time::Duration};

use anyhow::Result;
use axum::{
    Router,
    http::{self, Method},
    routing::{get, post},
};
use tokio::net::TcpListener;
use tower_http::{
    cors::{Any, CorsLayer},
    limit::RequestBodyLimitLayer,
    timeout::TimeoutLayer,
    trace::TraceLayer,
};
use tracing::info;

use crate::{
    config::config_model::Config as DotEnvyConfig,
    domain::usecase::ai_analysis::AIAnalysisUseCase,
    infrastructure::{
        ai_service_client::client::AIServiceClient,
        axum_http::{
            default_routers,
            routers::{self, ai_handlers},
        },
        postgres::postgres_connection::DbPool,
        supabase::client::SupabaseClient,
    },
};

pub async fn start(config: Arc<DotEnvyConfig>, db_pool: Arc<DbPool>) -> Result<()> {
    let ai_service_client = Arc::new(AIServiceClient::new("http://localhost:8001".to_string()));
    let ai_analysis_use_case = Arc::new(AIAnalysisUseCase::new(ai_service_client));
    
    // Ads Use Case
    let ads_postgres = crate::infrastructure::postgres::repositories::ads::AdsPostgres::new(Arc::clone(&db_pool));
    let ads_use_case = Arc::new(crate::domain::usecase::ads::AdsUseCase::new(Arc::new(ads_postgres)));

    // Initialize Supabase client
    let supabase_client = Arc::new(SupabaseClient::new(&config.supabase));

    let user_routes = Router::new()
        .merge(routers::user::routes(Arc::clone(&db_pool)))
        .merge(routers::user_profile::routes(Arc::clone(&db_pool)))
        .merge(routers::user_address::routes(Arc::clone(&db_pool)))
        .merge(routers::user_education::routes(Arc::clone(&db_pool)))
        .merge(routers::user_experience::routes(Arc::clone(&db_pool)))
        .merge(routers::user_job_preference::routes(Arc::clone(&db_pool)))
        .merge(routers::user_portfolio::routes(Arc::clone(&db_pool)))
        .merge(routers::user_skill::routes(Arc::clone(&db_pool)))
        .merge(routers::saved_job::routes(Arc::clone(&db_pool)))
        .merge(routers::user_privacy_settings::routes(Arc::clone(&db_pool)))
        .merge(routers::company::routes(Arc::clone(&db_pool)))
        .merge(routers::company_gallery::routes(Arc::clone(&db_pool)))
        .merge(routers::company_post::routes(Arc::clone(&db_pool)))
        .merge(routers::social::routes(Arc::clone(&db_pool)))
        .nest("/ai-score", routers::user_ai_score::routes(Arc::clone(&db_pool)))
        .merge(routers::user_job_match::routes(Arc::clone(&db_pool)))
        .merge(routers::applicant::routes(Arc::clone(&db_pool)))
        .merge({
            let email_service = Arc::new(
                crate::infrastructure::email::service::EmailService::new()
                    .unwrap_or_else(|e| {
                        tracing::warn!("Email service not configured: {}. Using dummy service.", e);
                        crate::infrastructure::email::service::EmailService::dummy()
                    })
            );
            routers::job_application::router(
                Arc::new(crate::infrastructure::postgres::repositories::job_application::JobApplicationPostgres::new(Arc::clone(&db_pool))),
                email_service,
                Arc::clone(&db_pool),
            )
        });

    // Public company routes (no authentication required)
    let public_company_routes = routers::company::public_routes(Arc::clone(&db_pool));
    
    // Public privacy settings routes (no authentication required)
    let public_privacy_routes = routers::user_privacy_settings::public_routes(Arc::clone(&db_pool));
    
    let app = Router::new()
        .fallback(default_routers::not_found)
        .nest("/api", public_company_routes) // Public company routes at /api/companies/:company_id
        .nest("/api/user", public_privacy_routes) // Public privacy settings at /api/user/privacy-settings/:user_id
        .nest("/api/user", user_routes)
        .nest(
            "/authentication",
            routers::authentication::routes(Arc::clone(&db_pool)),
        )
        .nest(
            "/admin",
            routers::admin_handlers::routes(Arc::clone(&db_pool)),
        )
        .nest(
            "/api/storage",
            routers::storage::routes(Arc::clone(&supabase_client)),
        )
        .route("/health-check", get(default_routers::health_check))
        .nest("/api/ai", ai_handlers::routes(ai_analysis_use_case))
        .nest("/api/ads", routers::ads::ads_router(ads_use_case))
        .layer(TimeoutLayer::new(Duration::from_secs(
            config.server.timeout,
        )))
        .layer(RequestBodyLimitLayer::new(
            (config.server.body_limit * 1024 * 1024).try_into()?,
        ))
        .layer(
            CorsLayer::new()
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::PUT,
                    Method::PATCH,
                    Method::DELETE,
                ])
                .allow_origin(
                    config
                        .cors
                        .allowed_origins
                        .split(',')
                        .map(|s| s.trim().parse::<http::HeaderValue>().unwrap())
                        .collect::<Vec<_>>(),
                )
                .allow_credentials(true)
                .allow_headers([
                    axum::http::header::AUTHORIZATION,
                    axum::http::header::CONTENT_TYPE,
                ]),
        )
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));

    let listener = TcpListener::bind(addr).await?;
    info!("Server running on {}", config.server.port);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C signal handler");
    };
    let terminate = std::future::pending::<()>();
    tokio::select! {
        _ = ctrl_c => info!("Ctrl+C received, shutting down"),
        _ = terminate => info!("Terminate signal received, shutting down"),
    };
}
