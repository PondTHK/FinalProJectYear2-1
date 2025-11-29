use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration as StdDuration, Instant};

use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::IntoResponse,
    routing::post,
};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use cookie::time::{Duration, OffsetDateTime};
use tokio::sync::RwLock;

use crate::{
    config::{config_loader::get_stage, stage::Stage},
    domain::repo::user::UserRepository,
    infrastructure::{
        jwt_authentication::authentication_model::LoginModel,
        postgres::{postgres_connection::DbPool, repositories::user::UserPostgres},
    },
};

use crate::domain::usecase::authentication::AuthenticationUseCase;

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let user_repository = UserPostgres::new(Arc::clone(&db_pool));
    let authentication_use_case = AuthenticationUseCase::new(Arc::new(user_repository));
    let rate_limit_state = Arc::new(RwLock::new(HashMap::<String, Vec<Instant>>::new()));

    Router::new()
        .route("/login", post(user_login::<UserPostgres>))
        .route("/refresh-token", post(user_refresh_token::<UserPostgres>))
        .route("/logout", post(user_logout))
        .route("/admin/login", post(admin_login::<UserPostgres>))
        .route(
            "/admin/refresh-token",
            post(admin_refresh_token::<UserPostgres>),
        )
        .route("/admin/logout", post(admin_logout))
        .with_state((Arc::new(authentication_use_case), rate_limit_state))
}

// Helper function to extract domain from Origin header
fn get_cookie_domain(headers: &HeaderMap) -> Option<String> {
    if let Some(origin) = headers.get(header::ORIGIN) {
        if let Ok(origin_str) = origin.to_str() {
            // Extract domain from origin (e.g., "http://user.smartpersona.local" -> "user.smartpersona.local")
            if let Some(domain) = origin_str.strip_prefix("http://") {
                return Some(domain.to_string());
            } else if let Some(domain) = origin_str.strip_prefix("https://") {
                return Some(domain.to_string());
            }
        }
    }
    // Fallback: check Referer header
    if let Some(referer) = headers.get(header::REFERER) {
        if let Ok(referer_str) = referer.to_str() {
            if let Some(url) = referer_str.strip_prefix("http://") {
                if let Some(domain) = url.split('/').next() {
                    return Some(domain.to_string());
                }
            } else if let Some(url) = referer_str.strip_prefix("https://") {
                if let Some(domain) = url.split('/').next() {
                    return Some(domain.to_string());
                }
            }
        }
    }
    None
}

fn build_removal_cookie(name: &str, domain: Option<String>) -> Cookie<'static> {
    let mut cookie = Cookie::build((name.to_string(), ""))
        .path("/")
        .http_only(true)
        .max_age(Duration::seconds(-1))
        .expires(OffsetDateTime::UNIX_EPOCH);

    if let Some(domain) = domain {
        if domain.contains("smartpersona.local") {
            cookie = cookie.domain(domain);
        }
    }

    cookie.build()
}

pub async fn user_login<T>(
    State((authentication_use_case, rate_limit_state)): State<(
        Arc<AuthenticationUseCase<T>>,
        Arc<RwLock<HashMap<String, Vec<Instant>>>>,
    )>,
    headers: HeaderMap,
    Json(login_model): Json<LoginModel>,
) -> impl IntoResponse
where
    T: UserRepository + Send + Sync,
{
    {
        let mut rate_map = rate_limit_state.write().await;
        let now = Instant::now();
        let ip = "127.0.0.1".to_string();

        let requests = rate_map.entry(ip.clone()).or_insert_with(Vec::new);
        requests.retain(|&timestamp| now.duration_since(timestamp) < StdDuration::from_secs(60));

        if requests.len() >= 5 {
            return (
                StatusCode::TOO_MANY_REQUESTS,
                "Too many requests. Try again later.",
            )
                .into_response();
        }

        requests.push(now);
    }
    match authentication_use_case.user_login(login_model).await {
        Ok(passport) => {
            let cookie_domain = get_cookie_domain(&headers);
            
            let mut act_cookie = Cookie::build(("act", passport.access_token.clone()))
                .path("/")
                .same_site(cookie::SameSite::Lax)
                .http_only(true)
                .max_age(Duration::days(14));

            let mut rft_cookie = Cookie::build(("rft", passport.refresh_token.clone()))
                .path("/")
                .same_site(cookie::SameSite::Lax)
                .http_only(true)
                .max_age(Duration::days(14));

            // Set domain if we can determine it from Origin/Referer
            if let Some(domain) = cookie_domain {
                // Only set domain for smartpersona.local subdomains
                if domain.contains("smartpersona.local") {
                    act_cookie = act_cookie.domain(domain.clone());
                    rft_cookie = rft_cookie.domain(domain);
                }
            }

            if get_stage() == Stage::Production {
                rft_cookie = rft_cookie.secure(true);
                act_cookie = act_cookie.secure(true);
            }

            let mut headers = HeaderMap::new();
            headers.append(
                header::SET_COOKIE,
                HeaderValue::from_str(&act_cookie.to_string()).unwrap(),
            );
            headers.append(
                header::SET_COOKIE,
                HeaderValue::from_str(&rft_cookie.to_string()).unwrap(),
            );

            (StatusCode::OK, headers, "Login successfully").into_response()
        }
        Err(e) => (StatusCode::UNAUTHORIZED, e.to_string()).into_response(),
    }
}

