// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "job_status"))]
    pub struct JobStatus;

    #[derive(diesel::query_builder::QueryId, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "user_role"))]
    pub struct UserRole;

    #[derive(diesel::query_builder::QueryId, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "user_status"))]
    pub struct UserStatus;
}

diesel::table! {
    ads (id) {
        id -> Uuid,
        #[max_length = 255]
        title -> Varchar,
        #[max_length = 255]
        sponsor_name -> Nullable<Varchar>,
        #[max_length = 50]
        sponsor_tag -> Nullable<Varchar>,
        profile_image_url -> Nullable<Text>,
        details -> Nullable<Text>,
        link_url -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        start_date -> Nullable<Timestamptz>,
        end_date -> Nullable<Timestamptz>,
        #[max_length = 50]
        status -> Nullable<Varchar>,
    }
}

diesel::table! {
    companies (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        company_name -> Varchar,
        #[max_length = 255]
        industry -> Nullable<Varchar>,
        #[max_length = 100]
        company_size -> Nullable<Varchar>,
        description -> Nullable<Text>,
        #[max_length = 50]
        phone -> Nullable<Varchar>,
        address_detail -> Nullable<Text>,
        #[max_length = 100]
        province -> Nullable<Varchar>,
        #[max_length = 100]
        district -> Nullable<Varchar>,
        #[max_length = 100]
        subdistrict -> Nullable<Varchar>,
        #[max_length = 10]
        postal_code -> Nullable<Varchar>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        #[max_length = 50]
        status -> Varchar,
        logo_url -> Nullable<Text>,
        #[max_length = 4]
        founded_year -> Nullable<Varchar>,
        mission -> Nullable<Text>,
        vision -> Nullable<Text>,
        is_verified -> Nullable<Bool>,
        #[max_length = 255]
        email -> Nullable<Varchar>,
    }
}

