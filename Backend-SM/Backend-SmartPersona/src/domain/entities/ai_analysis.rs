use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct AIAnalysisRequest {
    pub user_id: String,
    pub posts: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct AIAnalysisResponse {
    pub personality_tags: Vec<String>,
    pub suggested_theme: String,
}

#[derive(Debug, Serialize)]
pub struct ChatRequest {
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatResponse {
    pub reply: String,
}

// --- Resume Parsing Entities ---

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct ResumePersonalData {
    #[serde(rename = "firstNameTh", default)]
    pub first_name_th: Option<String>,
    #[serde(rename = "lastNameTh", default)]
    pub last_name_th: Option<String>,
    #[serde(rename = "firstNameEn", default)]
    pub first_name_en: Option<String>,
    #[serde(rename = "lastNameEn", default)]
    pub last_name_en: Option<String>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub gender: Option<String>,
    #[serde(rename = "birthDate", default)]
    pub birth_date: Option<String>,
    #[serde(default)]
    pub nationality: Option<String>,
    #[serde(default)]
    pub religion: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(rename = "lineId", default)]
    pub line_id: Option<String>,
    #[serde(rename = "militaryStatus", default)]
    pub military_status: Option<String>,
    #[serde(default)]
    pub address: Option<ResumeAddressData>,
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct ResumeAddressData {
    #[serde(default)]
    pub province: Option<String>,
    #[serde(default)]
    pub district: Option<String>,
    #[serde(default)]
    pub subdistrict: Option<String>,
    #[serde(rename = "postalCode", default)]
    pub postal_code: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct ResumeEducationData {
    #[serde(default)]
    pub school: Option<String>,
    #[serde(default)]
    pub degree: Option<String>,
    #[serde(default)]
    pub major: Option<String>,
    #[serde(rename = "startDate", default)]
    pub start_date: Option<String>,
    #[serde(rename = "endDate", default)]
    pub end_date: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct ResumeExperienceData {
    #[serde(default)]
    pub company: Option<String>,
    #[serde(default)]
    pub position: Option<String>,
    #[serde(rename = "positionType", default)]
    pub position_type: Option<String>,
    #[serde(rename = "startDate", default)]
    pub start_date: Option<String>,
    #[serde(rename = "endDate", default)]
    pub end_date: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct ParsedResumeResponse {
    #[serde(default)]
    pub personal: ResumePersonalData,
    #[serde(default)]
    pub education: Vec<ResumeEducationData>,
    #[serde(default)]
    pub experience: Vec<ResumeExperienceData>,
    #[serde(default)]
    pub skills: Vec<String>,
}
