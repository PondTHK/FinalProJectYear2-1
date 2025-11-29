use std::sync::Arc;

use anyhow::Result;
use chrono::{Duration, Utc};
use validator::Validate;

use crate::{
    config::config_loader::{get_admin_secret, get_user_secret},
    domain::{entities::user, repo::user::UserRepository},
    infrastructure::{
        hashingpassword,
        jwt_authentication::{
            self,
            authentication_model::LoginModel,
            jwt_model::{Claims, Passport, Roles},
        },
    },
};

pub struct AuthenticationUseCase<T>
where
    T: UserRepository + Send + Sync,
    // T2: GuildCommandersRepository + Send + Sync,
{
    User_repository: Arc<T>,
    // guild_commanders_repository: Arc<T2>,
}

impl<T> AuthenticationUseCase<T>
where
    T: UserRepository + Send + Sync,
{
    pub fn new(User_repository: Arc<T>) -> Self {
        Self { User_repository }
    }

    pub async fn user_login(&self, login_model: LoginModel) -> Result<Passport> {
        if let Err(errors) = login_model.validate() {
            return Err(anyhow::anyhow!("Validation error: {:?}", errors));
        }

        let secret_env = get_user_secret()?;

        let user = self
            .User_repository
            .find_by_username(login_model.username.clone())
            .await?;

        let original_password = user.password_hash;
        let login_password = login_model.password;

        if !hashingpassword::verify(login_password, original_password)? {
            return Err(anyhow::anyhow!("Invalid password"));
        }

        let access_token_claims = Claims {
            sub: user.id.to_string(),
            role: Roles::UserAndCompany,
            exp: (Utc::now() + Duration::days(1)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };

        let refresh_token_claims = Claims {
            sub: user.id.to_string(),
            role: Roles::UserAndCompany,
            exp: (Utc::now() + Duration::days(7)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };

        let access_token =
            jwt_authentication::generate_token(secret_env.user_secret, &access_token_claims)?;

        let refresh_token = jwt_authentication::generate_token(
            secret_env.user_refresh_secret,
            &refresh_token_claims,
        )?;

        Ok(Passport {
            refresh_token,
            access_token,
        })
    }

    pub async fn user_refresh_token(&self, refresh_token: String) -> Result<Passport> {
        let secret_env = get_user_secret()?;

        let claims = jwt_authentication::verify_token(
            secret_env.user_refresh_secret.clone(),
            refresh_token.clone(),
        )?;

        let access_token_claims = Claims {
            sub: claims.sub.clone(),
            role: Roles::UserAndCompany,
            exp: (Utc::now() + Duration::days(1)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };

        let refresh_token_claims = Claims {
            sub: claims.sub,
            role: Roles::UserAndCompany,
            exp: claims.exp,
            iat: Utc::now().timestamp() as usize,
        };

        let access_token =
            jwt_authentication::generate_token(secret_env.user_secret, &access_token_claims)?;

        let refresh_token = jwt_authentication::generate_token(
            secret_env.user_refresh_secret,
            &refresh_token_claims,
        )?;

        Ok(Passport {
            refresh_token,
            access_token,
        })
    }

    pub async fn admin_login(&self, login_model: LoginModel) -> Result<Passport> {
        if let Err(errors) = login_model.validate() {
            return Err(anyhow::anyhow!("Validation error: {:?}", errors));
        }

        let secret_env = get_admin_secret()?;

        let user = self
            .User_repository
            .find_by_username(login_model.username.clone())
            .await?;

        // Check if user has the Admin role
        if user.role != user::Role::Admin {
            return Err(anyhow::anyhow!("Unauthorized: Not an admin"));
        }

        if !hashingpassword::verify(login_model.password, user.password_hash)? {
            return Err(anyhow::anyhow!("Invalid password"));
        }

        let access_token_claims = Claims {
            sub: user.id.to_string(),
            role: Roles::Admin,
            exp: (Utc::now() + Duration::days(1)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };

        let refresh_token_claims = Claims {
            sub: user.id.to_string(),
            role: Roles::Admin,
            exp: (Utc::now() + Duration::days(7)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };

        let access_token =
            jwt_authentication::generate_token(secret_env.admin_secret, &access_token_claims)?;

        let refresh_token = jwt_authentication::generate_token(
            secret_env.admin_refresh_secret,
            &refresh_token_claims,
        )?;

        Ok(Passport {
            refresh_token,
            access_token,
        })
    }

    pub async fn admin_refresh_token(&self, refresh_token: String) -> Result<Passport> {
        let secret_env = get_admin_secret()?;

        let claims = jwt_authentication::verify_token(
            secret_env.admin_refresh_secret.clone(),
            refresh_token.clone(),
        )?;

        let access_token_claims = Claims {
            sub: claims.sub.clone(),
            role: Roles::Admin,
            exp: (Utc::now() + Duration::days(1)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };

        let refresh_token_claims = Claims {
            sub: claims.sub,
            role: Roles::UserAndCompany,
            exp: claims.exp,
            iat: Utc::now().timestamp() as usize,
        };

        let access_token =
            jwt_authentication::generate_token(secret_env.admin_secret, &access_token_claims)?;

        let refresh_token = jwt_authentication::generate_token(
            secret_env.admin_refresh_secret,
            &refresh_token_claims,
        )?;

        Ok(Passport {
            refresh_token,
            access_token,
        })
    }
}
