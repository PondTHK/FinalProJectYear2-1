// API Configuration
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
export const AI_SERVICE_URL: string =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8001";

import { AI_CONFIG } from "./ai-config";

// Import PrivacySettings type
export interface PrivacySettings {
  showProfile: boolean;
  showProfileImage: boolean;
  showCoverImage: boolean;
  showName: boolean;
  showTitle: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showGender: boolean;
  showBirthDate: boolean;
  showNationality: boolean;
  showReligion: boolean;
  showMilitaryStatus: boolean;
  showAddress: boolean;
  showExperiences: boolean;
  showEducations: boolean;
  showJobPreference: boolean;
  showPortfolios: boolean;
  showSkills: boolean;
  showAboutMe: boolean;
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/authentication/login",
  REFRESH_TOKEN: "/authentication/refresh-token",
  LOGOUT: "/authentication/logout",
  ADMIN_LOGIN: "/authentication/admin/login",
  ADMIN_REFRESH_TOKEN: "/authentication/admin/refresh-token",
  ADMIN_LOGOUT: "/authentication/admin/logout",

  // User
  REGISTER: "/api/user/register",
  USER_INFO: "/api/user/info",
  PROFILE: "/api/user/profile",
  PRIVACY_SETTINGS: "/api/user/privacy-settings",
  ADDRESS: "/api/user/address",
  JOB_PREFERENCE: "/api/user/job-preference",
  EDUCATIONS: "/api/user/educations",
  EXPERIENCES: "/api/user/experiences",
  PORTFOLIOS: "/api/user/portfolios",
  SKILLS: "/api/user/skills",
  SAVED_JOBS: "/api/user/saved-jobs",

  // Company
  COMPANY: "/api/user/company",
  COMPANY_BY_ID: "/api/companies/:company_id", // Public endpoint to get company by company_id
  COMPANY_GALLERIES: "/api/user/companies/:company_id/galleries",
  COMPANY_GALLERY: "/api/user/galleries/:id",
  COMPANY_POSTS: "/api/user/companies/:company_id/posts",
  COMPANY_POST: "/api/user/posts/:id",
  ALL_POSTS: "/api/user/posts", // Public endpoint to get all posts

  // AI
  AI_PARSE_RESUME: "/api/ai/parse-resume",
  AI_MATCH_JOBS: "/api/ai/match-jobs",
  AI_SCORE: "/api/user/ai-score",
  AI_TRANSLATE: "/api/ai/translate",

  // Admin
  ADMIN_DASHBOARD_STATS: "/admin/dashboard-stats",
  ADMIN_NEW_USERS_TODAY: "/admin/new-users-today",
  ADMIN_USERS_LAST_7_DAYS: "/admin/users-last-7-days",
  ADMIN_USER_SKILLS: "/admin/users/:id/skills",
  ADMIN_ALL_COMPANIES: "/admin/companies",
  ADMIN_APPROVE_COMPANY: "/admin/companies/:id/approve",
  ADMIN_REJECT_COMPANY: "/admin/companies/:id/reject",
  ADMIN_BAN_USER: "/admin/users/:id/ban",
  ADMIN_UNBAN_USER: "/admin/users/:id/unban",
  ADMIN_BAN_COMPANY: "/admin/companies/:id/ban",
  ADMIN_UNBAN_COMPANY: "/admin/companies/:id/unban",

  // Health Check
  HEALTH_CHECK: "/health-check",

  // Storage
  STORAGE_UPLOAD: "/api/storage/upload",
  STORAGE_UPLOAD_PROFILE_IMAGE: "/api/storage/upload/profile-image",
  STORAGE_UPLOAD_COVER_IMAGE: "/api/storage/upload/cover-image",
  STORAGE_DELETE: "/api/storage/delete",

  // Social
  SOCIAL_CONNECTIONS: "/api/user/social/connections",
  SOCIAL_CONNECTION: "/api/user/social/connections/:id",
  SOCIAL_POSTS: "/api/user/social/connections/:id/posts",
  SOCIAL_ANALYSIS: "/api/user/social/connections/:id/analysis",
  SOCIAL_DATA: "/api/user/social/data",
} as const;

// Type definitions
export interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface UserProfilePayload {
  title?: string | null;
  first_name_th?: string | null;
  last_name_th?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  religion?: string | null;
  nationality?: string | null;
  phone?: string | null;
  email?: string | null;
  military_status?: string | null;
  is_disabled?: boolean | null;
  profile_image_url?: string | null;
  cover_image_url?: string | null;
  template?: string | null;
}