pub async fn user_refresh_token<T>(
    State((authentication_use_case, _rate_limit_state)): State<(
        Arc<AuthenticationUseCase<T>>,
        Arc<RwLock<HashMap<String, Vec<Instant>>>>,
    )>,
    headers: HeaderMap,
    jar: CookieJar,
) -> impl IntoResponse
where
    T: UserRepository + Send + Sync,
{
    if let Some(rft) = jar.get("rft") {
        let refresh_token = rft.value().to_string();

        let response = match authentication_use_case
            .user_refresh_token(refresh_token)
            .await
        {
            Ok(passport) => {
                let cookie_domain = get_cookie_domain(&headers);
                
                let mut act_cookie = Cookie::build(("act", passport.access_token.clone()))
                    .path("/")
                    .same_site(cookie::SameSite::Lax)
                    .http_only(true)
                    .max_age(Duration::days(14));

                let mut rft_cookie = Cookie::build(("rft", passport.refresh_token.clone()))
                    .path("/")
                    .same_site(cookie::SameSite::Lax)
                    .http_only(true)
                    .max_age(Duration::days(14));

                // Set domain if we can determine it from Origin/Referer
                if let Some(domain) = cookie_domain {
                    // Only set domain for smartpersona.local subdomains
                    if domain.contains("smartpersona.local") {
                        act_cookie = act_cookie.domain(domain.clone());
                        rft_cookie = rft_cookie.domain(domain);
                    }
                }

                if get_stage() == Stage::Production {
                    rft_cookie = rft_cookie.secure(true);
                    act_cookie = act_cookie.secure(true);
                }

                let mut headers = HeaderMap::new();
                headers.append(
                    header::SET_COOKIE,
                    HeaderValue::from_str(&act_cookie.to_string()).unwrap(),
                );
                headers.append(
                    header::SET_COOKIE,
                    HeaderValue::from_str(&rft_cookie.to_string()).unwrap(),
                );

                (StatusCode::OK, headers, "Refresh token successfully").into_response()
            }
            Err(e) => (StatusCode::UNAUTHORIZED, e.to_string()).into_response(),
        };

        return response;
    }

    (StatusCode::BAD_REQUEST, "Refresh token not found").into_response()
}

pub async fn user_logout(headers: HeaderMap) -> impl IntoResponse {
    let cookie_domain = get_cookie_domain(&headers);
    let act_cookie = build_removal_cookie("act", cookie_domain.clone());
    let rft_cookie = build_removal_cookie("rft", cookie_domain);

    let mut header_map = HeaderMap::new();
    header_map.append(
        header::SET_COOKIE,
        HeaderValue::from_str(&act_cookie.to_string()).unwrap(),
    );
    header_map.append(
        header::SET_COOKIE,
        HeaderValue::from_str(&rft_cookie.to_string()).unwrap(),
    );

    (StatusCode::OK, header_map, "Logged out").into_response()
}

