import React, { useEffect, useState } from "react";
import {
  userAPI,
  type UserProfileResponse,
  type UserAddressResponse,
  type UserEducationResponse,
  type UserExperienceResponse,
  type UserJobPreferenceResponse,
  type UserPortfolioResponse,
} from "@/app/lib/api";
import { getPrivacySettingsByUserId } from "@/app/lib/privacy-settings";

const isProfileResponse = (data: unknown): data is UserProfileResponse =>
  typeof data === "object" && data !== null && "user_id" in data;

const isAddressResponse = (data: unknown): data is UserAddressResponse =>
  typeof data === "object" && data !== null && "user_id" in data;

const isJobPreferenceResponse = (
  data: unknown,
): data is UserJobPreferenceResponse =>
  typeof data === "object" && data !== null && "position" in data;

export interface UseUserProfileDataByUserIdReturn {
  profile: UserProfileResponse | null;
  address: UserAddressResponse | null;
  educations: UserEducationResponse[];
  experiences: UserExperienceResponse[];
  jobPreference: UserJobPreferenceResponse | null;
  portfolioItems: UserPortfolioResponse[];
  isLoading: boolean;
  error: string | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileResponse | null>>;
  setPortfolioItems: React.Dispatch<React.SetStateAction<UserPortfolioResponse[]>>;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  setProfileImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setCoverImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useUserProfileDataByUserId = (userId: string): UseUserProfileDataByUserIdReturn => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [address, setAddress] = useState<UserAddressResponse | null>(null);
  const [educations, setEducations] = useState<UserEducationResponse[]>([]);
  const [experiences, setExperiences] = useState<UserExperienceResponse[]>([]);
  const [jobPreference, setJobPreference] =
    useState<UserJobPreferenceResponse | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<UserPortfolioResponse[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Check privacy settings first before fetching profile
        let privacySettings;
        try {
          privacySettings = await getPrivacySettingsByUserId(userId);
          // If show_profile is false, don't fetch profile and show appropriate message
          if (privacySettings && !privacySettings.showProfile) {
            if (!isMounted) return;
            setError("โปรไฟล์นี้ไม่เปิดให้ดู");
            setIsLoading(false);
            return;
          }
        } catch (err) {
          // If we can't fetch privacy settings, proceed with fetching profile
          // (will show "ไม่พบโปรไฟล์" if profile doesn't exist)
          console.warn("Failed to fetch privacy settings, proceeding with profile fetch:", err);
        }

        // Fetch all data by userId in parallel
        const [
          profileRes,
          addressRes,
          educationRes,
          experienceRes,
          jobPrefRes,
          portfolioRes,
        ] = await Promise.all([
          userAPI.getProfileByUserId(userId),
          userAPI.getAddressByUserId(userId).catch(() => ({ ok: false, status: 404, data: null })),
          userAPI.getEducationsByUserId(userId).catch(() => ({ ok: false, status: 404, data: [] })),
          userAPI.getExperiencesByUserId(userId).catch(() => ({ ok: false, status: 404, data: [] })),
          userAPI.getJobPreferenceByUserId(userId).catch(() => ({ ok: false, status: 404, data: null })),
          userAPI.getPortfoliosByUserId(userId).catch(() => ({ ok: false, status: 404, data: [] })),
        ]);

        if (!isMounted) {
          return;
        }

        const issues: string[] = [];

        if (profileRes.ok && isProfileResponse(profileRes.data)) {
          setProfile(profileRes.data);
          // Load image URLs from backend profile
          if (profileRes.data.profile_image_url) {
            setProfileImageUrl(profileRes.data.profile_image_url);
          } else {
            setProfileImageUrl(null);
          }
          if (profileRes.data.cover_image_url) {
            setCoverImageUrl(profileRes.data.cover_image_url);
          } else {
            setCoverImageUrl(null);
          }
        } else if (profileRes.status === 404) {
          // If we got 404, check if it's because of privacy settings or profile doesn't exist
          // Since we already checked privacy settings above, this is likely a real "not found"
          setError("ไม่พบโปรไฟล์");
        } else if (profileRes.status !== 404) {
          issues.push(
            typeof profileRes.data === "string"
              ? profileRes.data
              : "ไม่สามารถโหลดข้อมูลส่วนบุคคลได้",
          );
        }

        // Load address
        if (addressRes.ok && isAddressResponse(addressRes.data)) {
          setAddress(addressRes.data);
        } else if (addressRes.status !== 404) {
          issues.push("ไม่สามารถโหลดข้อมูลที่อยู่ได้");
        }

        // Load educations
        if (educationRes.ok && Array.isArray(educationRes.data)) {
          setEducations(educationRes.data);
        } else if (educationRes.status !== 404) {
          issues.push("ไม่สามารถโหลดข้อมูลการศึกษาได้");
        }

        // Load experiences
        if (experienceRes.ok && Array.isArray(experienceRes.data)) {
          setExperiences(experienceRes.data);
        } else if (experienceRes.status !== 404) {
          issues.push("ไม่สามารถโหลดข้อมูลประสบการณ์ได้");
        }

        // Load job preference
        if (jobPrefRes.ok && isJobPreferenceResponse(jobPrefRes.data)) {
          setJobPreference(jobPrefRes.data);
        } else if (jobPrefRes.status !== 404) {
          issues.push("ไม่สามารถโหลดข้อมูลตำแหน่งที่สนใจได้");
        }

        // Load portfolios
        if (portfolioRes.ok && Array.isArray(portfolioRes.data)) {
          setPortfolioItems(portfolioRes.data);
        } else if (portfolioRes.status !== 404) {
          issues.push("ไม่สามารถโหลดข้อมูลผลงานได้");
        }

        setError(issues.length ? issues.join(" • ") : null);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (userId) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);


  return {
    profile,
    address,
    educations,
    experiences,
    jobPreference,
    portfolioItems,
    isLoading,
    error,
    setProfile,
    setPortfolioItems,
    profileImageUrl,
    coverImageUrl,
    setProfileImageUrl,
    setCoverImageUrl,
  };
};