export interface UserProfileResponse extends UserProfilePayload {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserAddressPayload {
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postal_code?: string | null;
  address_detail?: string | null;
}

export interface UserAddressResponse extends UserAddressPayload {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserJobPreferencePayload {
  industry?: string | null;
  position: string;
  work_time?: string | null;
}

export interface UserJobPreferenceResponse extends UserJobPreferencePayload {
  id: string;
  user_id: string;
  created_at: string | null;
}

export interface UserEducationPayload {
  school: string;
  degree: string;
  major?: string | null;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  description: string;
}

export interface UserEducationResponse extends UserEducationPayload {
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserExperiencePayload {
  company: string;
  position: string;
  position_type?: string | null;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  description: string;
}

export interface UserExperienceResponse extends UserExperiencePayload {
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserPortfolioPayload {
  title: string;
  description?: string | null;
  image_url?: string | null;
  link?: string | null;
}

export interface UserPortfolioResponse extends UserPortfolioPayload {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface SavedJobResponse {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export interface CompanyPayload {
  company_name: string;
  industry?: string | null;
  email?: string | null;
  company_size?: string | null;
  description?: string | null;
  phone?: string | null;
  address_detail?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postal_code?: string | null;
  founded_year?: string | null;
  mission?: string | null;
  vision?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
}

export interface CompanyResponse extends CompanyPayload {
  id: string;
  user_id: string;
  status: string;
  logo_url?: string | null;
  is_verified?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyGalleryPayload {
  image_url: string;
}

export interface CompanyGalleryResponse extends CompanyGalleryPayload {
  id: string;
  company_id: string;
  created_at: string;
}

export interface CompanyPostPayload {
  title: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  job_type: string;
  description?: string | null;
  salary_range?: string | null;
  tags?: string[] | null;
  status: string;
  responsibilities?: string | null;
  qualifications?: string | null;
  benefits?: string | null;
}

export interface CompanyPostResponse extends CompanyPostPayload {
  id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserGrowthData {
  date: string;
  new_users: number;
  total_users: number;
}

export interface DashboardStats {
  total_users: number;
  new_users_today: number;
  active_users_last_7_days: number;
  average_users_per_day: number;
  total_companies: number;
  total_job_posts: number;
  total_generation_jobs?: number;
  total_profile_shares?: number;
  user_growth: UserGrowthData[];
}

export interface UserSummary {
  id: string;
  username: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

export interface NewUsersTodayResponse {
  count: number;
  users: UserSummary[];
}

// --- Resume Parsing Types ---
export interface ResumePersonalData {
  firstNameTh?: string;
  lastNameTh?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  title?: string;
  gender?: string;
  birthDate?: string;
  nationality?: string;
  religion?: string;
  phone?: string;
  email?: string;

  militaryStatus?: string;
  address?: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  };
}

export interface ResumeEducationData {
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeExperienceData {
  company: string;
  position: string;
  positionType: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ParsedResumeData {
  personal: ResumePersonalData;
  education: ResumeEducationData[];
  experience: ResumeExperienceData[];
  skills: string[];
}

// --- AI Match Jobs Types ---
export interface AIJobMatchRequest {
  user_profile: {
    skills: string[];
    interests: string;
    address: string;
  };
  job_posts: CompanyPostResponse[];
}

export interface AIJobMatchResult {
  job_id: string;
  match_score: number;
  reason: string;
  location_status: "Close" | "Far" | "Unknown";
  location_note?: string;
}

export interface AIJobMatchResponse {
  matches: AIJobMatchResult[];
  overall_analysis: string;
}

// Track if we're currently refreshing token to avoid infinite loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const handleTokenRefresh = async (): Promise<boolean> => {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return await refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (refreshResponse.ok) {
        console.log("✅ Token refreshed successfully");
        return true;
      } else {
        console.log("❌ Token refresh failed");
        // Don't redirect here - let middleware handle protected routes
        // This prevents redirect loops on public pages
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      // Don't redirect on error - just return false
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return await refreshPromise;
};
export interface AIScoreResponse {
  score: number;
  education_score?: number;
  experience_score?: number;
  skill_score?: number;
  level: string;
  recommended_position: string;
  analysis: string;
  found_skills?: string[];
  recommended_skills?: string[];
}

export const apiCall = async <T = any>(
  endpoint: string,
  options: ApiOptions = {},
  retryOn401: boolean = true,
): Promise<ApiResponse<T>> => {
  const url: string = `${API_BASE_URL}${endpoint}`;

  // Skip refresh for auth endpoints
  const isAuthEndpoint = endpoint.includes("/authentication/") ||
    endpoint.includes("/admin/login") ||
    endpoint.includes("/admin/logout");

  const defaultOptions: ApiOptions = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Important for cookies
    ...options,
  };

  try {
    console.log('API call:', url, options);
    let response: Response = await fetch(url, defaultOptions);
    console.log('API response status:', response.status, response.statusText);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryOn401 && !isAuthEndpoint) {
      console.log("🔄 Token expired, attempting refresh...");
      const refreshSuccess = await handleTokenRefresh();

      if (refreshSuccess) {
        // Retry the original request after refresh
        console.log("🔄 Retrying original request after token refresh...");
        response = await fetch(url, defaultOptions);
        console.log('API response status after refresh:', response.status, response.statusText);
      } else {
        // Refresh failed, return 401 to trigger redirect
        return {
          ok: false,
          status: 401,
          data: "Token expired. Please login again." as unknown as T,
        };
      }
    }

    const contentType: string | null = response.headers.get("content-type");
    let data: T;

    try {
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log('Parsed JSON data:', data);
      } else {
        // For plain text responses (like "Admin login successfully")
        const textData = await response.text();
        console.log('Plain text response:', textData);
        data = textData as unknown as T;
      }
    } catch (parseError) {
      // If parsing fails but status is OK, cookies might still be set
      // Return empty data but keep the response status
      console.warn("Response parsing error (might be plain text):", parseError);
      data = "" as unknown as T;
    }

