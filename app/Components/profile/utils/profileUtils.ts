import React, { useMemo } from "react";
import {
  PhoneIphone as PhoneIphoneIcon,

  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Mail as MailIcon,
} from "@mui/icons-material";
import type {
  UserProfileResponse,
  UserAddressResponse,
  UserEducationResponse,
  UserExperienceResponse,
  UserJobPreferenceResponse,
} from "@/app/lib/api";

export interface EducationItem {
  key: string;
  school: string;
  degree: string;
  major: string;
  period: string;
  description: string;
}

export interface ExperienceItem {
  key: string;
  company: string;
  position: string;
  positionType: string;
  period: string;
  description: string;
}

export interface ContactItem {
  id: string;
  icon: React.ReactNode;
  gradient: string;
  title: string;
  subtitle: string;
}

export interface StatItem {
  label: string;
  value: string;
}

export const useEducationItems = (
  educations: UserEducationResponse[],
): EducationItem[] => {
  return useMemo(() => {
    return [...educations]
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      )
      .map((edu) => ({
        key: `${edu.school}-${edu.start_date}`,
        school: edu.school,
        degree: edu.degree,
        major: edu.major ?? "",
        period: `${edu.start_date} - ${edu.end_date}`,
        description: edu.description,
      }));
  }, [educations]);
};

export const useExperienceItems = (
  experiences: UserExperienceResponse[],
): ExperienceItem[] => {
  return useMemo(() => {
    return [...experiences]
      .sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      )
      .map((exp) => ({
        key: `${exp.company}-${exp.start_date}`,
        company: exp.company,
        position: exp.position,
        positionType: exp.position_type ?? "",
        period: `${exp.start_date} - ${exp.end_date}`,
        description: exp.description,
      }));
  }, [experiences]);
};

export const useDisplayName = (
  profile: UserProfileResponse | null,
): string => {
  return useMemo(() => {
    if (!profile) {
      return "ผู้ใช้งานใหม่";
    }
    const firstName =
      profile.first_name_en || profile.first_name_th || profile.title || "";
    const lastName = profile.last_name_en || profile.last_name_th || "";
    const name = `${firstName} ${lastName}`.trim();
    return name || "ผู้ใช้งานใหม่";
  }, [profile]);
};

export const useRoleTitle = (
  jobPreference: UserJobPreferenceResponse | null,
  profile: UserProfileResponse | null,
): string => {
  return useMemo(() => {
    if (jobPreference?.position) {
      return jobPreference.position;
    }
    if (profile?.title) {
      return profile.title;
    }
    return "Candidate";
  }, [jobPreference, profile]);
};

export const useAboutSummary = (
  aboutMe: string,
  jobPreference: UserJobPreferenceResponse | null,
  profile: UserProfileResponse | null,
): string => {
  return useMemo(() => {
    if (aboutMe && aboutMe.trim()) {
      return aboutMe;
    }
    const parts: string[] = [];
    if (jobPreference?.position) {
      parts.push(`สนใจตำแหน่ง ${jobPreference.position}`);
    }
    if (profile?.nationality) {
      parts.push(`สัญชาติ ${profile.nationality}`);
    }
    if (profile?.phone) {
      parts.push(`ติดต่อเบอร์ ${profile.phone}`);
    }
    if (parts.length === 0) {
      return "ยังไม่มีข้อมูลจากการกรอกแบบฟอร์ม onboarding";
    }
    return parts.join(" • ");
  }, [jobPreference, profile, aboutMe]);
};

export const useContactItems = (
  educationItems: EducationItem[],
  profile: UserProfileResponse | null,
  address: UserAddressResponse | null,
): ContactItem[] => {
  return useMemo(() => {
    const items: ContactItem[] = [];

    if (educationItems[0]) {
      items.push({
        id: "primary-education",
        icon: React.createElement(BusinessIcon, { sx: { color: "#ffffff", fontSize: 20 } }),
        gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        title: educationItems[0].school,
        subtitle: educationItems[0].degree,
      });
    }

    if (profile?.phone) {
      items.push({
        id: "phone",
        icon: React.createElement(PhoneIphoneIcon, { sx: { color: "#ffffff", fontSize: 20 } }),
        gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        title: profile.phone,
        subtitle: "เบอร์โทรศัพท์",
      });
    }

    if (profile?.email) {
      items.push({
        id: "email",
        icon: React.createElement(MailIcon, { sx: { color: "#ffffff", fontSize: 20 } }),
        gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
        title: profile.email,
        subtitle: "Email",
      });
    }

    if (address) {
      const location = [address.subdistrict, address.district, address.province]
        .filter(Boolean)
        .join(", ");
      items.push({
        id: "location",
        icon: React.createElement(LocationIcon, { sx: { color: "#ffffff", fontSize: 20 } }),
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        title: location || "ยังไม่ระบุพื้นที่",
        subtitle: address.postal_code
          ? `รหัสไปรษณีย์ ${address.postal_code}`
          : "ที่อยู่",
      });
    }

    return items;
  }, [educationItems, profile, address]);
};

export const useStats = (
  experienceItems: ExperienceItem[],
  educationItems: EducationItem[],
  jobPreference: UserJobPreferenceResponse | null,
): StatItem[] => {
  return useMemo(
    () => [
      { label: "ประสบการณ์", value: `${experienceItems.length}` },
      { label: "การศึกษา", value: `${educationItems.length}` },
      // {
      //   label: "ตำแหน่งที่สนใจ",
      //   value: jobPreference?.position ?? "—",
      // },
    ],
    [educationItems.length, experienceItems.length, jobPreference?.position],
  );
};

