"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import GlassSidebar from "./GlassSidebar";
import ImageCropModal from "./ImageCropModal";
import ProfileCoverSection from "./ProfileCoverSection";
import ProfileAvatarSection from "./ProfileAvatarSection";
import ProfileStatsSection from "./ProfileStatsSection";
import ProfileAboutSection from "./ProfileAboutSection";
import ProfileExperienceSection from "./ProfileExperienceSection";
import ProfileEducationSection from "./ProfileEducationSection";
import ProfileWorksSection from "./ProfileWorksSection";
import ApplicantProfileView from "./ApplicantProfileView";

import { userAPI } from "@/app/lib/api";
import {
  getPrivacySettings,
  getPrivacySettingsByUserId,
  savePrivacySettings,
  PrivacySettings,
} from "@/app/lib/privacy-settings";
import { getProfileLink } from "@/app/lib/profile-utils";
import {
  useEducationItems,
  useExperienceItems,
  useDisplayName,
  useRoleTitle,
  useAboutSummary,
  useContactItems,
  useStats,
} from "@/app/Components/profile/utils/profileUtils";
import ProfileRightSidebar from "./ProfileRightSidebar";
import ProfileTemplateSelector, {
  ProfileTemplate,
} from "@/app/[locale]/profile-modern/components/ProfileTemplateSelector";
import CVTemplateSelector from "./CVTemplateSelector";
import { useUserProfileData } from "./hooks/useUserProfileData";
import { useUserProfileDataByUserId } from "./hooks/useUserProfileDataByUserId";
import { useImageUpload } from "./hooks/useImageUpload";
import { useAboutMe } from "./hooks/useAboutMe";
import { useCVGeneration } from "./hooks/useCVGeneration";

interface UserProfileProps {
  targetUserId?: string;
}

