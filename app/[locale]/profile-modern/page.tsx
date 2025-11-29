"use client";

import { useState, useEffect } from "react";
import GlassSidebar from "@/app/Components/profile/GlassSidebar";
import ProfileRightSidebar from "@/app/Components/profile/ProfileRightSidebar";
import ImageCropModal from "@/app/Components/profile/ImageCropModal";
import CVTemplateSelector from "@/app/Components/profile/CVTemplateSelector";
import { useUserProfileData } from "@/app/Components/profile/hooks/useUserProfileData";
import { useUserProfileDataByUserId } from "@/app/Components/profile/hooks/useUserProfileDataByUserId";
import { useAboutMe } from "@/app/Components/profile/hooks/useAboutMe";
import { useImageUpload } from "@/app/Components/profile/hooks/useImageUpload";
import { useCVGeneration } from "@/app/Components/profile/hooks/useCVGeneration";
import { getPrivacySettings, getPrivacySettingsByUserId } from "@/app/lib/privacy-settings";
import type { PrivacySettings } from "@/app/lib/privacy-settings";
import {
  useEducationItems,
  useExperienceItems,
  useDisplayName,
  useRoleTitle,
  useAboutSummary,
} from "@/app/Components/profile/utils/profileUtils";
import type { UserAddressResponse, UserExperienceResponse } from "@/app/lib/api";
import type { ProfileTab } from "@/app/[locale]/profile-modern/types";
import BackgroundShapes from "@/app/[locale]/profile-modern/components/BackgroundShapes";
import CoverSection from "@/app/[locale]/profile-modern/components/CoverSection";
import ProfileHeader from "@/app/[locale]/profile-modern/components/ProfileHeader";
import TabSwitcher from "@/app/[locale]/profile-modern/components/TabSwitcher";
import QuickActionsSection from "@/app/[locale]/profile-modern/components/QuickActionsSection";
import ProfileTemplateSelector from "@/app/[locale]/profile-modern/components/ProfileTemplateSelector";
import type { ProfileTemplate } from "@/app/[locale]/profile-modern/components/ProfileTemplateSelector";
import { getProfileLink } from "@/app/lib/profile-utils";
import IntroSection from "@/app/[locale]/profile-modern/components/IntroSection";
import SkillsSection from "@/app/[locale]/profile-modern/components/SkillsSection";
import HighlightsSection from "@/app/[locale]/profile-modern/components/HighlightsSection";
import WorkHistorySection from "@/app/[locale]/profile-modern/components/WorkHistorySection";
import ContactSection from "@/app/[locale]/profile-modern/components/ContactSection";
import EducationSection from "@/app/[locale]/profile-modern/components/EducationSection";
import MyWorksSection from "@/app/[locale]/profile-modern/components/MyWorksSection";
import ComingSoon from "@/app/[locale]/profile-modern/components/ComingSoon";
import LoadingState from "@/app/[locale]/profile-modern/components/LoadingState";
import ErrorBanner from "@/app/[locale]/profile-modern/components/ErrorBanner";
import Divider from "@/app/[locale]/profile-modern/components/Divider";

const formatLocation = (address?: UserAddressResponse | null) => {
  if (!address) return "ยังไม่ระบุที่อยู่";
  const parts = [address.subdistrict, address.district, address.province].filter(Boolean);
  return parts.length ? parts.join(", ") : "ยังไม่ระบุที่อยู่";
};

const calculateExperienceYears = (records: UserExperienceResponse[]): number => {
  if (!records.length) {
    return 0;
  }
  const starts = records
    .map((record) => new Date(record.start_date).getTime())
    .filter((value) => Number.isFinite(value));
  const ends = records
    .map((record) => new Date(record.end_date ?? record.start_date).getTime())
    .filter((value) => Number.isFinite(value));
  if (!starts.length || !ends.length) {
    return 0;
  }
  const span = Math.max(...ends) - Math.min(...starts);
  return span > 0 ? Math.max(1, Math.round(span / (1000 * 60 * 60 * 24 * 365))) : 0;
};

const buildProfileSlug = (name: string) => {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9ก-๙\s-]/gi, "")
      .replace(/\s+/g, "-") || "me"
  );
};

type SearchParamsPromise = Promise<Record<string, string | string[] | undefined>>;

type ModernProfilePageProps = {
  searchParams?: SearchParamsPromise;
};

