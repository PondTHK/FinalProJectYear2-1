import React, { useState } from "react";
import { generateCV, type CVData, type CVTemplate } from "@/app/lib/generateCV";
import type {
  UserProfileResponse,
  UserAddressResponse,
  UserEducationResponse,
  UserExperienceResponse,
  UserJobPreferenceResponse,
} from "@/app/lib/api";

export interface UseCVGenerationReturn {
  isGeneratingCV: boolean;
  cvTemplateDialogOpen: boolean;
  setCvTemplateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDownloadCV: () => void;
  handleGenerateCV: (template: CVTemplate) => Promise<void>;
  getCVData: () => CVData | null;
}

export const useCVGeneration = (
  profile: UserProfileResponse | null,
  address: UserAddressResponse | null,
  educations: UserEducationResponse[],
  experiences: UserExperienceResponse[],
  jobPreference: UserJobPreferenceResponse | null,
  aboutMe: string,
): UseCVGenerationReturn => {
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [cvTemplateDialogOpen, setCvTemplateDialogOpen] = useState(false);

  const handleDownloadCV = () => {
    if (!profile) {
      alert("ไม่พบข้อมูลโปรไฟล์ กรุณาลองอีกครั้ง");
      return;
    }
    setCvTemplateDialogOpen(true);
  };

  const handleGenerateCV = async (template: CVTemplate) => {
    setIsGeneratingCV(true);
    try {
      const savedAboutMe =
        typeof window !== "undefined"
          ? localStorage.getItem("user_about_me")
          : null;

      const cvData: CVData = {
        profile: profile || {},
        address:
          address ||
          ({
            province: null,
            district: null,
            subdistrict: null,
            postal_code: null,
          } as UserAddressResponse),
        educations: educations,
        experiences: experiences,
        jobPreference: jobPreference || { position: null },
        aboutMe: savedAboutMe || aboutMe || null,
      };

      await generateCV(cvData, template);
      setCvTemplateDialogOpen(false);
    } catch (error) {
      console.error("Failed to generate CV:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง CV กรุณาลองอีกครั้ง");
    } finally {
      setIsGeneratingCV(false);
    }
  };

  const getCVData = (): CVData | null => {
    if (!profile) return null;

    const savedAboutMe =
      typeof window !== "undefined"
        ? localStorage.getItem("user_about_me")
        : null;

    return {
      profile: profile,
      address:
        address ||
        ({
          province: null,
          district: null,
          subdistrict: null,
          postal_code: null,
        } as UserAddressResponse),
      educations: educations,
      experiences: experiences,
      jobPreference: jobPreference || { position: null },
      aboutMe: savedAboutMe || aboutMe || null,
    };
  };

  return {
    isGeneratingCV,
    cvTemplateDialogOpen,
    setCvTemplateDialogOpen,
    handleDownloadCV,
    handleGenerateCV,
    getCVData,
  };
};

