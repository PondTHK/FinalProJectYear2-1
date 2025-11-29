use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::{
    entities::user_job_match::{CreateUserJobMatchRequest, NewUserJobMatch, UserJobMatchEntity},
    repo::user_job_match::UserJobMatchRepository,
};

pub struct UserJobMatchUseCase<R>
where
    R: UserJobMatchRepository,
{
    repo: Arc<R>,
}

impl<R> UserJobMatchUseCase<R>
where
    R: UserJobMatchRepository,
{
    pub fn new(repo: Arc<R>) -> Self {
        Self { repo }
    }

    pub async fn save_matches(
        &self,
        user_id: Uuid,
        requests: Vec<CreateUserJobMatchRequest>,
    ) -> Result<Vec<UserJobMatchEntity>> {
        let new_matches: Vec<NewUserJobMatch> = requests
            .into_iter()
            .map(|req| NewUserJobMatch {
                user_id,
                job_id: req.job_id,
                match_score: req.match_score,
                analysis: req.analysis,
            })
            .collect();

        self.repo.create_many(&new_matches).await
    }

    pub async fn get_matches(&self, user_id: Uuid) -> Result<Vec<UserJobMatchEntity>> {
        self.repo.get_by_user_id(user_id).await
    }
}