diesel::table! {
    company_galleries (id) {
        id -> Uuid,
        company_id -> Uuid,
        image_url -> Text,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    company_posts (id) {
        id -> Uuid,
        company_id -> Uuid,
        #[max_length = 255]
        title -> Varchar,
        #[max_length = 255]
        location -> Varchar,
        #[max_length = 50]
        job_type -> Varchar,
        #[max_length = 100]
        salary_range -> Nullable<Varchar>,
        tags -> Nullable<Array<Nullable<Text>>>,
        #[max_length = 50]
        status -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        description -> Nullable<Text>,
        responsibilities -> Nullable<Text>,
        qualifications -> Nullable<Text>,
        benefits -> Nullable<Text>,
        latitude -> Nullable<Float8>,
        longitude -> Nullable<Float8>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::JobStatus;

    generation_jobs (id) {
        id -> Uuid,
        requester_id -> Uuid,
        status -> JobStatus,
        prompt -> Nullable<Text>,
        result -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        completed_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    job_applications (id) {
        id -> Uuid,
        job_id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        status -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    profile_shares (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 128]
        share_token -> Varchar,
        expires_at -> Timestamptz,
        view_count -> Nullable<Int4>,
        last_viewed_at -> Nullable<Timestamptz>,
        is_active -> Nullable<Bool>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    prompt_templates (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        template_text -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    saved_jobs (id) {
        id -> Uuid,
        user_id -> Uuid,
        post_id -> Uuid,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    social_analysis (id) {
        id -> Uuid,
        user_id -> Uuid,
        social_connection_id -> Uuid,
        big_five_scores -> Jsonb,
        analyzed_posts -> Nullable<Jsonb>,
        strengths -> Nullable<Array<Nullable<Text>>>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        work_style -> Nullable<Text>,
    }
}

diesel::table! {
    social_connections (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        platform -> Varchar,
        #[max_length = 255]
        platform_user_id -> Varchar,
        access_token -> Text,
        refresh_token -> Nullable<Text>,
        expires_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        #[max_length = 255]
        name -> Nullable<Varchar>,
        profile_image -> Nullable<Text>,
    }
}

diesel::table! {
    social_posts (id) {
        id -> Uuid,
        social_connection_id -> Uuid,
        #[max_length = 255]
        platform_post_id -> Varchar,
        content -> Text,
        posted_at -> Nullable<Timestamptz>,
        likes_count -> Nullable<Int4>,
        comments_count -> Nullable<Int4>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    user_addresses (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        province -> Nullable<Varchar>,
        #[max_length = 100]
        district -> Nullable<Varchar>,
        #[max_length = 100]
        subdistrict -> Nullable<Varchar>,
        #[max_length = 10]
        postal_code -> Nullable<Varchar>,
        address_detail -> Nullable<Text>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    user_ai_scores (id) {
        id -> Uuid,
        user_id -> Uuid,
        score -> Int4,
        #[max_length = 255]
        recommended_position -> Varchar,
        analysis -> Text,
        education_score -> Nullable<Int4>,
        experience_score -> Nullable<Int4>,
        skill_score -> Nullable<Int4>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        #[max_length = 50]
        level -> Nullable<Varchar>,
    }
}

diesel::table! {
    user_educations (user_id, school, start_date) {
        user_id -> Uuid,
        #[max_length = 100]
        school -> Varchar,
        #[max_length = 100]
        degree -> Varchar,
        #[max_length = 100]
        major -> Nullable<Varchar>,
        start_date -> Date,
        end_date -> Date,
        description -> Text,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    user_experiences (user_id, company, start_date) {
        user_id -> Uuid,
        #[max_length = 100]
        company -> Varchar,
        #[max_length = 100]
        position -> Varchar,
        #[max_length = 50]
        position_type -> Nullable<Varchar>,
        start_date -> Date,
        end_date -> Date,
        description -> Text,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    user_job_matches (id) {
        id -> Uuid,
        user_id -> Uuid,
        job_id -> Uuid,
        match_score -> Int4,
        analysis -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_job_preferences (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        position -> Varchar,
        #[max_length = 100]
        work_time -> Nullable<Varchar>,
        created_at -> Nullable<Timestamptz>,
        #[max_length = 255]
        industry -> Nullable<Varchar>,
    }
}

diesel::table! {
    user_portfolios (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        title -> Varchar,
        description -> Nullable<Text>,
        image_url -> Nullable<Text>,
        link -> Nullable<Text>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    user_privacy_settings (id) {
        id -> Uuid,
        user_id -> Uuid,
        show_profile -> Bool,
        show_profile_image -> Bool,
        show_cover_image -> Bool,
        show_name -> Bool,
        show_title -> Bool,
        show_phone -> Bool,
        show_line_id -> Bool,
        show_email -> Bool,
        show_gender -> Bool,
        show_birth_date -> Bool,
        show_nationality -> Bool,
        show_religion -> Bool,
        show_military_status -> Bool,
        show_address -> Bool,
        show_experiences -> Bool,
        show_educations -> Bool,
        show_job_preference -> Bool,
        show_portfolios -> Bool,
        show_skills -> Bool,
        show_about_me -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_profiles (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        title -> Nullable<Varchar>,
        #[max_length = 255]
        first_name_th -> Nullable<Varchar>,
        #[max_length = 255]
        last_name_th -> Nullable<Varchar>,
        #[max_length = 255]
        first_name_en -> Nullable<Varchar>,
        #[max_length = 255]
        last_name_en -> Nullable<Varchar>,
        #[max_length = 20]
        gender -> Nullable<Varchar>,
        birth_date -> Nullable<Date>,
        #[max_length = 100]
        religion -> Nullable<Varchar>,
        #[max_length = 100]
        nationality -> Nullable<Varchar>,
        #[max_length = 50]
        phone -> Nullable<Varchar>,
        #[max_length = 100]
        line_id -> Nullable<Varchar>,
        #[max_length = 100]
        military_status -> Nullable<Varchar>,
        is_disabled -> Nullable<Bool>,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
        profile_image_url -> Nullable<Text>,
        cover_image_url -> Nullable<Text>,
        #[max_length = 50]
        template -> Nullable<Varchar>,
        #[max_length = 255]
        email -> Nullable<Varchar>,
    }
}

diesel::table! {
    user_skills (id) {
        id -> Uuid,
        user_id -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        skills -> Nullable<Array<Nullable<Text>>>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::UserRole;
    use super::sql_types::UserStatus;

    users (id) {
        id -> Uuid,
        #[max_length = 255]
        username -> Varchar,
        #[max_length = 255]
        password_hash -> Varchar,
        #[max_length = 255]
        display_name -> Nullable<Varchar>,
        role -> UserRole,
        status -> UserStatus,
        ai_credits -> Int4,
        max_profiles -> Int4,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::joinable!(companies -> users (user_id));
diesel::joinable!(company_galleries -> companies (company_id));
diesel::joinable!(company_posts -> companies (company_id));
diesel::joinable!(job_applications -> company_posts (job_id));
diesel::joinable!(job_applications -> users (user_id));
diesel::joinable!(profile_shares -> users (user_id));
diesel::joinable!(saved_jobs -> company_posts (post_id));
diesel::joinable!(saved_jobs -> users (user_id));
diesel::joinable!(social_analysis -> social_connections (social_connection_id));
diesel::joinable!(social_analysis -> users (user_id));
diesel::joinable!(social_posts -> social_connections (social_connection_id));
diesel::joinable!(user_addresses -> users (user_id));
diesel::joinable!(user_ai_scores -> users (user_id));
diesel::joinable!(user_educations -> users (user_id));
diesel::joinable!(user_experiences -> users (user_id));
diesel::joinable!(user_job_matches -> company_posts (job_id));
diesel::joinable!(user_job_matches -> users (user_id));
diesel::joinable!(user_job_preferences -> users (user_id));
diesel::joinable!(user_portfolios -> users (user_id));
diesel::joinable!(user_privacy_settings -> users (user_id));
diesel::joinable!(user_profiles -> users (user_id));
diesel::joinable!(user_skills -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    ads,
    companies,
    company_galleries,
    company_posts,
    generation_jobs,
    job_applications,
    profile_shares,
    prompt_templates,
    saved_jobs,
    social_analysis,
    social_connections,
    social_posts,
    user_addresses,
    user_ai_scores,
    user_educations,
    user_experiences,
    user_job_matches,
    user_job_preferences,
    user_portfolios,
    user_privacy_settings,
    user_profiles,
    user_skills,
    users,
);
