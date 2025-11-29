use super::{
    config_model::{
        Application, Config, Cors, Database, Jwt, JwtAdminSecret, JwtSecret, Server, Services,
        Supabase,
    },
    stage::Stage,
};
use anyhow::Result;

pub fn load() -> Result<Config> {
    // Try to load .env file from current directory first, then parent directories
    let env_path = std::env::current_dir()
        .ok()
        .and_then(|dir| {
            // Try current directory
            let env_file = dir.join(".env");
            if env_file.exists() {
                return Some(env_file);
            }
            // Try parent directory (in case running from src/)
            let parent_env = dir.parent()?.join(".env");
            if parent_env.exists() {
                return Some(parent_env);
            }
            None
        });

    if let Some(env_file) = env_path {
        match dotenvy::from_path(&env_file) {
            Ok(_) => {
                tracing::info!("Loaded .env file from: {:?}", env_file);
            }
            Err(e) => {
                tracing::warn!("Failed to load .env file from {:?}: {}. Using system environment variables.", env_file, e);
            }
        }
    } else {
        // Fallback to default dotenv behavior
        match dotenvy::dotenv() {
            Ok(path) => {
                tracing::info!("Loaded .env file from: {:?}", path);
            }
            Err(e) => {
                tracing::warn!("Failed to load .env file: {}. Using system environment variables.", e);
            }
        }
    }

    let app = Application {
        env: std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string()),
        name: std::env::var("APP_NAME").expect("APP_NAME not set"),
        frontend_url: std::env::var("FRONTEND_URL").expect("FRONTEND_URL not set"),
        backend_url: std::env::var("BACKEND_URL").expect("BACKEND_URL not set"),
    };

    let server = Server {
        port: std::env::var("SERVER_PORT")
            .expect("port not set")
            .parse()?,
        body_limit: std::env::var("SERVER_BODY_LIMIT")
            .expect("body_limit not set")
            .parse()?,
        timeout: std::env::var("SERVER_TIMEOUT")
            .expect("timeout not set")
            .parse()?,
    };

    let database = Database {
        url: std::env::var("DATABASE_URL").expect("database_url not set"),
    };

    let jwt = Jwt {
        user: JwtSecret {
            user_secret: std::env::var("JWT_USER_SECRET").expect("JWT_USER_SECRET not set"),
            user_refresh_secret: std::env::var("JWT_USER_REFRESH_SECRET")
                .expect("JWT_USER_REFRESH_SECRET not set"),
        },
        admin: JwtAdminSecret {
            admin_secret: std::env::var("JWT_ADMIN_SECRET").expect("JWT_ADMIN_SECRET not set"),
            admin_refresh_secret: std::env::var("JWT_ADMIN_REFRESH_SECRET")
                .expect("JWT_ADMIN_REFRESH_SECRET not set"),
        },
        access_token_expiration: std::env::var("JWT_ACCESS_TOKEN_EXPIRATION")
            .expect("JWT_ACCESS_TOKEN_EXPIRATION not set"),
        refresh_token_expiration: std::env::var("JWT_REFRESH_TOKEN_EXPIRATION")
            .expect("JWT_REFRESH_TOKEN_EXPIRATION not set"),
    };

    let services = Services {
        ai_service_url: std::env::var("AI_SERVICE_URL").expect("AI_SERVICE_URL not set"),
    };

    let supabase = Supabase {
        url: std::env::var("SUPABASE_URL").expect("SUPABASE_URL not set"),
        anon_key: std::env::var("SUPABASE_ANON_KEY").expect("SUPABASE_ANON_KEY not set"),
        service_role_key: std::env::var("SUPABASE_SERVICE_ROLE_KEY")
            .expect("SUPABASE_SERVICE_ROLE_KEY not set"),
        storage_bucket: std::env::var("SUPABASE_STORAGE_BUCKET")
            .unwrap_or_else(|_| "user-uploads".to_string()),
    };

    let cors = Cors {
        allowed_origins: std::env::var("CORS_ALLOWED_ORIGINS").unwrap(),
    };

    Ok(Config {
        app,
        server,
        database,
        jwt,
        services,
        cors,
        supabase,
    })
}

pub fn get_stage() -> Stage {
    dotenvy::dotenv().ok();
    let stage_str = std::env::var("STAGE").unwrap_or("".to_string());
    Stage::try_from(&stage_str).unwrap_or_default()
}
pub fn get_user_secret() -> Result<JwtSecret> {
    dotenvy::dotenv().ok();
    Ok(JwtSecret {
        user_secret: std::env::var("JWT_USER_SECRET").expect("JWT_USER_SECRET not set"),
        user_refresh_secret: std::env::var("JWT_USER_REFRESH_SECRET")
            .expect("JWT_USER_REFRESH_SECRET not set"),
    })
}
pub fn get_admin_secret() -> Result<JwtAdminSecret> {
    dotenvy::dotenv().ok();
    Ok(JwtAdminSecret {
        admin_secret: std::env::var("JWT_ADMIN_SECRET").expect("JWT_ADMIN_SECRET not set"),
        admin_refresh_secret: std::env::var("JWT_ADMIN_REFRESH_SECRET")
            .expect("JWT_ADMIN_REFRESH_SECRET not set"),
    })
}
