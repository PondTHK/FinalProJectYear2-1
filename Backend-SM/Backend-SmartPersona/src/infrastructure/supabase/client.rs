use std::sync::Arc;

use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::config::config_model::Supabase;

#[derive(Debug, Clone)]
pub struct SupabaseClient {
    pub url: String,
    pub service_role_key: String,
    pub storage_bucket: String,
    pub http_client: Client,
}

impl SupabaseClient {
    pub fn new(config: &Supabase) -> Self {
        Self {
            url: config.url.clone(),
            service_role_key: config.service_role_key.clone(),
            storage_bucket: config.storage_bucket.clone(),
            http_client: Client::new(),
        }
    }

    pub fn get_storage_url(&self) -> String {
        format!("{}/storage/v1", self.url)
    }

    pub fn get_authorization_header(&self) -> String {
        format!("Bearer {}", self.service_role_key)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadResponse {
    pub path: String,
    pub full_path: String,
    pub public_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupabaseError {
    pub message: String,
    pub error: Option<String>,
}

