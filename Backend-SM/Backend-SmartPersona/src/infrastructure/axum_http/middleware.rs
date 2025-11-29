use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};

use crate::{
    config::config_loader::{get_admin_secret, get_user_secret},
    infrastructure::jwt_authentication::{self, jwt_model::{Claims, Roles}},
};
use uuid::Uuid;

use tracing::{info, error};

pub async fn user_authorization(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    info!("Checking authorization for request: {:?}", req.uri());
    for (name, value) in req.headers() {
        if name == header::AUTHORIZATION {
             info!("Header {}: {:?}", name, value);
        }
    }

    // Check Authorization header first
    if let Some(auth_header) = req.headers().get(header::AUTHORIZATION) {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = auth_str[7..].trim();
                
                if let Ok(user_secret) = get_user_secret() {
                    match jwt_authentication::verify_token(user_secret.user_secret, token.to_string()) {
                        Ok(claims) => {
                            if claims.role == Roles::UserAndCompany || claims.role == Roles::Admin {
                                if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                                    req.extensions_mut().insert(user_id);
                                    req.extensions_mut().insert::<Claims>(claims);
                                    return Ok(next.run(req).await);
                                } else {
                                    error!("Failed to parse user_id from claims.sub: {}", claims.sub);
                                }
                            } else {
                                info!("Role mismatch for User secret: {:?}", claims.role);
                            }
                        },
                        Err(e) => info!("Failed to verify with User secret: {}", e),
                    }
                }
                
                if let Ok(admin_secret) = get_admin_secret() {
                    match jwt_authentication::verify_token(admin_secret.admin_secret, token.to_string()) {
                        Ok(claims) => {
                            if claims.role == Roles::Admin {
                                if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                                    req.extensions_mut().insert(user_id);
                                    req.extensions_mut().insert::<Claims>(claims);
                                    return Ok(next.run(req).await);
                                } else {
                                    error!("Failed to parse user_id from claims.sub: {}", claims.sub);
                                }
                            } else {
                                info!("Role mismatch for Admin secret: {:?}", claims.role);
                            }
                        },
                        Err(e) => info!("Failed to verify with Admin secret: {}", e),
                    }
                }
            }
        }
    }

    if let Some(cookie_header) = req.headers().get(header::COOKIE) {
        if let Ok(cookie_str) = cookie_header.to_str() {
            // Try regular user token first
            if let Some(token) = get_cookie_value(cookie_str, "act") {
                if let Ok(user_secret) = get_user_secret() {
                    if let Ok(claims) = jwt_authentication::verify_token(user_secret.user_secret, token.clone()) {
                        if claims.role == Roles::UserAndCompany || claims.role == Roles::Admin {
                            if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                                req.extensions_mut().insert(user_id);
                            }
                            req.extensions_mut().insert::<Claims>(claims);
                            return Ok(next.run(req).await);
                        }
                    }
                }
                if let Ok(admin_secret) = get_admin_secret() {
                    if let Ok(claims) = jwt_authentication::verify_token(admin_secret.admin_secret, token) {
                        if claims.role == Roles::Admin {
                            if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                                req.extensions_mut().insert(user_id);
                            }
                            req.extensions_mut().insert::<Claims>(claims);
                            return Ok(next.run(req).await);
                        }
                    }
                }
            }
            
            // Also try admin-specific cookie
            if let Some(token) = get_cookie_value(cookie_str, "act_admin") {
                if let Ok(admin_secret) = get_admin_secret() {
                    if let Ok(claims) = jwt_authentication::verify_token(admin_secret.admin_secret, token) {
                        if claims.role == Roles::Admin {
                            if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                                req.extensions_mut().insert(user_id);
                            }
                            req.extensions_mut().insert::<Claims>(claims);
                            return Ok(next.run(req).await);
                        }
                    }
                }
            }
        }
    }

    Err(StatusCode::UNAUTHORIZED)
}

pub async fn admin_authorization(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Some(cookie_header) = req.headers().get(header::COOKIE) {
        if let Ok(cookie_str) = cookie_header.to_str() {
            // Use admin-specific cookie name
            if let Some(token) = get_cookie_value(cookie_str, "act_admin") {
                if let Ok(admin_secret) = get_admin_secret() {
                    if let Ok(claims) = jwt_authentication::verify_token(admin_secret.admin_secret, token) {
                        if claims.role == Roles::Admin {
                            if let Ok(admin_id) = Uuid::parse_str(&claims.sub) {
                                req.extensions_mut().insert(admin_id);
                            }
                            req.extensions_mut().insert::<Claims>(claims);
                            return Ok(next.run(req).await);
                        }
                    }
                }
            }
        }
    }

    Err(StatusCode::UNAUTHORIZED)
}

fn get_cookie_value(cookie_header: &str, key: &str) -> Option<String> {
    cookie_header.split("; ").find_map(|cookie| {
        let mut parts = cookie.splitn(2, '=');
        let name = parts.next()?.trim();
        let value = parts.next()?.trim();
        if name == key {
            Some(value.to_string())
        } else {
            None
        }
    })
}