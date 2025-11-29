"use client";

import {
  Box,
  Chip,
  ChipProps,
  Container,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
// import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import { alpha } from "@mui/material/styles";
import { type ElementType, useState, useEffect } from "react";
import { useImageUpload } from "../../Components/profile/hooks/useImageUpload";
import ImageCropModal from "../../Components/profile/ImageCropModal";
import { userAPI, companyAPI, storageAPI, type UserProfileResponse, type UserEducationResponse, type UserExperienceResponse, type UserJobPreferenceResponse, type UserAddressResponse } from "../../lib/api";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

type SidebarLink = {
  label: string;
  icon: ElementType;
  badge?: string;
  accent?: ChipProps["color"];
  href: string;
};

import { useOnboarding } from "../../context/OnboardingContext";
import { usePathname, useRouter } from "@/src/navigation";
import { useSearchParams } from "next/navigation";
import { Link } from "@/src/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../../Components/LanguageSwitcher";

const headerGradient = "#4338ca"; // Indigo 700 - Solid Premium Color

export default function OnboardingLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Onboarding");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "personal";
  const { name } = useOnboarding();

  const profileTabs = [
    { label: t("tabs.personal"), value: "personal" },
    { label: t("tabs.experience"), value: "experience" },
    { label: t("tabs.skills"), value: "skills" },
    { label: t("tabs.social"), value: "social" },
    { label: t("tabs.other"), value: "other" },
  ];

  const sidebarLinks: SidebarLink[] = [
    {
      label: t("sidebar.editProfile"),
      icon: PersonOutlineRoundedIcon,
      accent: "success",
      // badge: 'New',
      href: "/onboarding",
    },
    {
      label: t("sidebar.aiScore"),
      icon: AutoAwesomeRoundedIcon,
      // badge: 'New',
      href: "/onboarding/ai-score",
    },
    // {
    //   label: t("sidebar.myResults"),
    //   icon: InsightsRoundedIcon,
    //   href: "/onboarding/results",
    // },
  ];

  // Profile Image State
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [, setCoverImageUrl] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [companyEmail, setCompanyEmail] = useState<string>("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);
  const isCompanyPage = pathname?.startsWith("/onboarding/company");

  // Profile completion data
  const [educations, setEducations] = useState<UserEducationResponse[]>([]);
  const [experiences, setExperiences] = useState<UserExperienceResponse[]>([]);
  const [jobPreference, setJobPreference] = useState<UserJobPreferenceResponse | null>(null);
  const [address, setAddress] = useState<UserAddressResponse | null>(null);

  const {
    cropModalOpen,
    cropImageSrc,
    cropType,
    setCropModalOpen,
    handleProfileImageSelect,
    handleCropComplete,
    error: imageError,
    isUploadingProfile,
  } = useImageUpload(
    profile,
    setProfile,
    setProfileImageUrl,
    setCoverImageUrl
  );

  useEffect(() => {
    if (isCompanyPage) {
      // Fetch company data for company onboarding page
      const fetchCompany = async () => {
        try {
          const response = await companyAPI.getCompany();
          if (response.ok && response.data) {
            setCompanyName(response.data.company_name || "");
            setCompanyEmail(response.data.email || "");
            setCompanyLogoUrl(response.data.logo_url || null);
          }
        } catch (error) {
          console.error("Failed to fetch company", error);
        }
      };
      fetchCompany();
    } else {
      // Fetch user profile and all related data for regular onboarding page
      const fetchAllData = async () => {
        try {
          const [profileRes, educationsRes, experiencesRes, jobPrefRes, addressRes] = await Promise.all([
            userAPI.getProfile(),
            userAPI.getEducations(),
            userAPI.getExperiences(),
            userAPI.getJobPreference(),
            userAPI.getAddress(),
          ]);

          if (profileRes.ok && profileRes.data) {
            setProfile(profileRes.data);
            setProfileImageUrl(profileRes.data.profile_image_url || null);
            setCoverImageUrl(profileRes.data.cover_image_url || null);
            setEmail(profileRes.data.email || "");
          }
          if (educationsRes.ok && educationsRes.data) {
            setEducations(educationsRes.data);
          }
          if (experiencesRes.ok && experiencesRes.data) {
            setExperiences(experiencesRes.data);
          }
          if (jobPrefRes.ok && jobPrefRes.data) {
            setJobPreference(jobPrefRes.data);
          }
          if (addressRes.ok && addressRes.data) {
            setAddress(addressRes.data);
          }
        } catch (error) {
          console.error("Failed to fetch profile data", error);
        }
      };
      fetchAllData();
    }
  }, [isCompanyPage]);

  const handleCompanyLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("alerts.selectImage"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t("alerts.imageSize"));
      return;
    }

    setIsUploadingCompanyLogo(true);
    let currentCompany: any = null;
    let previewUrl: string | null = null;

    try {
      console.log("Uploading company logo...");

      // First, get current company data to ensure we have company_name
      const getCompanyRes = await companyAPI.getCompany();
      if (!getCompanyRes.ok || !getCompanyRes.data) {
        alert(t("alerts.companyNotFound"));
        return;
      }

      currentCompany = getCompanyRes.data;
      if (!currentCompany.company_name) {
        alert(t("alerts.companyNameRequired"));
        return;
      }

      // Show preview immediately after validation
      previewUrl = URL.createObjectURL(file);
      setCompanyLogoUrl(previewUrl);

      const uploadRes = await storageAPI.uploadFile(file, "company-logos");
      console.log("Upload response:", uploadRes);

      if (uploadRes.ok && uploadRes.data?.url) {
        const logoUrl = uploadRes.data.url;
        console.log("Logo URL:", logoUrl);

        // Cleanup preview URL
        URL.revokeObjectURL(previewUrl);

        // Update company logo - include company_name as required by backend
        const updateRes = await companyAPI.updateCompany({
          company_name: currentCompany.company_name,
          logo_url: logoUrl
        });
        console.log("Update company response:", {
          ok: updateRes.ok,
          status: updateRes.status,
          data: updateRes.data,
        });

        if (updateRes.ok && updateRes.data) {
          // Update successful with data - use the actual URL from server
          setCompanyLogoUrl(updateRes.data.logo_url || logoUrl);
        } else if (updateRes.ok) {
          // Update successful but no data returned - use uploaded URL and refresh
          setCompanyLogoUrl(logoUrl);
          const refreshRes = await companyAPI.getCompany();
          if (refreshRes.ok && refreshRes.data) {
            setCompanyLogoUrl(refreshRes.data.logo_url || logoUrl);
            setCompanyName(refreshRes.data.company_name || companyName);
            setCompanyEmail(refreshRes.data.email || companyEmail);
          }
        } else {
          // Revert preview on error
          setCompanyLogoUrl(currentCompany.logo_url || null);
          // Log detailed error for debugging
          console.error("Update company failed:", {
            status: updateRes.status,
            data: updateRes.data,
            ok: updateRes.ok,
          });

          const errorMsg = typeof updateRes.data === 'string'
            ? updateRes.data
            : updateRes.status === 404
              ? t("alerts.companyNotFound")
              : `${t("alerts.updateLogoFailed")} (Status: ${updateRes.status})`;
          alert(errorMsg);
        }
      } else {
        // Cleanup preview URL and revert on error
        URL.revokeObjectURL(previewUrl);
        setCompanyLogoUrl(currentCompany.logo_url || null);
        const errorMsg = uploadRes.data
          ? (typeof uploadRes.data === 'string' ? uploadRes.data : t("alerts.uploadLogoFailed"))
          : `${t("alerts.uploadLogoFailed")} (Status: ${uploadRes.status})`;
        console.error("Upload failed:", errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      // Cleanup preview URL if it was created
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      // Revert to previous logo on error
      setCompanyLogoUrl(currentCompany?.logo_url || null);
      console.error("Error uploading logo:", error);
      const errorMsg = error instanceof Error ? error.message : t("alerts.uploadLogoFailed");
      alert(errorMsg);
    } finally {
      setIsUploadingCompanyLogo(false);
      event.target.value = "";
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    router.push(`${pathname}?tab=${newValue}`);
  };

  // Calculate profile completion score
  const calculateProfileScore = (): number => {
    let score = 0;

    // 1. Profile Image (10%)
    if (profile?.profile_image_url) score += 10;

    // 2. Name (15%) - Thai or English name
    const hasName = (profile?.first_name_th && profile?.last_name_th) ||
      (profile?.first_name_en && profile?.last_name_en);
    if (hasName) score += 15;

    // 3. Contact Info (15%) - Email and Phone
    const hasEmail = profile?.email && profile.email.trim() !== '';
    const hasPhone = profile?.phone && profile.phone.trim() !== '';
    if (hasEmail && hasPhone) score += 15;
    else if (hasEmail || hasPhone) score += 8;

    // 4. Address (10%)
    if (address?.province && address?.district) score += 10;

    // 5. Education (20%) - At least 1 education
    if (educations.length > 0 && educations.some(e => e.school)) score += 20;

    // 6. Experience (15%) - At least 1 experience
    if (experiences.length > 0 && experiences.some(e => e.company || e.position)) score += 15;

    // 7. Job Preference (15%) - Position interested
    if (jobPreference?.position && jobPreference.position.trim() !== '') score += 15;

    return score;
  };

  const profileScore = calculateProfileScore();

  return (
    <Box
      sx={{
        bgcolor: "#f5f6fb",
        minHeight: "100vh",
        pb: { xs: 8, md: 12 },
      }}
    >
      <ImageCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        aspectRatio={cropType === "profile" ? 1 : 16 / 9}
        cropShape={cropType === "profile" ? "round" : "rect"}
        title={cropType === "profile" ? t("imageUpload.cropProfile") : t("imageUpload.cropCover")}
      />
      <Box
        component="header"
        sx={{
          background: headerGradient,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          overflow: "hidden",
          color: "#fff",
          borderBottomLeftRadius: { md: 16, lg: 24 },
          borderBottomRightRadius: { md: 16, lg: 24 },
          pb: { xs: 12, md: 18 },
          pt: { xs: 4, md: 6 },
          boxShadow: "0 16px 60px rgba(64, 112, 255, 0.28)",
          zIndex: 0,
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "70%",
            zIndex: 1,
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            animation: "float 20s linear infinite",
            zIndex: 0,
          },
        }}
      >
        {/* Decorative Elements */}
        <Box
          sx={{
            position: "absolute",
            top: "20%",
            right: "10%",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "30%",
            left: "15%",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "40%",
            right: "25%",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(15px)",
            zIndex: 1,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 3, md: 6 }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            sx={{ mt: { xs: 6, md: 8 } }}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <LanguageSwitcher />
              </Stack>
              <Typography
                sx={{
                  fontSize: { xs: 32, md: 44 },
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {isCompanyPage
                  ? (companyName || t("header.unnamed"))
                  : (name || t("header.unnamed"))}
              </Typography>
              <Typography
                sx={{ fontSize: 18, color: "rgba(255,255,255,0.92)" }}
              >
                {isCompanyPage
                  ? (companyEmail || t("header.noEmail"))
                  : (email || t("header.noEmail"))}
              </Typography>

              {pathname === "/onboarding" && (
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  allowScrollButtonsMobile
                  scrollButtons="auto"
                  TabIndicatorProps={{ sx: { display: "none" } }}
                  sx={{
                    mt: { xs: 4, md: 5 },
                    borderRadius: 2,
                    p: 0.4,
                    bgcolor: alpha("#ffffff", 0.2),
                    "& .MuiTab-root": {
                      textTransform: "none",
                      minHeight: 44,
                      borderRadius: 2,
                      fontWeight: 600,
                      px: { xs: 2.5, md: 3.5 },
                      color: "#ffffff",
                      letterSpacing: 0.2,
                    },
                    "& .Mui-selected": {
                      bgcolor: "#fff",
                      color: "#4c70ff",
                      boxShadow: "0 12px 30px rgba(18, 82, 255, 0.35)",
                      borderRadius: 2,
                    },
                  }}
                >
                  {profileTabs.map((tab) => (
                    <Tab
                      key={tab.value}
                      label={tab.label}
                      value={tab.value}
                      disableRipple
                    />
                  ))}
                </Tabs>
              )}
            </Box>

            {/* <Button
              variant="contained"
              startIcon={<DescriptionOutlinedIcon />}
              sx={{
                alignSelf: { xs: "flex-start", md: "center" },
                borderRadius: 2,
                px: 3.5,
                py: 1.1,
                fontWeight: 600,
                bgcolor: "#29d18f",
                color: "#0b3c3a",
                boxShadow: "0 16px 40px rgba(31, 215, 158, 0.35)",
                "&:hover": { bgcolor: "#1fbe82" },
              }}
            >
              ตัวอย่างโปรไฟล์
            </Button> */}
          </Stack>
        </Container>
      </Box>
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: -4, md: -6 },
          position: "relative",
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
            gap: { xs: 4, md: 5 },
          }}
        >
          <Stack spacing={3} component="aside">
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                bgcolor: "#ffffff",
                border: "1px solid rgba(143, 167, 255, 0.25)",
                boxShadow: "0 24px 60px rgba(73, 92, 136, 0.08)",
              }}
            >
              <Box
                sx={{
                  mx: "auto",
                  width: 176,
                  height: 176,
                  borderRadius: (isCompanyPage ? companyLogoUrl : profileImageUrl) ? "50%" : 2,
                  bgcolor: (isCompanyPage ? companyLogoUrl : profileImageUrl) ? "transparent" : "#f3f6ff",
                  border: (isCompanyPage ? companyLogoUrl : profileImageUrl) ? "none" : "2px dashed rgba(113, 144, 255, 0.45)",
                  display: "grid",
                  placeItems: "center",
                  color: "#6f8dff",
                  mb: 3,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: (isCompanyPage ? companyLogoUrl : profileImageUrl) ? "0 8px 24px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {isCompanyPage ? (
                  companyLogoUrl ? (
                    <Avatar
                      src={companyLogoUrl}
                      sx={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <PhotoCameraRoundedIcon sx={{ fontSize: 42 }} />
                  )
                ) : profileImageUrl ? (
                  <Avatar
                    src={profileImageUrl}
                    sx={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <PhotoCameraRoundedIcon sx={{ fontSize: 42 }} />
                )}

                <Box
                  component="label"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0,0,0,0.3)",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    borderRadius: (isCompanyPage ? companyLogoUrl : profileImageUrl) ? "50%" : 2,
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={isCompanyPage ? handleCompanyLogoSelect : handleProfileImageSelect}
                    disabled={isCompanyPage ? isUploadingCompanyLogo : isUploadingProfile}
                  />
                  {(isCompanyPage ? isUploadingCompanyLogo : isUploadingProfile) ? (
                    <CircularProgress color="inherit" />
                  ) : (
                    <PhotoCamera sx={{ color: "white", fontSize: 32 }} />
                  )}
                </Box>
              </Box>
              {imageError && (
                <Typography color="error" variant="caption" sx={{ display: 'block', textAlign: 'center', mt: -2, mb: 2 }}>
                  {imageError}
                </Typography>
              )}

              <Typography sx={{ fontWeight: 700, color: "#495089" }}>
                {t("profileScore.score")} {profileScore}%
              </Typography>
              <Typography sx={{ color: "#8490b3", fontSize: 14, mt: 1 }}>
                {profileScore >= 100
                  ? t("profileScore.complete")
                  : t("profileScore.incomplete")}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={profileScore}
                sx={{
                  mt: 3,
                  height: 10,
                  borderRadius: 2,
                  bgcolor: "#eef1ff",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 2,
                    bgcolor: profileScore >= 80 ? "#10B981" : profileScore >= 50 ? "#F59E0B" : "#5f75ff",
                    transition: "transform 0.8s ease-out",
                  },
                }}
              />

              {/* <Button
                variant="contained"
                startIcon={<CloudUploadRoundedIcon />}
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  px: 3.2,
                  py: 1,
                  fontWeight: 600,
                  bgcolor: "#4f64ff",
                  color: "#fff",
                  "&:hover": { bgcolor: "#4052f5" },
                }}
              >
                ประเมินคะแนนโปรไฟล์
              </Button> */}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                p: 3,
                bgcolor: "#ffffff",
                boxShadow: "0 24px 60px rgba(73, 92, 136, 0.08)",
                border: "1px solid rgba(143, 167, 255, 0.18)",
              }}
            >
              <Typography sx={{ fontWeight: 700, mb: 2, color: "#454d80" }}>
                {t("sidebar.settingsMenu")}
              </Typography>

              <List
                disablePadding
                sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}
              >
                {sidebarLinks.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{ textDecoration: "none" }}
                    >
                      <ListItemButton
                        selected={active}
                        sx={{
                          borderRadius: 2,
                          px: 2.4,
                          py: 1.6,
                          gap: 2,
                          fontWeight: 600,
                          transition: "background-color 0.2s ease",
                          "& .MuiListItemIcon-root": {
                            color: active ? "#344fff" : "#5968a6",
                          },
                          "& .MuiListItemIcon-root svg": {
                            fontSize: 22,
                          },
                          color: active ? "#24326d" : "#3f4a7d",
                          "&.Mui-selected .MuiListItemIcon-root": {
                            color: "#24326d",
                          },
                          "&.Mui-selected": {
                            bgcolor: "rgba(64, 90, 255, 0.12)",
                            color: "#24326d",
                            "&:hover": {
                              bgcolor: "rgba(64, 90, 255, 0.18)",
                            },
                          },
                          "&:hover": {
                            bgcolor: "rgba(119, 140, 255, 0.1)",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 0 }}>
                          <Icon />
                        </ListItemIcon>
                        <ListItemText
                          primaryTypographyProps={{
                            fontWeight: 600,
                            color: "inherit",
                          }}
                          primary={item.label}
                        />
                        {item.badge ? (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              bgcolor:
                                item.accent === "success"
                                  ? "#228a34"
                                  : "#2752ff",
                              color: "#fff",
                            }}
                          />
                        ) : null}
                      </ListItemButton>
                    </Link>
                  );
                })}
              </List>
            </Paper>
          </Stack>
          <main>{children}</main>
        </Box>
      </Container>
    </Box>
  );
}