    // If still 401 after refresh, just return the response
    // Don't redirect - let middleware handle protected routes
    // This prevents redirect loops on public pages

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
};

// Helper function for calling AI Service directly
const aiServiceCall = async <T>(
  endpoint: string,
  data: any,
  provider?: string
): Promise<T> => {
  const url = new URL(`${AI_SERVICE_URL}${endpoint}`);
  if (provider) {
    url.searchParams.append("provider", provider);
  }

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Service Error (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error("AI Service Call Error:", error);
    throw error;
  }
};

// Specific API Functions
export const authAPI = {
  login: async (
    username: string,
    password: string,
  ): Promise<ApiResponse<any>> => {
    return apiCall(API_ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  refreshToken: async (): Promise<ApiResponse<any>> => {
    return apiCall(API_ENDPOINTS.REFRESH_TOKEN, {
      method: "POST",
    });
  },

  logout: async (): Promise<ApiResponse<any>> => {
    return apiCall(API_ENDPOINTS.LOGOUT, {
      method: "POST",
    });
  },

  adminLogin: async (
    username: string,
    password: string,
  ): Promise<ApiResponse<any>> => {
    return apiCall(API_ENDPOINTS.ADMIN_LOGIN, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  adminLogout: async (): Promise<ApiResponse<any>> => {
    return apiCall(API_ENDPOINTS.ADMIN_LOGOUT, {
      method: "POST",
    });
  },
};

export const userAPI = {
  getApplicantData: async (userId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/api/company/applicant/${userId}`, {
      method: "GET",
    });
  },

  applyJob: async (jobId: string): Promise<ApiResponse<any>> => {
    return apiCall("/api/user/apply", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId }),
    });
  },

  register: async (
    username: string,
    password: string,
    role?: "PersonaUser" | "CompanyUser" | "Admin",
  ): Promise<ApiResponse<any>> => {
    return apiCall(API_ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        ...(role && { role }),
      }),
    });
  },

  getUserInfo: async (): Promise<ApiResponse<{ id: string; username: string; display_name: string | null; role: string }>> => {
    return apiCall<{ id: string; username: string; display_name: string | null; role: string }>(API_ENDPOINTS.USER_INFO, {
      method: "GET",
    });
  },

  getProfile: async (): Promise<ApiResponse<UserProfileResponse>> => {
    return apiCall<UserProfileResponse>(API_ENDPOINTS.PROFILE, {
      method: "GET",
    });
  },

  getProfileByUserId: async (userId: string): Promise<ApiResponse<UserProfileResponse>> => {
    return apiCall<UserProfileResponse>(`${API_ENDPOINTS.PROFILE}/${userId}`, {
      method: "GET",
    });
  },

  upsertProfile: async (
    profile: UserProfilePayload,
  ): Promise<ApiResponse<UserProfileResponse>> => {
    return apiCall<UserProfileResponse>(API_ENDPOINTS.PROFILE, {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  },

  getAddress: async (): Promise<ApiResponse<UserAddressResponse>> => {
    return apiCall<UserAddressResponse>(API_ENDPOINTS.ADDRESS, {
      method: "GET",
    });
  },

  getAddressByUserId: async (userId: string): Promise<ApiResponse<UserAddressResponse>> => {
    return apiCall<UserAddressResponse>(`${API_ENDPOINTS.ADDRESS}/${userId}`, {
      method: "GET",
    });
  },

  upsertAddress: async (
    address: UserAddressPayload,
  ): Promise<ApiResponse<UserAddressResponse>> => {
    return apiCall<UserAddressResponse>(API_ENDPOINTS.ADDRESS, {
      method: "PUT",
      body: JSON.stringify(address),
    });
  },

  getJobPreference: async (): Promise<
    ApiResponse<UserJobPreferenceResponse>
  > => {
    return apiCall<UserJobPreferenceResponse>(API_ENDPOINTS.JOB_PREFERENCE, {
      method: "GET",
    });
  },

  getAllJobPreferences: async (): Promise<
    ApiResponse<UserJobPreferenceResponse[]>
  > => {
    return apiCall<UserJobPreferenceResponse[]>("/api/user/job-preferences", {
      method: "GET",
    });
  },

  getJobPreferenceByUserId: async (userId: string): Promise<
    ApiResponse<UserJobPreferenceResponse[]>
  > => {
    return apiCall<UserJobPreferenceResponse[]>(`/api/user/job-preferences/user/${userId}`, {
      method: "GET",
    });
  },

  createJobPreference: async (
    preference: UserJobPreferencePayload,
  ): Promise<ApiResponse<UserJobPreferenceResponse>> => {
    return apiCall<UserJobPreferenceResponse>(API_ENDPOINTS.JOB_PREFERENCE, {
      method: "POST",
      body: JSON.stringify(preference),
    });
  },

  upsertJobPreference: async (
    preference: UserJobPreferencePayload,
  ): Promise<ApiResponse<UserJobPreferenceResponse>> => {
    return apiCall<UserJobPreferenceResponse>(API_ENDPOINTS.JOB_PREFERENCE, {
      method: "PUT",
      body: JSON.stringify(preference),
    });
  },

  deleteJobPreference: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`${API_ENDPOINTS.JOB_PREFERENCE}/${id}`, {
      method: "DELETE",
    });
  },

  getEducations: async (): Promise<ApiResponse<UserEducationResponse[]>> => {
    return apiCall<UserEducationResponse[]>(API_ENDPOINTS.EDUCATIONS, {
      method: "GET",
    });
  },

  getEducationsByUserId: async (userId: string): Promise<ApiResponse<UserEducationResponse[]>> => {
    return apiCall<UserEducationResponse[]>(`${API_ENDPOINTS.EDUCATIONS}/${userId}`, {
      method: "GET",
    });
  },

  createEducation: async (
    education: UserEducationPayload,
  ): Promise<ApiResponse<UserEducationResponse>> => {
    return apiCall<UserEducationResponse>(API_ENDPOINTS.EDUCATIONS, {
      method: "POST",
      body: JSON.stringify(education),
    });
  },

  upsertEducation: async (
    education: UserEducationPayload,
  ): Promise<ApiResponse<UserEducationResponse>> => {
    return apiCall<UserEducationResponse>(API_ENDPOINTS.EDUCATIONS, {
      method: "PUT",
      body: JSON.stringify(education),
    });
  },

  deleteEducation: async (
    school: string,
    startDate: string,
  ): Promise<ApiResponse<void>> => {
    return apiCall<void>(
      `${API_ENDPOINTS.EDUCATIONS}/${encodeURIComponent(school)}/${startDate}`,
      {
        method: "DELETE",
      },
    );
  },

  getExperiences: async (): Promise<ApiResponse<UserExperienceResponse[]>> => {
    return apiCall<UserExperienceResponse[]>(API_ENDPOINTS.EXPERIENCES, {
      method: "GET",
    });
  },

  getExperiencesByUserId: async (userId: string): Promise<ApiResponse<UserExperienceResponse[]>> => {
    return apiCall<UserExperienceResponse[]>(`${API_ENDPOINTS.EXPERIENCES}/${userId}`, {
      method: "GET",
    });
  },

  createExperience: async (
    experience: UserExperiencePayload,
  ): Promise<ApiResponse<UserExperienceResponse>> => {
    return apiCall<UserExperienceResponse>(API_ENDPOINTS.EXPERIENCES, {
      method: "POST",
      body: JSON.stringify(experience),
    });
  },

  upsertExperience: async (
    experience: UserExperiencePayload,
  ): Promise<ApiResponse<UserExperienceResponse>> => {
    return apiCall<UserExperienceResponse>(API_ENDPOINTS.EXPERIENCES, {
      method: "PUT",
      body: JSON.stringify(experience),
    });
  },

  deleteExperience: async (
    company: string,
    startDate: string,
  ): Promise<ApiResponse<void>> => {
    return apiCall<void>(
      `${API_ENDPOINTS.EXPERIENCES}/${encodeURIComponent(company)}/${startDate}`,
      {
        method: "DELETE",
      },
    );
  },

  getPortfolios: async (): Promise<ApiResponse<UserPortfolioResponse[]>> => {
    return apiCall<UserPortfolioResponse[]>(API_ENDPOINTS.PORTFOLIOS, {
      method: "GET",
    });
  },

  getPortfoliosByUserId: async (userId: string): Promise<ApiResponse<UserPortfolioResponse[]>> => {
    return apiCall<UserPortfolioResponse[]>(`${API_ENDPOINTS.PORTFOLIOS}/user/${userId}`, {
      method: "GET",
    });
  },

  createPortfolio: async (
    portfolio: UserPortfolioPayload,
  ): Promise<ApiResponse<UserPortfolioResponse>> => {
    return apiCall<UserPortfolioResponse>(API_ENDPOINTS.PORTFOLIOS, {
      method: "POST",
      body: JSON.stringify(portfolio),
    });
  },

  updatePortfolio: async (
    id: string,
    portfolio: UserPortfolioPayload,
  ): Promise<ApiResponse<UserPortfolioResponse>> => {
    return apiCall<UserPortfolioResponse>(`${API_ENDPOINTS.PORTFOLIOS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(portfolio),
    });
  },

  deletePortfolio: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`${API_ENDPOINTS.PORTFOLIOS}/${id}`, {
      method: "DELETE",
    });
  },

  // Skills
  getSkills: async (): Promise<ApiResponse<{ id: string; user_id: string; skills: string[] | null; created_at: string; updated_at: string }>> => {
    return apiCall<{ id: string; user_id: string; skills: string[] | null; created_at: string; updated_at: string }>(API_ENDPOINTS.SKILLS, {
      method: "GET",
    });
  },

  upsertSkills: async (skills: string[]): Promise<ApiResponse<{ id: string; user_id: string; skills: string[] | null; created_at: string; updated_at: string }>> => {
    return apiCall<{ id: string; user_id: string; skills: string[] | null; created_at: string; updated_at: string }>(API_ENDPOINTS.SKILLS, {
      method: "PUT",
      body: JSON.stringify({ skills }),
    });
  },

  deleteSkills: async (): Promise<ApiResponse<void>> => {
    return apiCall<void>(API_ENDPOINTS.SKILLS, {
      method: "DELETE",
    });
  },

  // Privacy Settings
  getPrivacySettings: async (): Promise<ApiResponse<PrivacySettings>> => {
    return apiCall<PrivacySettings>(API_ENDPOINTS.PRIVACY_SETTINGS, {
      method: "GET",
    });
  },

  getPrivacySettingsByUserId: async (userId: string): Promise<ApiResponse<PrivacySettings>> => {
    return apiCall<PrivacySettings>(`${API_ENDPOINTS.PRIVACY_SETTINGS}/${userId}`, {
      method: "GET",
    });
  },

  updatePrivacySettings: async (
    settings: PrivacySettings,
  ): Promise<ApiResponse<PrivacySettings>> => {
    return apiCall<PrivacySettings>(API_ENDPOINTS.PRIVACY_SETTINGS, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },

  // Saved Jobs
  getSavedJobs: async (): Promise<ApiResponse<SavedJobResponse[]>> => {
    return apiCall<SavedJobResponse[]>(API_ENDPOINTS.SAVED_JOBS, {
      method: "GET",
    });
  },

  saveJob: async (postId: string): Promise<ApiResponse<SavedJobResponse>> => {
    return apiCall<SavedJobResponse>(API_ENDPOINTS.SAVED_JOBS, {
      method: "POST",
      body: JSON.stringify({ post_id: postId }),
    });
  },

  unsaveJob: async (postId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`${API_ENDPOINTS.SAVED_JOBS}/${postId}`, {
      method: "DELETE",
    });
  },

  checkSaved: async (postId: string): Promise<ApiResponse<{ is_saved: boolean }>> => {
    return apiCall<{ is_saved: boolean }>(`${API_ENDPOINTS.SAVED_JOBS}/check/${postId}`, {
      method: "GET",
    });
  },
};

export const companyAPI = {
  getCompany: async (): Promise<ApiResponse<CompanyResponse>> => {
    return apiCall<CompanyResponse>(API_ENDPOINTS.COMPANY, {
      method: "GET",
    });
  },

  getCompanyById: async (companyId: string): Promise<ApiResponse<CompanyResponse>> => {
    const endpoint = API_ENDPOINTS.COMPANY_BY_ID.replace(":company_id", companyId);
    console.log('Calling getCompanyById with endpoint:', endpoint);
    return apiCall<CompanyResponse>(endpoint, {
      method: "GET",
    });
  },

  createCompany: async (
    company: CompanyPayload,
  ): Promise<ApiResponse<CompanyResponse>> => {
    return apiCall<CompanyResponse>(API_ENDPOINTS.COMPANY, {
      method: "POST",
      body: JSON.stringify(company),
    });
  },

  upsertCompany: async (
    company: CompanyPayload,
  ): Promise<ApiResponse<CompanyResponse>> => {
    return apiCall<CompanyResponse>(API_ENDPOINTS.COMPANY, {
      method: "PUT",
      body: JSON.stringify(company),
    });
  },

  updateCompany: async (
    company: Partial<CompanyPayload>,
  ): Promise<ApiResponse<CompanyResponse>> => {
    return apiCall<CompanyResponse>(API_ENDPOINTS.COMPANY, {
      method: "PATCH",
      body: JSON.stringify(company),
    });
  },

  deleteCompany: async (): Promise<ApiResponse<void>> => {
    return apiCall<void>(API_ENDPOINTS.COMPANY, {
      method: "DELETE",
    });
  },

  // Galleries
  createGallery: async (
    companyId: string,
    gallery: CompanyGalleryPayload,
  ): Promise<ApiResponse<CompanyGalleryResponse>> => {
    return apiCall<CompanyGalleryResponse>(
      API_ENDPOINTS.COMPANY_GALLERIES.replace(":company_id", companyId),
      {
        method: "POST",
        body: JSON.stringify(gallery),
      },
    );
  },

  getGalleries: async (
    companyId: string,
  ): Promise<ApiResponse<CompanyGalleryResponse[]>> => {
    return apiCall<CompanyGalleryResponse[]>(
      API_ENDPOINTS.COMPANY_GALLERIES.replace(":company_id", companyId),
      {
        method: "GET",
      },
    );
  },

  getGallery: async (id: string): Promise<ApiResponse<CompanyGalleryResponse>> => {
    return apiCall<CompanyGalleryResponse>(
      API_ENDPOINTS.COMPANY_GALLERY.replace(":id", id),
      {
        method: "GET",
      },
    );
  },

  deleteGallery: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(API_ENDPOINTS.COMPANY_GALLERY.replace(":id", id), {
      method: "DELETE",
    });
  },

  // Posts
  createPost: async (
    companyId: string,
    post: CompanyPostPayload,
  ): Promise<ApiResponse<CompanyPostResponse>> => {
    return apiCall<CompanyPostResponse>(
      API_ENDPOINTS.COMPANY_POSTS.replace(":company_id", companyId),
      {
        method: "POST",
        body: JSON.stringify(post),
      },
    );
  },

  getPosts: async (
    companyId: string,
  ): Promise<ApiResponse<CompanyPostResponse[]>> => {
    return apiCall<CompanyPostResponse[]>(
      API_ENDPOINTS.COMPANY_POSTS.replace(":company_id", companyId),
      {
        method: "GET",
      },
    );
  },

  getPost: async (id: string): Promise<ApiResponse<CompanyPostResponse>> => {
    return apiCall<CompanyPostResponse>(
      API_ENDPOINTS.COMPANY_POST.replace(":id", id),
      {
        method: "GET",
      },
    );
  },

  updatePost: async (
    id: string,
    post: Partial<CompanyPostPayload>,
  ): Promise<ApiResponse<CompanyPostResponse>> => {
    return apiCall<CompanyPostResponse>(
      API_ENDPOINTS.COMPANY_POST.replace(":id", id),
      {
        method: "PUT",
        body: JSON.stringify(post),
      },
    );
  },

  deletePost: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(API_ENDPOINTS.COMPANY_POST.replace(":id", id), {
      method: "DELETE",
    });
  },

