/**
 * Privacy Settings for Public Profile
 * Controls what information is visible to other users
 */

export interface PrivacySettings {
  // Profile visibility
  showProfile: boolean;
  showProfileImage: boolean;
  showCoverImage: boolean;
  showName: boolean;
  showTitle: boolean;

  // Contact information
  showPhone: boolean;
  showLineId: boolean;
  showEmail: boolean;

  // Personal information
  showGender: boolean;
  showBirthDate: boolean;
  showNationality: boolean;
  showReligion: boolean;
  showMilitaryStatus: boolean;
  showAddress: boolean;

  // Professional information
  showExperiences: boolean;
  showEducations: boolean;
  showJobPreference: boolean;
  showPortfolios: boolean;
  showSkills: boolean;

  // About me
  showAboutMe: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showProfile: true,
  showProfileImage: true,
  showCoverImage: true,
  showName: true,
  showTitle: true,
  showPhone: false,
  showLineId: false,
  showEmail: false,
  showGender: false,
  showBirthDate: false,
  showNationality: true,
  showReligion: false,
  showMilitaryStatus: false,
  showAddress: true,
  showExperiences: true,
  showEducations: true,
  showJobPreference: true,
  showPortfolios: true,
  showSkills: true,
  showAboutMe: true,
};

const PRIVACY_SETTINGS_KEY = "user_privacy_settings";
const PRIVACY_SETTINGS_BY_USER_KEY = "user_privacy_settings_by_user";

/** 
 * Convert backend response (snake_case) to frontend format (camelCase)
 */
function convertBackendToFrontend(backendData: any): PrivacySettings {
  const frontendData: any = {};

  // Mapping between snake_case and camelCase
  const fieldMapping: Record<string, keyof PrivacySettings> = {
    show_profile: 'showProfile',
    show_profile_image: 'showProfileImage',
    show_cover_image: 'showCoverImage',
    show_name: 'showName',
    show_title: 'showTitle',
    show_phone: 'showPhone',
    show_line_id: 'showLineId',
    show_email: 'showEmail',
    show_gender: 'showGender',
    show_birth_date: 'showBirthDate',
    show_nationality: 'showNationality',
    show_religion: 'showReligion',
    show_military_status: 'showMilitaryStatus',
    show_address: 'showAddress',
    show_experiences: 'showExperiences',
    show_educations: 'showEducations',
    show_job_preference: 'showJobPreference',
    show_portfolios: 'showPortfolios',
    show_skills: 'showSkills',
    show_about_me: 'showAboutMe',
  };

  // Convert each field
  for (const [snakeKey, camelKey] of Object.entries(fieldMapping)) {
    if (backendData[snakeKey] !== undefined) {
      frontendData[camelKey] = backendData[snakeKey];
    } else if (backendData[camelKey] !== undefined) {
      // Already in camelCase (from localStorage)
      frontendData[camelKey] = backendData[camelKey];
    }
  }

  return { ...DEFAULT_PRIVACY_SETTINGS, ...frontendData };
}

/**
 * Get privacy settings from API (fallback to localStorage for backward compatibility)
 */
export async function getPrivacySettings(): Promise<PrivacySettings> {
  if (typeof window === "undefined") {
    return DEFAULT_PRIVACY_SETTINGS;
  }

  try {
    // Try to get from API first
    const { userAPI } = await import("@/app/lib/api");
    const response = await userAPI.getPrivacySettings();
    if (response.ok && response.data) {
      // Convert backend format (snake_case) to frontend format (camelCase)
      const apiSettings = convertBackendToFrontend(response.data);
      // Also update localStorage cache
      try {
        localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(apiSettings));
      } catch (e) {
        console.warn("Failed to update localStorage cache:", e);
      }
      return apiSettings;
    } else if (response.status === 404) {
      // If no settings found in API, return defaults
      console.info("No privacy settings found in API, using defaults");
      return DEFAULT_PRIVACY_SETTINGS;
    }
  } catch (error) {
    console.warn("Failed to fetch privacy settings from API, falling back to localStorage:", error);
  }

  // Fallback to localStorage for backward compatibility
  try {
    const stored = localStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert if needed (might be in snake_case from old cache)
      const converted = convertBackendToFrontend(parsed);
      return { ...DEFAULT_PRIVACY_SETTINGS, ...converted };
    }
  } catch (error) {
    console.error("Error loading privacy settings from localStorage:", error);
  }

  return DEFAULT_PRIVACY_SETTINGS;
}

/**
 * Get privacy settings for a specific user (for viewing other users' profiles)
 * Fetches from API instead of localStorage
 */
