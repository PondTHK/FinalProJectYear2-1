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

const isProfileResponse = (data: unknown): data is UserProfileResponse =>
  typeof data === "object" && data !== null && "user_id" in data;

const isAddressResponse = (data: unknown): data is UserAddressResponse =>
  typeof data === "object" && data !== null && "user_id" in data;

const isJobPreferenceResponse = (
  data: unknown,
): data is UserJobPreferenceResponse =>
  typeof data === "object" && data !== null && "position" in data;

export interface UseUserProfileDataReturn {
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

export const useUserProfileData = (): UseUserProfileDataReturn => {
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
        const [
          profileRes,
          addressRes,
          educationRes,
          experienceRes,
          jobPrefRes,
        ] = await Promise.all([
          userAPI.getProfile(),
          userAPI.getAddress(),
          userAPI.getEducations(),
          userAPI.getExperiences(),
          userAPI.getJobPreference(),
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
            if (typeof window !== "undefined") {
              localStorage.setItem("profile_image_url", profileRes.data.profile_image_url);
            }
          } else {
            setProfileImageUrl(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("profile_image_url");
            }
          }
          if (profileRes.data.cover_image_url) {
            setCoverImageUrl(profileRes.data.cover_image_url);
            if (typeof window !== "undefined") {
              localStorage.setItem("cover_image_url", profileRes.data.cover_image_url);
            }
          } else {
            setCoverImageUrl(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("cover_image_url");
            }
          }
        } else if (profileRes.status === 404) {
          // Profile doesn't exist - clear all image URLs
          setProfileImageUrl(null);
          setCoverImageUrl(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("profile_image_url");
            localStorage.removeItem("cover_image_url");
          }
        } else if (profileRes.status !== 404) {
          issues.push(
            typeof profileRes.data === "string"
              ? profileRes.data
              : "ไม่สามารถโหลดข้อมูลส่วนบุคคลได้",
          );
        }

        if (addressRes.ok && isAddressResponse(addressRes.data)) {
          setAddress(addressRes.data);
        } else if (addressRes.status !== 404) {
          issues.push(
            typeof addressRes.data === "string"
              ? addressRes.data
              : "ไม่สามารถโหลดข้อมูลที่อยู่ได้",
          );
        }

        if (educationRes.ok && Array.isArray(educationRes.data)) {
          setEducations(educationRes.data);
        } else if (educationRes.status !== 404) {
          issues.push("ไม่สามารถโหลดข้อมูลการศึกษาได้");
        }

        if (experienceRes.ok && Array.isArray(experienceRes.data)) {
          setExperiences(experienceRes.data);
        } else if (experienceRes.status !== 404) {
          issues.push("ไม่สามารถโหลดข้อมูลประสบการณ์ได้");
        }

        if (jobPrefRes.ok && isJobPreferenceResponse(jobPrefRes.data)) {
          setJobPreference(jobPrefRes.data);
        } else if (jobPrefRes.status !== 404) {
          issues.push(
            typeof jobPrefRes.data === "string"
              ? jobPrefRes.data
              : "ไม่สามารถโหลดข้อมูลตำแหน่งที่สนใจได้",
          );
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

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load portfolio items
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await userAPI.getPortfolios();
        if (response.ok && response.data) {
          setPortfolioItems(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch portfolios", error);
      }
    };

    fetchPortfolios();
  }, []);

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