  // Get all posts (public endpoint, no auth required)
  getAllPosts: async (): Promise<ApiResponse<CompanyPostResponse[]>> => {
    return apiCall<CompanyPostResponse[]>(API_ENDPOINTS.ALL_POSTS, {
      method: "GET",
    });
  },
};

export const adminAPI = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiCall<DashboardStats>(API_ENDPOINTS.ADMIN_DASHBOARD_STATS, {
      method: "GET",
    });
  },

  getNewUsersToday: async (): Promise<ApiResponse<NewUsersTodayResponse>> => {
    return apiCall<NewUsersTodayResponse>(API_ENDPOINTS.ADMIN_NEW_USERS_TODAY, {
      method: "GET",
    });
  },

  getUsersLast7Days: async (): Promise<ApiResponse<NewUsersTodayResponse>> => {
    return apiCall<NewUsersTodayResponse>(API_ENDPOINTS.ADMIN_USERS_LAST_7_DAYS, {
      method: "GET",
    });
  },

  getSkillsByUserId: async (userId: string): Promise<ApiResponse<{ id: string; user_id: string; skills: string[] | null; created_at: string; updated_at: string }>> => {
    return apiCall<{ id: string; user_id: string; skills: string[] | null; created_at: string; updated_at: string }>(
      API_ENDPOINTS.ADMIN_USER_SKILLS.replace(":id", userId),
      {
        method: "GET",
      }
    );
  },

