use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

use crate::{
    domain::{
        entities::{
            user::Role,
            user_education::UserEducationEntity,
            user_experience::UserExperienceEntity,
            user_job_preference::UserJobPreferenceEntity,
            user_portfolio::UserPortfolioEntity,
            user_profile::UserProfileEntity,
            user_skill::UserSkillEntity,
        },
        repo::{
            user::UserRepository, user_education::UserEducationRepository,
            user_experience::UserExperienceRepository,
            user_job_preference::UserJobPreferenceRepository,
            user_portfolio::UserPortfolioRepository, user_profile::UserProfileRepository,
            user_skill::UserSkillRepository,
        },
        usecase::{
            user::UserUseCase, user_education::UserEducationUseCase,
            user_experience::UserExperienceUseCase,
            user_job_preference::UserJobPreferenceUseCase,
            user_portfolio::UserPortfolioUseCase, user_profile::UserProfileUseCase,
            user_skill::UserSkillUseCase,
        },
    },
    infrastructure::{
        axum_http::middleware::user_authorization,
        jwt_authentication::jwt_model::Claims,
        postgres::{
            postgres_connection::DbPool, repositories::user::UserPostgres,
            repositories::user_education::UserEducationPostgres,
            repositories::user_experience::UserExperiencePostgres,
            repositories::user_job_preference::UserJobPreferencePostgres,
            repositories::user_portfolio::UserPortfolioPostgres,
            repositories::user_profile::UserProfilePostgres,
            repositories::user_skill::UserSkillPostgres,
        },
    },
};

/// Custom extractor for Claims from JWT
pub struct OptionalClaims(pub Option<Claims>);

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for OptionalClaims
where
    S: Send + Sync,
{
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let claims = parts.extensions.get::<Claims>().cloned();
        Ok(OptionalClaims(claims))
    }
}

pub fn routes(db_pool: Arc<DbPool>) -> Router {
    let user_repository = UserPostgres::new(Arc::clone(&db_pool));
    let user_use_case = Arc::new(UserUseCase::new(Arc::new(user_repository)));

    let user_profile_repository = UserProfilePostgres::new(Arc::clone(&db_pool));
    let user_profile_use_case =
        Arc::new(UserProfileUseCase::new(Arc::new(user_profile_repository)));

    let user_education_repository = UserEducationPostgres::new(Arc::clone(&db_pool));
    let user_education_use_case = Arc::new(UserEducationUseCase::new(Arc::new(
        user_education_repository,
    )));

    let user_experience_repository = UserExperiencePostgres::new(Arc::clone(&db_pool));
    let user_experience_use_case = Arc::new(UserExperienceUseCase::new(Arc::new(
        user_experience_repository,
    )));

    let user_skill_repository = UserSkillPostgres::new(Arc::clone(&db_pool));
    let user_skill_use_case = Arc::new(UserSkillUseCase::new(Arc::new(user_skill_repository)));

    let user_portfolio_repository = UserPortfolioPostgres::new(Arc::clone(&db_pool));
    let user_portfolio_use_case = Arc::new(UserPortfolioUseCase::new(Arc::new(
        user_portfolio_repository,
    )));

    let user_job_preference_repository = UserJobPreferencePostgres::new(Arc::clone(&db_pool));
    let user_job_preference_use_case = Arc::new(UserJobPreferenceUseCase::new(Arc::new(
        user_job_preference_repository,
    )));

    Router::new()
        .route("/company/applicant/:user_id", get(get_applicant_data))
        .layer(middleware::from_fn(user_authorization))
        .with_state((
            user_use_case,
            user_profile_use_case,
            user_education_use_case,
            user_experience_use_case,
            user_skill_use_case,
            user_portfolio_use_case,
            user_job_preference_use_case,
        ))
}

