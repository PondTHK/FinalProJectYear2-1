use std::sync::Arc;

use anyhow::{Context, Result};
use bytes::Bytes;
use mime_guess::from_path;
use uuid::Uuid;

use super::client::SupabaseClient;

pub struct StorageService {
    client: Arc<SupabaseClient>,
}

impl StorageService {
    pub fn new(client: Arc<SupabaseClient>) -> Self {
        Self { client }
    }

    pub async fn upload_file(
        &self,
        file_data: Bytes,
        file_name: String,
        user_id: Uuid,
        folder: Option<String>,
    ) -> Result<String> {
        // Generate unique file name
        let file_extension = std::path::Path::new(&file_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("bin");
        
        let unique_file_name = format!("{}_{}.{}", Uuid::new_v4(), user_id, file_extension);
        
        // Build file path
        let folder_path = folder.unwrap_or_else(|| "uploads".to_string());
        let file_path = format!("{}/{}", folder_path, unique_file_name);

        // Detect MIME type
        let mime_type = from_path(&file_name)
            .first_or_octet_stream()
            .to_string();

        // Upload to Supabase Storage
        let storage_url = format!(
            "{}/object/{}/{}",
            self.client.get_storage_url(),
            self.client.storage_bucket,
            file_path
        );

        let response = self
            .client
            .http_client
            .post(&storage_url)
            .header("Authorization", self.client.get_authorization_header())
            .header("Content-Type", mime_type)
            .header("x-upsert", "true") // Overwrite if exists
            .body(file_data)
            .send()
            .await
            .context("Failed to upload file to Supabase Storage")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Supabase Storage error: {}", error_text);
        }

        // For public buckets, use public URL directly (more reliable and doesn't expire)
        // Supabase public URL format: https://{project_ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
        let public_url = if self.client.url.ends_with('/') {
            format!(
                "{}storage/v1/object/public/{}/{}",
                self.client.url,
                self.client.storage_bucket,
                file_path
            )
        } else {
            format!(
                "{}/storage/v1/object/public/{}/{}",
                self.client.url,
                self.client.storage_bucket,
                file_path
            )
        };

        tracing::info!("Using public URL for public bucket: {}", public_url);
        Ok(public_url)
    }

    /// Get a signed URL for a file (works for both public and private buckets)
    /// expires_in: expiration time in seconds (default: 3600 = 1 hour)
    pub async fn get_signed_url(&self, file_path: &str, expires_in: u64) -> Result<String> {
        use serde_json::json;

        let sign_url = format!(
            "{}/object/sign/{}/{}",
            self.client.get_storage_url(),
            self.client.storage_bucket,
            file_path
        );

        tracing::debug!("Requesting signed URL from: {}", sign_url);

        let response = self
            .client
            .http_client
            .post(&sign_url)
            .header("Authorization", self.client.get_authorization_header())
            .header("Content-Type", "application/json")
            .json(&json!({
                "expiresIn": expires_in
            }))
            .send()
            .await
            .context("Failed to get signed URL from Supabase Storage")?;

        let status = response.status();
        let response_text = response.text().await.unwrap_or_default();

        if !status.is_success() {
            tracing::error!("Supabase Storage signed URL error ({}): {}", status, response_text);
            anyhow::bail!("Supabase Storage signed URL error: {} - {}", status, response_text);
        }

        let signed_data: serde_json::Value = serde_json::from_str(&response_text)
            .context("Failed to parse signed URL response")?;

        tracing::debug!("Signed URL response: {:?}", signed_data);

        // Extract signed URL from response
        // Supabase returns: { "signedURL": "https://..." } or sometimes just the path
        let signed_url = signed_data
            .get("signedURL")
            .or_else(|| signed_data.get("signedUrl")) // Try camelCase variant
            .and_then(|v| v.as_str())
            .ok_or_else(|| {
                // Log the actual response for debugging
                tracing::error!("Unexpected signed URL response format: {:?}", signed_data);
                anyhow::anyhow!("No signedURL in response. Response: {}", response_text)
            })?;

        // Construct full URL
        // Supabase signed URL format: https://{project_ref}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token=...
        // Note: Supabase may return path like "/object/sign/storage/profiles/..." where "storage" is the bucket name
        let full_url = if signed_url.starts_with("http") {
            // Already a full URL - use as is
            signed_url.to_string()
        } else if signed_url.starts_with("/object/sign/") {
            // Supabase returns path like "/object/sign/{bucket}/{path}?token=..."
            // We need to add "/storage/v1" prefix to make it: "/storage/v1/object/sign/{bucket}/{path}?token=..."
            let base_url = if self.client.url.ends_with('/') {
                self.client.url.trim_end_matches('/')
            } else {
                &self.client.url
            };
            format!("{}/storage/v1{}", base_url, signed_url)
        } else if signed_url.starts_with("/") {
            // Other relative path starting with / - construct full URL
            let base_url = if self.client.url.ends_with('/') {
                self.client.url.trim_end_matches('/')
            } else {
                &self.client.url
            };
            format!("{}{}", base_url, signed_url)
        } else {
            // Relative path without / - construct full URL
            let base_url = if self.client.url.ends_with('/') {
                self.client.url.trim_end_matches('/')
            } else {
                &self.client.url
            };
            format!("{}/{}", base_url, signed_url)
        };

        tracing::info!("Generated signed URL: {}", full_url);
        Ok(full_url)
    }

    /// Delete a file from Supabase Storage
    pub async fn delete_file(&self, file_path: String) -> Result<()> {
        // Extract path from full URL if needed
        let path = if file_path.starts_with("http") {
            // Extract path from URL like: https://xxx.supabase.co/storage/v1/object/public/bucket/path
            file_path
                .split("/object/public/")
                .nth(1)
                .and_then(|s| s.splitn(2, '/').nth(1))
                .ok_or_else(|| anyhow::anyhow!("Invalid file URL format"))?
                .to_string()
        } else {
            file_path
        };

        let storage_url = format!(
            "{}/object/{}/{}",
            self.client.get_storage_url(),
            self.client.storage_bucket,
            path
        );

        let response = self
            .client
            .http_client
            .delete(&storage_url)
            .header("Authorization", self.client.get_authorization_header())
            .send()
            .await
            .context("Failed to delete file from Supabase Storage")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Supabase Storage delete error: {}", error_text);
        }

        Ok(())
    }

    /// Upload user profile image
    pub async fn upload_profile_image(
        &self,
        file_data: Bytes,
        file_name: String,
        user_id: Uuid,
    ) -> Result<String> {
        self.upload_file(file_data, file_name, user_id, Some("profiles".to_string()))
            .await
    }

    /// Upload user cover image
    pub async fn upload_cover_image(
        &self,
        file_data: Bytes,
        file_name: String,
        user_id: Uuid,
    ) -> Result<String> {
        self.upload_file(file_data, file_name, user_id, Some("covers".to_string()))
            .await
    }
}