  getAllCompanies: async (): Promise<ApiResponse<CompanyResponse[]>> => {
    return apiCall<CompanyResponse[]>(API_ENDPOINTS.ADMIN_ALL_COMPANIES, {
      method: "GET",
    });
  },

  approveCompany: async (companyId: string): Promise<ApiResponse<CompanyResponse>> => {
    return apiCall<CompanyResponse>(
      API_ENDPOINTS.ADMIN_APPROVE_COMPANY.replace(":id", companyId),
      {
        method: "POST",
      },
    );
  },

  rejectCompany: async (companyId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(
      API_ENDPOINTS.ADMIN_REJECT_COMPANY.replace(":id", companyId),
      {
        method: "POST",
      },
    );
  },

  banUser: async (userId: string, reason?: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(
      API_ENDPOINTS.ADMIN_BAN_USER.replace(":id", userId),
      {
        method: "POST",
        body: JSON.stringify({ reason: reason || "" }),
      },
    );
  },

  unbanUser: async (userId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(
      API_ENDPOINTS.ADMIN_UNBAN_USER.replace(":id", userId),
      {
        method: "POST",
      },
    );
  },

  banCompany: async (companyId: string, reason?: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(
      API_ENDPOINTS.ADMIN_BAN_COMPANY.replace(":id", companyId),
      {
        method: "POST",
        body: JSON.stringify({ reason: reason || "" }),
      },
    );
  },