const UserProfile = ({ targetUserId }: UserProfileProps = {}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  // State for applicant view
  const [applicantData, setApplicantData] = useState<any | null>(null);
  const [isApplicantView, setIsApplicantView] = useState(false);

  // Detect current template - always "classic" for this page
  const currentTemplate: ProfileTemplate = "classic";

  // Determine if viewing own profile or another user's profile
  const isOwnProfile = !targetUserId;

  // Get privacy settings for other users' profiles
  const [privacySettings, setPrivacySettings] = React.useState<PrivacySettings | null>(null);

  React.useEffect(() => {
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
    setPortfolioItems,
    profileImageUrl,
    coverImageUrl,
    setProfileImageUrl,
    setCoverImageUrl,
  } = profileData;

  // Check for Applicant View eligibility
  React.useEffect(() => {
    const checkApplicantAccess = async () => {
      // Only check if:
      // 1. Not own profile
      // 2. We have a targetUserId
      // 3. There is an error indicating privacy restriction OR profile not found
      // 4. We haven't already loaded applicant data
      if (!isOwnProfile && targetUserId && error && !applicantData) {
        try {
          // Try to fetch as applicant (Company View)
          const response = await userAPI.getApplicantData(targetUserId);
          if (response.ok && response.data) {
            setApplicantData(response.data);
            setIsApplicantView(true);
          }
        } catch (err) {
          console.log("Not a company user or applicant data not available");
        }
      }
    };

    checkApplicantAccess();
  }, [isOwnProfile, targetUserId, error, applicantData]);

  // If in Applicant View, render that component
  if (isApplicantView && applicantData) {
    return <ApplicantProfileView data={applicantData} />;
  }

  // Save privacy settings when profile is loaded and we have user_id
  React.useEffect(() => {
    // ... rest of the component
    const saveSettings = async () => {
      if (isOwnProfile && profile?.user_id && privacySettings && typeof window !== "undefined") {
        // Save to current user's profile via API
        await savePrivacySettings(privacySettings, profile.user_id);
      }
    };

    saveSettings();
  }, [isOwnProfile, profile?.user_id, privacySettings]);

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
    handleProfileImageSelect,
    handleCoverImageSelect,
    handleCropComplete,
    error: imageError,
  } = isOwnProfile ? imageUploadHook : {
    isUploadingProfile: false,
    isUploadingCover: false,
    cropModalOpen: false,
    cropImageSrc: "",
    cropType: "profile" as const,
    setCropModalOpen: () => { },
    handleProfileImageSelect: () => { },
    handleCoverImageSelect: () => { },
    handleCropComplete: () => { },
    error: null,
  };

  // About me - only enabled for own profile
  const aboutMeHook = useAboutMe();
  const {
    aboutMe,
    isEditingAboutMe,
    aboutMeTemp,
    handleEditAboutMe,
    handleSaveAboutMe,
    handleCancelEditAboutMe,
    setAboutMeTemp,
  } = isOwnProfile ? aboutMeHook : {
    aboutMe: "",
    isEditingAboutMe: false,
    aboutMeTemp: "",
    handleEditAboutMe: () => { },
    handleSaveAboutMe: () => { },
    handleCancelEditAboutMe: () => { },
    setAboutMeTemp: () => { },
  };

  // CV generation - only for own profile
  const cvGenerationHook = useCVGeneration(profile, address, educations, experiences, jobPreference, aboutMe || "");
  const {
    isGeneratingCV,
    cvTemplateDialogOpen,
    setCvTemplateDialogOpen,
    handleDownloadCV,
    handleGenerateCV,
    getCVData,
  } = isOwnProfile ? cvGenerationHook : {
    isGeneratingCV: false,
    cvTemplateDialogOpen: false,
    setCvTemplateDialogOpen: () => { },
    handleDownloadCV: () => { },
    handleGenerateCV: async () => { },
    getCVData: () => null,
  };

  // Computed values - filter based on privacy settings for other users
  const educationItems = useEducationItems(educations);
  const experienceItems = useExperienceItems(experiences);
  const displayName = useDisplayName(profile);
  const contactItems = useContactItems(educationItems, profile, address);

  // Filter jobPreference based on privacy settings
  const filteredJobPreference = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return jobPreference;
    return privacySettings.showJobPreference ? jobPreference : null;
  }, [jobPreference, isOwnProfile, privacySettings]);

  // Use filtered jobPreference for roleTitle, aboutSummary, and stats
  const filteredRoleTitle = useRoleTitle(filteredJobPreference, profile);
  const aboutSummary = useAboutSummary(aboutMe || "", filteredJobPreference, profile);
  const stats = useStats(experienceItems, educationItems, filteredJobPreference);

  // Filter data based on privacy settings when viewing other users' profiles
  const filteredEducationItems = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return educationItems;
    return privacySettings.showEducations ? educationItems : [];
  }, [educationItems, isOwnProfile, privacySettings]);

  const filteredExperienceItems = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return experienceItems;
    return privacySettings.showExperiences ? experienceItems : [];
  }, [experienceItems, isOwnProfile, privacySettings]);

  const filteredPortfolioItems = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return portfolioItems;
    return privacySettings.showPortfolios ? portfolioItems : [];
  }, [portfolioItems, isOwnProfile, privacySettings]);

  const filteredAboutSummary = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return aboutSummary;
    return privacySettings.showAboutMe ? aboutSummary : "";
  }, [aboutSummary, isOwnProfile, privacySettings]);

  const filteredContactItems = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return contactItems;
    // Filter contact items based on privacy settings
    return contactItems.filter((item) => {
      // Check by subtitle which is more reliable
      if (item.subtitle.includes("เบอร์โทร") && !privacySettings.showPhone) return false;
      if (item.subtitle.includes("Email") && !privacySettings.showEmail) return false;
      if (item.subtitle.includes("ที่อยู่") && !privacySettings.showAddress) return false;
      if (item.subtitle.includes("รหัสไปรษณีย์") && !privacySettings.showAddress) return false;
      return true;
    });
  }, [contactItems, isOwnProfile, privacySettings]);

  const filteredProfileImageUrl = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return profileImageUrl;
    return privacySettings.showProfileImage ? profileImageUrl : null;
  }, [profileImageUrl, isOwnProfile, privacySettings]);

  const filteredCoverImageUrl = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return coverImageUrl;
    return privacySettings.showCoverImage ? coverImageUrl : null;
  }, [coverImageUrl, isOwnProfile, privacySettings]);

  const filteredDisplayName = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return displayName;
    return privacySettings.showName ? displayName : "ผู้ใช้";
  }, [displayName, isOwnProfile, privacySettings]);


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePortfolioUpdate = async () => {
    try {
      const response = await userAPI.getPortfolios();
      if (response.ok && response.data) {
        setPortfolioItems(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch portfolios", error);
    }
  };

  const displayError = error || imageError;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Image Crop Modal - only for own profile */}
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

      {/* Sidebar - only show for own profile */}
      {isOwnProfile && <GlassSidebar />}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          pl: { xs: "120px", md: "200px", lg: "340px" },
          transition: "padding-left .25s ease",
        }}
      >
        {/* Page Content */}
        <Box
          sx={{
            backgroundAttachment: "fixed",
            minHeight: "100vh",
            pt: 4,
            pb: 8,
            position: "relative",
            "&::before": {
              content: '""',
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: "300px",
              zIndex: -1,
            },
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr",
                lg: "1fr 320px",
              },
              gap: { xs: 3, md: 3, lg: 4 },
              alignItems: "start",
            }}
          >
            {/* Main Content Column */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gridColumn: { xs: "1 / -1", lg: "1" },
              }}
            >
              {isLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                    width: "100%",
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {displayError && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 3, width: "100%" }}>
                      {displayError}
                    </Alert>
                  )}
                  {/* Cover Photo & Profile Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 100%)",
                      borderRadius: 4,
                      overflow: "hidden",
                      mb: 5,
                      width: "100%",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      boxShadow:
                        "0 12px 40px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.6)",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "1px",
                        background:
                          "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)",
                      },
                    }}
                  >
                    {/* Cover Image - only show if privacy allows */}
                    {(!privacySettings || privacySettings.showCoverImage || isOwnProfile) && (
                      <ProfileCoverSection
                        coverImageUrl={filteredCoverImageUrl}
                        isUploading={isUploadingCover}
                        onImageSelect={isOwnProfile ? handleCoverImageSelect : () => { }}
                        isEditable={isOwnProfile}
                      />
                    )}

                    {/* Profile Info */}
                    <Box sx={{ px: 4, pb: 3, position: "relative" }}>
                      {/* Profile Avatar and Name - Centered */}
                      {(!privacySettings || privacySettings.showProfile || isOwnProfile) && (
                        <ProfileAvatarSection
                          profileImageUrl={filteredProfileImageUrl}
                          displayName={filteredDisplayName}
                          roleTitle={filteredRoleTitle}
                          isUploading={isUploadingProfile}
                          onImageSelect={isOwnProfile ? handleProfileImageSelect : () => { }}
                          isEditable={isOwnProfile}
                        />
                      )}

                      {/* Stats (Left) and Action Buttons (Right) */}
                      <ProfileStatsSection
                        stats={stats}
                        onDownloadCV={isOwnProfile ? handleDownloadCV : undefined}
                        isDownloading={isGeneratingCV}
                      />

                      {/* Tabs */}
                      <Box
                        sx={{
                          mt: 3,
                          borderBottom: "1px solid #374151",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Tabs
                          value={activeTab}
                          onChange={handleTabChange}
                          centered
                          sx={{
                            "& .MuiTab-root": {
                              color: "#6b7280",
                              textTransform: "none",
                              fontSize: "1rem",
                            },
                            "& .Mui-selected": {
                              color: "#6366f1 !important",
                            },
                            "& .MuiTabs-indicator": {
                              backgroundColor: "#6366f1",
                            },
                          }}
                        >
                          <Tab
                            icon={<PersonIcon />}
                            iconPosition="start"
                            label="Profile"
                          />
                          <Tab label="My works" />

                        </Tabs>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Main Content */}
                  {activeTab === 0 && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "minmax(0, 1fr) minmax(0, 1.6fr)",
                        },
                        gap: { xs: 3, md: 4 },
                        width: "100%",
                      }}
                    >
                      {/* Left Sidebar */}
                      <Box>
                        <ProfileAboutSection
                          aboutSummary={filteredAboutSummary}
                          isEditingAboutMe={isOwnProfile ? isEditingAboutMe : false}
                          aboutMeTemp={aboutMeTemp}
                          contactItems={filteredContactItems}
                          onEditClick={isOwnProfile ? handleEditAboutMe : () => { }}
                          onSaveClick={isOwnProfile ? handleSaveAboutMe : () => { }}
                          onCancelClick={isOwnProfile ? handleCancelEditAboutMe : () => { }}
                          onAboutMeChange={isOwnProfile ? setAboutMeTemp : () => { }}
                          isEditable={isOwnProfile}
                        />
                      </Box>

                      {/* Right Content */}
                      <Box>
                        {filteredExperienceItems.length > 0 && (
                          <ProfileExperienceSection experienceItems={filteredExperienceItems} />
                        )}
                        {filteredEducationItems.length > 0 && (
                          <ProfileEducationSection educationItems={filteredEducationItems} />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* My Works Tab Content */}
                  {activeTab === 1 && (
                    <Box sx={{ width: "100%" }}>
                      {filteredPortfolioItems.length > 0 ? (
                        <ProfileWorksSection
                          portfolioItems={filteredPortfolioItems}
                          onPortfolioUpdate={isOwnProfile ? handlePortfolioUpdate : () => { }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            textAlign: "center",
                            py: 8,
                          }}
                        >
                          <Typography variant="h6" sx={{ color: "#9ca3af" }}>
                            {isOwnProfile ? "ยังไม่มีผลงาน" : "ผู้ใช้ไม่ได้เปิดให้ดูผลงาน"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Friends Tab Content */}
                  {activeTab === 2 && (
                    <Box
                      sx={{
                        width: "100%",
                        textAlign: "center",
                        py: 8,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: "#9ca3af" }}>
                        ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้
                      </Typography>
                    </Box>
                  )}

                  {/* Gallery Tab Content */}
                  {activeTab === 3 && (
                    <Box
                      sx={{
                        width: "100%",
                        textAlign: "center",
                        py: 8,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: "#9ca3af" }}>
                        ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Right Sidebar */}
            <Box
              sx={{
                gridColumn: { xs: "1 / -1", md: "1 / -1", lg: "2" },
                display: { xs: "none", md: "block", lg: "block" },
                position: { md: "static", lg: "sticky" },
                top: { lg: "16px" },
                alignSelf: { md: "start", lg: "start" },
                maxWidth: { md: "600px", lg: "none" },
                mx: { md: "auto", lg: 0 },
              }}
            >
              <ProfileRightSidebar
                profileLink={profile?.user_id ? getProfileLink(profile.user_id) : `FYNEX.com/profile/${displayName.replace(/\s+/g, "-").toLowerCase()}`}
                profileLanguage="ไทย"
                profile={profile}
                address={address}
                educations={educations}
                experiences={experiences}
                aboutMe={aboutMe || ""}
                profileImageUrl={profileImageUrl}
                coverImageUrl={coverImageUrl}
                onDownloadCV={isOwnProfile ? handleDownloadCV : () => { }}
                onSelectTemplate={isOwnProfile ? () => setTemplateSelectorOpen(true) : undefined}
                isOwnProfile={isOwnProfile}
              />
            </Box>
          </Container>
        </Box>
      </Box>

      {/* CV Template Selector Dialog - only for own profile */}
      {isOwnProfile && getCVData() && (
        <CVTemplateSelector
          open={cvTemplateDialogOpen}
          onClose={() => setCvTemplateDialogOpen(false)}
          cvData={getCVData()!}
          onGenerate={handleGenerateCV}
          isGenerating={isGeneratingCV}
        />
      )}
      {/* Profile Template Selector Dialog - only for own profile */}
      {isOwnProfile && (
        <ProfileTemplateSelector
          open={templateSelectorOpen}
          onClose={() => setTemplateSelectorOpen(false)}
          currentTemplate={currentTemplate}
        />
      )}
    </Box>
  );
};

export default UserProfile;
