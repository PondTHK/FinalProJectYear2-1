use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub app: Application,
    pub server: Server,
    pub database: Database,
    pub jwt: Jwt,
    pub services: Services,
    pub cors: Cors,
    pub supabase: Supabase,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Application {
    pub env: String,
    pub name: String,
    pub frontend_url: String,
    pub backend_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Server {
    pub port: u16,
    pub body_limit: u64,
    pub timeout: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Database {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Jwt {
    #[serde(flatten)]
    pub user: JwtSecret,
    #[serde(flatten)]
    pub admin: JwtAdminSecret,

    pub access_token_expiration: String,
    pub refresh_token_expiration: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtSecret {
    pub user_secret: String,
    pub user_refresh_secret: String,
}

// แยก struct สำหรับ Admin
#[derive(Debug, Clone, Deserialize)]
pub struct JwtAdminSecret {
    pub admin_secret: String,
    pub admin_refresh_secret: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Services {
    pub ai_service_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Supabase {
    pub url: String,
    pub anon_key: String,
    pub service_role_key: String,
    pub storage_bucket: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Cors {
    pub allowed_origins: String,
}