  unbanCompany: async (companyId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(
      API_ENDPOINTS.ADMIN_UNBAN_COMPANY.replace(":id", companyId),
      {
        method: "POST",
      },
    );
  },
};

export const systemAPI = {
  healthCheck: async (): Promise<ApiResponse<HealthCheckResponse>> => {
    return apiCall<HealthCheckResponse>(API_ENDPOINTS.HEALTH_CHECK, {
      method: "GET",
    });
  },
};

export const aiAPI = {
  parseResume: async (file: File, provider: string = AI_CONFIG.RESUME_PARSING_PROVIDER): Promise<ParsedResumeData> => {
    const formData = new FormData();
    formData.append("file", file);

    // Direct call to AI Service (Python)
    const url = `${AI_SERVICE_URL}/parse-resume?provider=${provider}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        // Fetch automatically sets Content-Type to multipart/form-data with boundary
      });

      if (!response.ok) {
        let errorMessage = "Failed to parse resume";
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === 'object' && 'error' in errorData) {
            errorMessage = (errorData as any).error;
          }
        } catch (e) {
          // Ignore json parse error
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("AI Parse Resume error:", error);
      throw error;
    }
  },

  matchJobs: async (payload: AIJobMatchRequest, provider: string = AI_CONFIG.JOB_MATCHING_PROVIDER): Promise<AIJobMatchResponse> => {
    // Direct call to AI Service (Python)

    // 💡 วิธีเปลี่ยน AI (How to change AI):
    // ถ้าอยากระบุตัว AI ให้ใส่ชื่อไปในช่อง provider ได้เลยครับ เช่น 'mistral', 'openai', 'gemini'
    // ตัวอย่าง: aiAPI.matchJobs(data, 'mistral')
    // * ถ้าไม่ใส่ (ปล่อยว่าง) ระบบจะใช้ค่าจาก AI_CONFIG (app/lib/ai-config.ts) ครับ

    let url = `${AI_SERVICE_URL}/match-jobs?provider=${provider}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AI Match Jobs error:", error);
      throw error;
    }
  },

