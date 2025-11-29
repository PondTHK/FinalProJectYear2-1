use crate::domain::entities::social_analysis::{
    NewSocialAnalysis, SocialAnalysisEntity, UpdateSocialAnalysis,
};
use anyhow::Result;
use axum::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait SocialAnalysisRepository: Send + Sync {
    /// สร้าง social analysis ใหม่
    async fn create(&self, new_analysis: &NewSocialAnalysis) -> Result<SocialAnalysisEntity>;

    /// ดึงข้อมูล analysis ตาม user_id และ connection_id
    async fn get_by_user_and_connection(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
    ) -> Result<Option<SocialAnalysisEntity>>;

    /// ดึงข้อมูล analysis ตาม id
    async fn get_by_id(&self, id: Uuid) -> Result<Option<SocialAnalysisEntity>>;

    /// ดึงข้อมูล analyses ทั้งหมดของ user
    async fn get_by_user_id(&self, user_id: Uuid) -> Result<Vec<SocialAnalysisEntity>>;

    /// อัปเดตข้อมูล analysis
    async fn update(
        &self,
        id: Uuid,
        update_data: &UpdateSocialAnalysis,
    ) -> Result<SocialAnalysisEntity>;

    /// สร้างใหม่ถ้ายังไม่มี หรืออัปเดตถ้ามีแล้ว (upsert)
    async fn upsert(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
        analysis_data: &NewSocialAnalysis,
    ) -> Result<SocialAnalysisEntity>;

    /// ลบ analysis
    async fn delete(&self, id: Uuid) -> Result<()>;

    /// ลบ analysis ตาม user_id และ connection_id
    async fn delete_by_user_and_connection(
        &self,
        user_id: Uuid,
        connection_id: Uuid,
    ) -> Result<()>;
}