pub async fn admin_login<T>(
    State((authentication_use_case, rate_limit_state)): State<(
        Arc<AuthenticationUseCase<T>>,
        Arc<RwLock<HashMap<String, Vec<Instant>>>>,
    )>,
    headers: HeaderMap,
    Json(login_model): Json<LoginModel>,
) -> impl IntoResponse
where
    T: UserRepository + Send + Sync,
{
    // Simple rate limiting
    {
        let mut rate_map = rate_limit_state.write().await;
        let now = Instant::now();
        let ip = "127.0.0.1".to_string(); // Simple fallback

        let requests = rate_map.entry(ip.clone()).or_insert_with(Vec::new);
        requests.retain(|&timestamp| now.duration_since(timestamp) < StdDuration::from_secs(60));

        if requests.len() >= 5 {
            return (
                StatusCode::TOO_MANY_REQUESTS,
                "Too many requests. Try again later.",
            )
                .into_response();
        }

        requests.push(now);
    }
    match authentication_use_case.admin_login(login_model).await {
        Ok(passport) => {
            let cookie_domain = get_cookie_domain(&headers);
            
            // Use separate cookie names for admin to avoid conflicts with user cookies
            let mut act_cookie = Cookie::build(("act_admin", passport.access_token.clone()))
                .path("/")
                .same_site(cookie::SameSite::Lax)
                .http_only(true)
                .max_age(Duration::days(14));

            let mut rft_cookie = Cookie::build(("rft_admin", passport.refresh_token.clone()))
                .path("/")
                .same_site(cookie::SameSite::Lax)
                .http_only(true)
                .max_age(Duration::days(14));

            // Set domain if we can determine it from Origin/Referer
            if let Some(domain) = cookie_domain {
                // Only set domain for smartpersona.local subdomains
                if domain.contains("smartpersona.local") {
                    act_cookie = act_cookie.domain(domain.clone());
                    rft_cookie = rft_cookie.domain(domain);
                }
            }

            if get_stage() == Stage::Production {
                rft_cookie = rft_cookie.secure(true);
                act_cookie = act_cookie.secure(true);
            }

            let mut headers = HeaderMap::new();
            headers.append(
                header::SET_COOKIE,
                HeaderValue::from_str(&act_cookie.to_string()).unwrap(),
            );
            headers.append(
                header::SET_COOKIE,
                HeaderValue::from_str(&rft_cookie.to_string()).unwrap(),
            );

            (StatusCode::OK, headers, "Admin login successfully").into_response()
        }
        Err(e) => (StatusCode::UNAUTHORIZED, e.to_string()).into_response(),
    }
}

pub async fn admin_refresh_token<T>(
    State((authentication_use_case, _rate_limit_state)): State<(
        Arc<AuthenticationUseCase<T>>,
        Arc<RwLock<HashMap<String, Vec<Instant>>>>,
    )>,
    headers: HeaderMap,
    jar: CookieJar,
) -> impl IntoResponse
where
    T: UserRepository + Send + Sync,
{
    // Use admin-specific cookie name
    if let Some(rft) = jar.get("rft_admin") {
        let refresh_token = rft.value().to_string();

        let response = match authentication_use_case
            .admin_refresh_token(refresh_token)
            .await
        {
            Ok(passport) => {
                let cookie_domain = get_cookie_domain(&headers);
                
                // Use separate cookie names for admin
                let mut act_cookie = Cookie::build(("act_admin", passport.access_token.clone()))
                    .path("/")
                    .same_site(cookie::SameSite::Lax)
                    .http_only(true)
                    .max_age(Duration::days(14));

                let mut rft_cookie = Cookie::build(("rft_admin", passport.refresh_token.clone()))
                    .path("/")
                    .same_site(cookie::SameSite::Lax)
                    .http_only(true)
                    .max_age(Duration::days(14));

                // Set domain if we can determine it from Origin/Referer
                if let Some(domain) = cookie_domain {
                    // Only set domain for smartpersona.local subdomains
                    if domain.contains("smartpersona.local") {
                        act_cookie = act_cookie.domain(domain.clone());
                        rft_cookie = rft_cookie.domain(domain);
                    }
                }

                if get_stage() == Stage::Production {
                    rft_cookie = rft_cookie.secure(true);
                    act_cookie = act_cookie.secure(true);
                }

                let mut headers = HeaderMap::new();
                headers.append(
                    header::SET_COOKIE,
                    HeaderValue::from_str(&act_cookie.to_string()).unwrap(),
                );
                headers.append(
                    header::SET_COOKIE,
                    HeaderValue::from_str(&rft_cookie.to_string()).unwrap(),
                );

                (StatusCode::OK, headers, "Admin refresh token successfully").into_response()
            }
            Err(e) => (StatusCode::UNAUTHORIZED, e.to_string()).into_response(),
        };

        return response;
    }

    (StatusCode::BAD_REQUEST, "Refresh token not found").into_response()
}

pub async fn admin_logout(headers: HeaderMap) -> impl IntoResponse {
    let cookie_domain = get_cookie_domain(&headers);
    let act_cookie = build_removal_cookie("act_admin", cookie_domain.clone());
    let rft_cookie = build_removal_cookie("rft_admin", cookie_domain);

    let mut header_map = HeaderMap::new();
    header_map.append(
        header::SET_COOKIE,
        HeaderValue::from_str(&act_cookie.to_string()).unwrap(),
    );
    header_map.append(
        header::SET_COOKIE,
        HeaderValue::from_str(&rft_cookie.to_string()).unwrap(),
    );

    (StatusCode::OK, header_map, "Admin logged out").into_response()
}