  analyzePersonality: async (posts: string[], provider: string = AI_CONFIG.SOCIAL_ANALYSIS_PROVIDER): Promise<any> => {
    const url = `${AI_SERVICE_URL}/analyze-personality?provider=${provider}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: "mock-user", posts }),
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AI Analyze Personality error:", error);
      throw error;
    }
  },

  translate: async (payload: { text: string; target_language: string }, provider: string = "groq"): Promise<{ translated_text: string }> => {
    return aiServiceCall<{ translated_text: string }>("/translate", payload, provider);
  },

  getAiScore: async (userProfile: any): Promise<ApiResponse<AIScoreResponse>> => {
    // Default to 'gemini' as requested
    const url = `${AI_SERVICE_URL}/ai-score?provider=gemini`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ok: true,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("AI Score error:", error);
      throw error;
    }
  },
};

// Storage API Types
export interface UploadResponse {
  url: string;
  message: string;
}

export interface DeleteFileRequest {
  file_path: string;
}

// Storage API Functions
export const storageAPI = {
  /**
   * Upload a file
   * @param file - File to upload
   * @param folder - Optional folder name
   */
  uploadFile: async (
    file: File,
    folder?: string,
  ): Promise<ApiResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.STORAGE_UPLOAD}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  },

  /**
   * Upload profile image
   * @param file - Image file to upload
   */
  uploadProfileImage: async (
    file: File,
  ): Promise<ApiResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE_URL}${API_ENDPOINTS.STORAGE_UPLOAD_PROFILE_IMAGE}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      console.error("Profile image upload error:", error);
      throw error;
    }
  },

  /**
   * Upload cover image
   * @param file - Image file to upload
   */
  uploadCoverImage: async (
    file: File,
  ): Promise<ApiResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE_URL}${API_ENDPOINTS.STORAGE_UPLOAD_COVER_IMAGE}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      console.error("Cover image upload error:", error);
      throw error;
    }
  },

  /**
   * Delete a file
   * @param filePath - Path or URL of the file to delete
   */
  deleteFile: async (
    filePath: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiCall<{ message: string }>(API_ENDPOINTS.STORAGE_DELETE, {
      method: "DELETE",
      body: JSON.stringify({ file_path: filePath }),
    });
  },
};

// Job Application Types
export interface JobApplicationResponse {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationWithUserResponse extends JobApplicationResponse {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_image_url?: string | null;
}

export const jobApplicationAPI = {
  applyForJob: async (jobId: string): Promise<ApiResponse<any>> => {
    return apiCall('/api/user/apply', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId }),
    });
  },

  getJobCandidates: async (jobId: string): Promise<ApiResponse<JobApplicationWithUserResponse[]>> => {
    return apiCall(`/api/user/candidates/${jobId}`, {
      method: 'GET',
    });
  },

  getMyApplications: async (): Promise<ApiResponse<JobApplicationResponse[]>> => {
    return apiCall('/api/user/my-applications', {
      method: 'GET',
    });
  },

  updateApplicationStatus: async (applicationId: string, status: 'pending' | 'accepted' | 'rejected'): Promise<ApiResponse<any>> => {
    return apiCall(`/api/user/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Social Media Analysis Types
export interface SocialConnectionRequest {
  platform: string;
  platform_user_id: string;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  name?: string | null;
  profile_image?: string | null;
}

export interface SocialPostRequest {
  platform_post_id: string;
  content: string;
  posted_at?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
}

export interface SocialAnalysisRequest {
  // social_connection_id is taken from path parameter, not needed here
  big_five_scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  analyzed_posts?: any[] | null;
  strengths?: string[] | null;
  work_style?: string | null;
}

export interface SocialConnectionResponse {
  id: string;
  user_id: string;
  platform: string;
  platform_user_id: string;
  name: string | null;
  profile_image: string | null;
  created_at: string;
}

export interface SocialPostResponse {
  id: string;
  social_connection_id: string;
  platform_post_id: string;
  content: string;
  posted_at: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
}

export interface SocialAnalysisResponse {
  id: string;
  user_id: string;
  social_connection_id: string;
  big_five_scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  analyzed_posts: any[] | null;
  strengths: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SocialDataResponse {
  connection: SocialConnectionResponse;
  posts: SocialPostResponse[];
  analysis: SocialAnalysisResponse | null;
}

// Social API Functions
export const socialAPI = {
  /**
   * Get all social connections for current user
   */
  getConnections: async (): Promise<ApiResponse<SocialConnectionResponse[]>> => {
    return apiCall<SocialConnectionResponse[]>(API_ENDPOINTS.SOCIAL_CONNECTIONS, {
      method: "GET",
    });
  },

  /**
   * Create a new social connection
   */
  createConnection: async (
    data: SocialConnectionRequest,
  ): Promise<ApiResponse<SocialConnectionResponse>> => {
    return apiCall<SocialConnectionResponse>(API_ENDPOINTS.SOCIAL_CONNECTIONS, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Get a specific social connection
   */
  getConnection: async (id: string): Promise<ApiResponse<SocialConnectionResponse>> => {
    const endpoint = API_ENDPOINTS.SOCIAL_CONNECTION.replace(":id", id);
    return apiCall<SocialConnectionResponse>(endpoint, {
      method: "GET",
    });
  },

  /**
   * Delete a social connection
   */
  deleteConnection: async (id: string): Promise<ApiResponse<void>> => {
    const endpoint = API_ENDPOINTS.SOCIAL_CONNECTION.replace(":id", id);
    return apiCall<void>(endpoint, {
      method: "DELETE",
    });
  },

  /**
   * Get posts for a social connection
   */
  getPosts: async (connectionId: string): Promise<ApiResponse<SocialPostResponse[]>> => {
    const endpoint = API_ENDPOINTS.SOCIAL_POSTS.replace(":id", connectionId);
    return apiCall<SocialPostResponse[]>(endpoint, {
      method: "GET",
    });
  },

  /**
   * Create posts for a social connection (batch)
   */
  createPosts: async (
    connectionId: string,
    posts: SocialPostRequest[],
  ): Promise<ApiResponse<SocialPostResponse[]>> => {
    const endpoint = API_ENDPOINTS.SOCIAL_POSTS.replace(":id", connectionId);
    return apiCall<SocialPostResponse[]>(endpoint, {
      method: "POST",
      body: JSON.stringify(posts),
    });
  },

  /**
   * Get analysis for a social connection
   */
  getAnalysis: async (
    connectionId: string,
  ): Promise<ApiResponse<SocialAnalysisResponse>> => {
    const endpoint = API_ENDPOINTS.SOCIAL_ANALYSIS.replace(":id", connectionId);
    return apiCall<SocialAnalysisResponse>(endpoint, {
      method: "GET",
    });
  },

  /**
   * Create or update analysis for a social connection
   */
  createAnalysis: async (
    connectionId: string,
    data: SocialAnalysisRequest,
  ): Promise<ApiResponse<SocialAnalysisResponse>> => {
    const endpoint = API_ENDPOINTS.SOCIAL_ANALYSIS.replace(":id", connectionId);
    return apiCall<SocialAnalysisResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Get all social data (connections + posts + analysis) for current user
   */
  getSocialData: async (): Promise<ApiResponse<SocialDataResponse[]>> => {
    return apiCall<SocialDataResponse[]>(API_ENDPOINTS.SOCIAL_DATA, {
      method: "GET",
    });
  },
};

// User AI Score Types
export interface UserAIScore {
  id: string;
  user_id: string;
  score: number;
  recommended_position: string;
  analysis: string;
  education_score: number | null;
  experience_score: number | null;
  skill_score: number | null;
  level: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveUserAIScoreRequest {
  score: number;
  recommended_position: string;
  analysis: string;
  education_score?: number;
  experience_score?: number;
  skill_score?: number;
  level?: string;
}

// User AI Score API Functions
export const userAIScoreAPI = {
  getAiScore: async (data: any, provider: string = AI_CONFIG.AI_SCORE_PROVIDER): Promise<AIScoreResponse> => {
    return aiServiceCall<AIScoreResponse>(API_ENDPOINTS.AI_SCORE, data, provider);
  },



  saveScore: async (data: SaveUserAIScoreRequest): Promise<ApiResponse<UserAIScore>> => {
    return apiCall<UserAIScore>(API_ENDPOINTS.AI_SCORE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getScore: async (): Promise<ApiResponse<UserAIScore>> => {
    return apiCall<UserAIScore>(API_ENDPOINTS.AI_SCORE, {
      method: "GET",
    });
  },
};

// Environment Check
export const isDevelopment: boolean = process.env.NODE_ENV === "development";
export const isProduction: boolean = process.env.NODE_ENV === "production";

// Utility function to get API info for debugging
export const getApiInfo = () => {
  return {
    baseUrl: API_BASE_URL,
    endpoints: API_ENDPOINTS,
    environment: process.env.NODE_ENV,
    isDevelopment,
    isProduction,
  };
};

// User Job Match Types
export interface UserJobMatchPayload {
  job_id: string;
  match_score: number;
  analysis?: string | null;
}

export interface SaveJobMatchesRequest {
  matches: UserJobMatchPayload[];
}

export interface UserJobMatchResponse extends UserJobMatchPayload {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// User Job Match API Functions
export const userJobMatchAPI = {
  saveJobMatches: async (
    matches: UserJobMatchPayload[],
  ): Promise<ApiResponse<UserJobMatchResponse[]>> => {
    return apiCall<UserJobMatchResponse[]>("/api/user/job-matches", {
      method: "POST",
      body: JSON.stringify({ matches }),
    });
  },

  getJobMatches: async (): Promise<ApiResponse<UserJobMatchResponse[]>> => {
    return apiCall<UserJobMatchResponse[]>("/api/user/job-matches", {
      method: "GET",
    });
  },
};
