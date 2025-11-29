// AI Provider Constants
export const AI_PROVIDERS = {
    GEMINI: 'gemini',
    MISTRAL: 'mistral',
    OPENAI: 'openai',
    GROQ: 'groq',
} as const;

// ⚙️ AI Configuration (ตั้งค่า AI ตรงนี้)
export const AI_CONFIG = {
    // 1. ระบบจับคู่งาน (Job Matching)
    JOB_MATCHING_PROVIDER: AI_PROVIDERS.GEMINI,

    // 2. ระบบอ่าน Resume (Resume Parsing)
    RESUME_PARSING_PROVIDER: AI_PROVIDERS.MISTRAL,

    // 3. ระบบวิเคราะห์ตัวตนจาก Social (Personality Analysis)
    SOCIAL_ANALYSIS_PROVIDER: AI_PROVIDERS.MISTRAL,

    // 4. ระบบ AI Score (AI Score Calculation)
    AI_SCORE_PROVIDER: AI_PROVIDERS.GEMINI,
};