export async function getPrivacySettingsByUserId(userId: string): Promise<PrivacySettings> {
  if (typeof window === "undefined") {
    return DEFAULT_PRIVACY_SETTINGS;
  }

  try {
    // Fetch from API
    const { userAPI } = await import("@/app/lib/api");
    const response = await userAPI.getPrivacySettingsByUserId(userId);
    if (response.ok && response.data) {
      // Convert backend format (snake_case) to frontend format (camelCase)
      return convertBackendToFrontend(response.data);
    }
  } catch (error) {
    console.warn("Failed to fetch privacy settings from API, falling back to localStorage:", error);
  }

  // Fallback to localStorage for backward compatibility
  try {
    const stored = localStorage.getItem(`${PRIVACY_SETTINGS_BY_USER_KEY}_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert if needed (might be in snake_case from old cache)
      const converted = convertBackendToFrontend(parsed);
      return { ...DEFAULT_PRIVACY_SETTINGS, ...converted };
    }
  } catch (error) {
    console.error("Error loading privacy settings for user from localStorage:", error);
  }

  // Default: return all public if not found
  return DEFAULT_PRIVACY_SETTINGS;
}

/**
 * Save privacy settings to API (fallback to localStorage)
 */
export async function savePrivacySettings(settings: PrivacySettings, userId?: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // Try to save to API first
    const { userAPI } = await import("@/app/lib/api");
    const response = await userAPI.updatePrivacySettings(settings);
    if (response.ok && response.data) {
      // Convert backend response (snake_case) to frontend format (camelCase) before saving to localStorage
      const savedSettings = convertBackendToFrontend(response.data);
      localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(savedSettings));

      // Also save to user-specific key if userId is provided
      if (userId) {
        localStorage.setItem(`${PRIVACY_SETTINGS_BY_USER_KEY}_${userId}`, JSON.stringify(savedSettings));
      } else {
        // Try to get userId from current profile
        const currentProfile = localStorage.getItem("current_user_profile");
        if (currentProfile) {
          try {
            const profile = JSON.parse(currentProfile);
            if (profile.user_id) {
              localStorage.setItem(`${PRIVACY_SETTINGS_BY_USER_KEY}_${profile.user_id}`, JSON.stringify(savedSettings));
            }
          } catch (e) {
            console.error("Error saving privacy settings to user profile:", e);
          }
        }
      }
      return;
    } else {
      // API call failed - throw error so caller can handle it
      throw new Error(response.data && typeof response.data === "string"
        ? response.data
        : "Failed to save privacy settings to server");
    }
  } catch (error) {
    console.error("Failed to save privacy settings to API:", error);
    // Fallback to localStorage for backward compatibility
    try {
      if (userId) {
        localStorage.setItem(`${PRIVACY_SETTINGS_BY_USER_KEY}_${userId}`, JSON.stringify(settings));
      } else {
        localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));

        const currentProfile = localStorage.getItem("current_user_profile");
        if (currentProfile) {
          try {
            const profile = JSON.parse(currentProfile);
            if (profile.user_id) {
              localStorage.setItem(`${PRIVACY_SETTINGS_BY_USER_KEY}_${profile.user_id}`, JSON.stringify(settings));
            }
          } catch (e) {
            console.error("Error saving privacy settings to user profile:", e);
          }
        }
      }
    } catch (localError) {
      console.error("Error saving privacy settings to localStorage:", localError);
    }
    // Re-throw the error so caller knows it failed
    throw error;
  }
}

/**
 * Reset privacy settings to defaults
 */
export function resetPrivacySettings(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(PRIVACY_SETTINGS_KEY);

  // Also remove from current user's profile
  const currentProfile = localStorage.getItem("current_user_profile");
  if (currentProfile) {
    try {
      const profile = JSON.parse(currentProfile);
      if (profile.user_id) {
        localStorage.removeItem(`${PRIVACY_SETTINGS_BY_USER_KEY}_${profile.user_id}`);
      }
    } catch (e) {
      // Ignore errors
    }
  }
}

/**
 * Check if a specific field should be visible based on privacy settings
 */
export function shouldShowField(
  settings: PrivacySettings,
  field: keyof PrivacySettings
): boolean {
  return settings[field] ?? false;
}

/**
 * Filter profile data based on privacy settings
 */
export function filterProfileByPrivacy<T extends { user_id?: string }>(
  data: T | null,
  settings: PrivacySettings
): Partial<T> | null {
  if (!data || !settings.showProfile) {
    return null;
  }

  const filtered: Partial<T> = { ...data };

  // Filter based on privacy settings
  // This is a basic implementation - you may need to customize based on your data structure
  return filtered;
}
