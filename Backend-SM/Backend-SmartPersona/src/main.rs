use std::sync::Arc;

use rust_api::{config::{self, config_loader}, infrastructure::{axum_http::http_serve::start, postgres::postgres_connection}};
use tracing::info;

#[tokio::main]
async  fn main() {
   tracing_subscriber::fmt().with_max_level(tracing::Level::DEBUG).init();
   let dot_env = match config_loader::load(){
       Ok(config) => config,
       Err(e) => {
           tracing::error!("Failed to load config: {}", e);
           std::process::exit(1);
       }
       
   };
   info!("env loaded");

   let postgres_pool = match postgres_connection::create_pool(&dot_env.database.url){
 Ok(pool) => pool,
    Err(e) => {
        tracing::error!("Failed to establish postgres connection: {}", e);
        std::process::exit(1);
        }
    };
    info!("postgres pool established");
    start(Arc::new(dot_env), Arc::new(postgres_pool))
    .await
    .expect("Failed to start server");
}