export default function ModernProfilePage({ searchParams }: ModernProfilePageProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined);

  // Detect current template - always "modern" for this page
  const currentTemplate: ProfileTemplate = "modern";

  // Resolve search params (supports Promise form from Next types)
  useEffect(() => {
    let cancelled = false;
    const resolveParams = async () => {
      const resolved =
        searchParams && typeof (searchParams as any)?.then === "function"
          ? await searchParams
          : (searchParams as any);
      if (cancelled) return;
      const targetUserIdParam = resolved?.targetUserId;
      const resolvedTargetId = Array.isArray(targetUserIdParam) ? targetUserIdParam[0] : targetUserIdParam;
      setTargetUserId(resolvedTargetId);
    };
    resolveParams();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Determine if viewing own profile or another user's profile
  const isOwnProfile = !targetUserId;

  // Get privacy settings for other users' profiles
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    const loadPrivacySettings = async () => {
      if (!isOwnProfile && targetUserId && typeof window !== "undefined") {
        // Get privacy settings for the profile owner from API
        const ownerSettings = await getPrivacySettingsByUserId(targetUserId);
        setPrivacySettings(ownerSettings);
      } else if (isOwnProfile) {
        // For own profile, use current user's settings from API
        const currentSettings = await getPrivacySettings();
        setPrivacySettings(currentSettings);
      }
    };

    loadPrivacySettings();
  }, [isOwnProfile, targetUserId]);

  // Data fetching - use different hook based on whether viewing own profile or another user's
  const ownProfileData = useUserProfileData();
  const otherProfileData = useUserProfileDataByUserId(targetUserId || "");

  const profileData = isOwnProfile ? ownProfileData : otherProfileData;
  const {
    profile,
    address,
    educations,
    experiences,
    jobPreference,
    portfolioItems,
    isLoading,
    error,
    setProfile,
    profileImageUrl,
    coverImageUrl,
    setProfileImageUrl,
    setCoverImageUrl,
  } = profileData;

  const { aboutMe } = useAboutMe();

  const educationItems = useEducationItems(educations);
  const experienceItems = useExperienceItems(experiences);
  const displayName = useDisplayName(profile);
  const roleTitle = useRoleTitle(jobPreference, profile);
  const aboutSummary = useAboutSummary(aboutMe, jobPreference, profile);
  const location = formatLocation(address);
  const experienceYears = calculateExperienceYears(experiences);
  const currentExperience = experienceItems[0];
  const worksCount = portfolioItems.length;
  const profileLink = profile?.user_id
    ? getProfileLink(profile.user_id)
    : `FYNEX.com/profile/${buildProfileSlug(displayName)}`;

  // Image upload - only enabled for own profile
  const imageUploadHook = useImageUpload(
    profile,
    setProfile,
    setProfileImageUrl,
    setCoverImageUrl,
  );

  // Disable image upload for other users' profiles
  const {
    isUploadingProfile,
    isUploadingCover,
    cropModalOpen,
    cropImageSrc,
    cropType,
    setCropModalOpen,
    handleProfileImageSelect: ownHandleProfileImageSelect,
    handleCoverImageSelect: ownHandleCoverImageSelect,
    handleCropComplete,
    error: imageError,
  } = imageUploadHook;

  const handleProfileImageSelect = isOwnProfile ? ownHandleProfileImageSelect : undefined;
  const handleCoverImageSelect = isOwnProfile ? ownHandleCoverImageSelect : undefined;

  // CV generation - only enabled for own profile
  const cvGenerationHook = useCVGeneration(profile, address, educations, experiences, jobPreference, aboutMe);
  const {
    isGeneratingCV,
    cvTemplateDialogOpen,
    setCvTemplateDialogOpen,
    handleDownloadCV: ownHandleDownloadCV,
    handleGenerateCV,
    getCVData,
  } = cvGenerationHook;

  const handleDownloadCV = ownHandleDownloadCV ?? (() => { });

  const cvData = getCVData();
  // profileLink should already be a full URL from getProfileLink
  const combinedError = [error, imageError].filter(Boolean).join(" • ");

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <BackgroundShapes />
      {isOwnProfile && <GlassSidebar />}
      <div className="pl-[120px] pr-4 sm:pl-[150px] md:pl-[210px] lg:pl-[340px] xl:pl-[360px]">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-10 py-16 lg:flex-row">
          <main className="flex-1">
            <div className="rounded-[36px] border border-slate-100 bg-white p-10 shadow-[0_35px_90px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <LoadingState />
              ) : (
                <>
                  {combinedError && <ErrorBanner message={combinedError} />}
                  {(!privacySettings || privacySettings.showCoverImage || isOwnProfile) && (
                    <CoverSection
                      coverImageUrl={coverImageUrl}
                      displayName={displayName}
                      roleTitle={roleTitle}
                      onChangeCover={handleCoverImageSelect ?? (() => { })}
                      isUploadingCover={isUploadingCover}
                    />
                  )}
                  {(!privacySettings || privacySettings.showProfile || isOwnProfile) && (
                    <ProfileHeader
                      displayName={displayName}
                      roleTitle={roleTitle}
                      profileImageUrl={profileImageUrl}
                      location={location}
                      phone={profile?.phone ?? ""}
                      email={profile?.email ?? ""}
                      onChangeProfile={handleProfileImageSelect ?? (() => { })}
                      isUploadingProfile={isUploadingProfile}
                    />
                  )}
                  <TabSwitcher activeTab={activeTab} onChange={setActiveTab} worksCount={worksCount} />
                  {isOwnProfile && (
                    <QuickActionsSection
                      onDownloadCV={handleDownloadCV}
                      isGenerating={isGeneratingCV}
                      exportDisabled={!cvData}
                    />
                  )}

                  {activeTab === "profile" && (
                    <>
                      <Divider />
                      <IntroSection
                        aboutSummary={aboutSummary}
                        jobPreferenceTitle={jobPreference?.position ?? roleTitle}
                        experienceYears={experienceYears}
                      />
                      <Divider />
                      <SkillsSection />
                      <Divider />
                      <HighlightsSection
                        currentExperience={currentExperience}
                        location={location}
                        jobPreference={jobPreference}
                      />
                      <Divider />
                      <WorkHistorySection experienceItems={experienceItems} />
                      <Divider />
                      <ContactSection
                        phone={profile?.phone ?? ""}
                        email={profile?.email ?? ""}
                        nationality={profile?.nationality ?? ""}
                        location={location}
                      />
                      <Divider />
                      <EducationSection educationItems={educationItems} />
                    </>
                  )}

                  {activeTab === "works" && (
                    <>
                      <Divider />
                      <MyWorksSection portfolioItems={portfolioItems} />
                    </>
                  )}

                  {activeTab === "friends" && (
                    <>
                      <Divider />
                      <ComingSoon copy="เพื่อนของคุณกำลังรอการเชื่อมต่อ" />
                    </>
                  )}

                  {activeTab === "gallery" && (
                    <>
                      <Divider />
                      <ComingSoon copy="แกลเลอรีกำลังอยู่ระหว่างการออกแบบ" />
                    </>
                  )}
                </>
              )}
            </div>
          </main>
          <aside className="hidden w-full max-w-sm flex-none lg:block">
            <ProfileRightSidebar
              profileLink={profileLink}
              profileLanguage="ไทย"
              profile={profile}
              address={address}
              educations={educations}
              experiences={experiences}
              aboutMe={aboutMe}
              profileImageUrl={profileImageUrl ?? null}
              coverImageUrl={coverImageUrl ?? null}
              onDownloadCV={isOwnProfile ? handleDownloadCV : () => { }}
              onSelectTemplate={isOwnProfile ? () => setTemplateSelectorOpen(true) : undefined}
              isOwnProfile={isOwnProfile}
            />
          </aside>
        </div>
      </div>
      {isOwnProfile && cvData && (
        <CVTemplateSelector
          open={cvTemplateDialogOpen}
          onClose={() => setCvTemplateDialogOpen(false)}
          cvData={cvData}
          onGenerate={handleGenerateCV}
          isGenerating={isGeneratingCV}
        />
      )}
      {isOwnProfile && (
        <ProfileTemplateSelector
          open={templateSelectorOpen}
          onClose={() => setTemplateSelectorOpen(false)}
          currentTemplate={currentTemplate}
        />
      )}
      {isOwnProfile && (
        <ImageCropModal
          open={cropModalOpen}
          imageSrc={cropImageSrc}
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
          aspectRatio={cropType === "profile" ? 1 : 16 / 9}
          cropShape={cropType === "profile" ? "round" : "rect"}
          title={cropType === "profile" ? "Crop Profile Image" : "Crop Cover Image"}
        />
      )}
    </div>
  );
}