#[derive(Serialize)]
pub struct ApplicantData {
    pub profile: Option<UserProfileEntity>,
    pub educations: Vec<UserEducationEntity>,
    pub experiences: Vec<UserExperienceEntity>,
    pub skills: Vec<String>,
    pub portfolios: Vec<UserPortfolioEntity>,
    pub job_preference: Option<UserJobPreferenceEntity>,
}

pub async fn get_applicant_data<
    TUser,
    TProfile,
    TEducation,
    TExperience,
    TSkill,
    TPortfolio,
    TJobPref,
>(
    State((
        user_use_case,
        user_profile_use_case,
        user_education_use_case,
        user_experience_use_case,
        user_skill_use_case,
        user_portfolio_use_case,
        user_job_preference_use_case,
    )): State<(
        Arc<UserUseCase<TUser>>,
        Arc<UserProfileUseCase<TProfile>>,
        Arc<UserEducationUseCase<TEducation>>,
        Arc<UserExperienceUseCase<TExperience>>,
        Arc<UserSkillUseCase<TSkill>>,
        Arc<UserPortfolioUseCase<TPortfolio>>,
        Arc<UserJobPreferenceUseCase<TJobPref>>,
    )>,
    Path(user_id): Path<Uuid>,
    OptionalClaims(claims_opt): OptionalClaims,
) -> impl IntoResponse
where
    TUser: UserRepository + Send + Sync + 'static,
    TProfile: UserProfileRepository + Send + Sync + 'static,
    TEducation: UserEducationRepository + Send + Sync + 'static,
    TExperience: UserExperienceRepository + Send + Sync + 'static,
    TSkill: UserSkillRepository + Send + Sync + 'static,
    TPortfolio: UserPortfolioRepository + Send + Sync + 'static,
    TJobPref: UserJobPreferenceRepository + Send + Sync + 'static,
{
    // 1. Verify Company User Role
    let mut is_company_user = false;
    if let Some(claims) = &claims_opt {
        if let Ok(requester_id) = Uuid::parse_str(&claims.sub) {
            match user_use_case.get_user_by_id(requester_id).await {
                Ok(user) => {
                    if user.role == Role::CompanyUser {
                        is_company_user = true;
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to fetch requester user info: {}", e);
                }
            }
        }
    }

    if !is_company_user {
        return (StatusCode::FORBIDDEN, "Only company users can access applicant data").into_response();
    }

    // 2. Fetch All Data (Parallel-ish)
    let profile = user_profile_use_case.get_profile_by_user_id(user_id).await;
    let educations = user_education_use_case.get_user_educations(user_id).await;
    let experiences = user_experience_use_case.get_user_experiences(user_id).await;
    let skills = user_skill_use_case.get_user_skills(user_id).await;
    let portfolios = user_portfolio_use_case.get_user_portfolios(user_id).await;
    let job_preference = user_job_preference_use_case
        .get_preference_by_user_id(user_id)
        .await;

    // 3. Handle Results
    let profile_data = match profile {
        Ok(p) => p,
        Err(_) => None,
    };
    let educations_data = match educations {
        Ok(e) => e,
        Err(_) => vec![],
    };
    let experiences_data = match experiences {
        Ok(e) => e,
        Err(_) => vec![],
    };
    let skills_data = match skills {
        Ok(Some(s)) => {
            // Extract strings from Option<Vec<Option<String>>>
            s.skills
                .unwrap_or_default()
                .into_iter()
                .flatten()
                .collect()
        },
        Ok(None) => vec![],
        Err(_) => vec![],
    };
    let portfolios_data = match portfolios {
        Ok(p) => p,
        Err(_) => vec![],
    };
    let job_preference_data = match job_preference {
        Ok(jp) => jp,
        Err(_) => None,
    };

    // 4. Return Aggregated Data
    let response = ApplicantData {
        profile: profile_data,
        educations: educations_data,
        experiences: experiences_data,
        skills: skills_data,
        portfolios: portfolios_data,
        job_preference: job_preference_data,
    };

    (StatusCode::OK, Json(response)).into_response()
}
