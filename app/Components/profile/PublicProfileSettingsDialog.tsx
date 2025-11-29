"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Avatar,
  Button,
  Stack,
} from "@mui/material";
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import type {
  UserProfileResponse,
  UserAddressResponse,
  UserEducationResponse,
  UserExperienceResponse,
} from "@/app/lib/api";
import {
  getPrivacySettings,
  savePrivacySettings,
  resetPrivacySettings,
  type PrivacySettings,
  DEFAULT_PRIVACY_SETTINGS,
} from "@/app/lib/privacy-settings";

interface PublicProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfileResponse | null;
  address: UserAddressResponse | null;
  educations: UserEducationResponse[];
  experiences: UserExperienceResponse[];
  aboutMe: string;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
}

const PublicProfileSettingsDialog: React.FC<
  PublicProfileSettingsDialogProps
> = ({
  open,
  onClose,
  profile,
  address,
  educations,
  experiences,
  aboutMe,
  profileImageUrl,
  coverImageUrl,
}) => {
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(
      DEFAULT_PRIVACY_SETTINGS,
    );

    // Load privacy settings from API
    useEffect(() => {
      const loadSettings = async () => {
        if (open && typeof window !== "undefined") {
          const settings = await getPrivacySettings();
          setPrivacySettings(settings);
        }
      };

      loadSettings();
    }, [open]);

    // Handle toggle for privacy settings
    const handleToggle = (field: keyof PrivacySettings) => {
      setPrivacySettings((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    };

    // Save settings
    const handleSave = async () => {
      try {
        // Save with user_id if available
        const userId = profile?.user_id;
        await savePrivacySettings(privacySettings, userId);
        // Reload settings from API to ensure sync
        const reloadedSettings = await getPrivacySettings();
        setPrivacySettings(reloadedSettings);
      } catch (error) {
        console.error("Failed to save privacy settings:", error);
        // Show error message to user
        alert("ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }
      onClose();
    };

    // Reset to defaults
    const handleReset = () => {
      setPrivacySettings(DEFAULT_PRIVACY_SETTINGS);
      resetPrivacySettings();
    };

    const displayName = profile
      ? `${profile.first_name_en || profile.first_name_th || ""} ${profile.last_name_en || profile.last_name_th || ""
        }`.trim() || "ผู้ใช้งานใหม่"
      : "ผู้ใช้งานใหม่";

    const headline = profile?.title || "";

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            fontWeight: 700,
          }}
        >
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
            ตั้งค่าโปรไฟล์สาธารณะ
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "#6b7280",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.04)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", height: "calc(90vh - 80px)" }}>
            {/* Left Column - Preview */}
            <Box
              sx={{
                flex: 1,
                borderRight: "1px solid #e5e7eb",
                overflowY: "auto",
                bgcolor: "#f9fafb",
                p: 3,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  mb: 3,
                  fontSize: "0.875rem",
                }}
              >
                คุณควบคุมโปรไฟล์ของคุณและสามารถจำกัดสิ่งที่อาจแสดงในเครื่องมือค้นหาและบริการอื่นๆ
                ผู้ที่ไม่ได้ลงชื่อเข้าใช้ FYNEX
                อาจเห็นโปรไฟล์บางส่วนหรือทั้งหมดตามที่แสดงด้านล่าง
              </Typography>

              {/* Preview Card */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: "white",
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Cover Image */}
                {privacySettings.showCoverImage && coverImageUrl && (
                  <Box
                    sx={{
                      width: "100%",
                      height: 200,
                      bgcolor: "#6366f1",
                      backgroundImage: coverImageUrl
                        ? `url(${coverImageUrl})`
                        : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                )}

                {/* Profile Header */}
                <Box sx={{ p: 3, pb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      mb: 2,
                      mt: privacySettings.showCoverImage && coverImageUrl ? -8 : 0,
                    }}
                  >
                    {privacySettings.showProfileImage && (
                      <Avatar
                        src={profileImageUrl ?? ""}
                        sx={{
                          width: 120,
                          height: 120,
                          border: "4px solid white",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1, mt: privacySettings.showCoverImage && coverImageUrl ? 8 : 0 }}>
                      {privacySettings.showName && (
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          {displayName}
                        </Typography>
                      )}
                      {privacySettings.showTitle && headline && (
                        <Typography
                          variant="body2"
                          sx={{ color: "#6b7280", mb: 1.5 }}
                        >
                          {headline}
                        </Typography>
                      )}
                      {(privacySettings.showPhone || privacySettings.showAddress) && (
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1.5,
                            mt: 1,
                          }}
                        >
                          {privacySettings.showAddress && address && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "#6b7280",
                              }}
                            >
                              <LocationOnIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption">
                                {[
                                  address.subdistrict,
                                  address.district,
                                  address.province,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </Typography>
                            </Box>
                          )}
                          {privacySettings.showPhone && profile?.phone && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "#6b7280",
                              }}
                            >
                              <PhoneIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption">
                                {profile.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Divider />

                {/* About Section */}
                {privacySettings.showAboutMe && aboutMe && (
                  <>
                    <Box sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 1.5 }}
                      >
                        About
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#4b5563", whiteSpace: "pre-wrap" }}
                      >
                        {aboutMe}
                      </Typography>
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Experience Section */}
                {privacySettings.showExperiences && experiences.length > 0 && (
                  <>
                    <Box sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2 }}
                      >
                        Experience
                      </Typography>
                      {experiences.map((exp, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: index < experiences.length - 1 ? 2.5 : 0,
                            pb:
                              index < experiences.length - 1 ? 2.5 : 0,
                            borderBottom:
                              index < experiences.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1.5,
                            }}
                          >
                            <WorkIcon
                              sx={{
                                color: "#6366f1",
                                fontSize: 20,
                                mt: 0.5,
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, mb: 0.25 }}
                              >
                                {exp.position}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "#6b7280", mb: 0.25 }}
                              >
                                {exp.company}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#9ca3af" }}
                              >
                                {exp.start_date} - {exp.end_date}
                                {exp.position_type &&
                                  ` • ${exp.position_type}`}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Education Section */}
                {privacySettings.showEducations && educations.length > 0 && (
                  <Box sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 2 }}
                    >
                      Education
                    </Typography>
                    {educations.map((edu, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: index < educations.length - 1 ? 2.5 : 0,
                          pb:
                            index < educations.length - 1 ? 2.5 : 0,
                          borderBottom:
                            index < educations.length - 1
                              ? "1px solid #e5e7eb"
                              : "none",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                          }}
                        >
                          <SchoolIcon
                            sx={{
                              color: "#6366f1",
                              fontSize: 20,
                              mt: 0.5,
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600, mb: 0.25 }}
                            >
                              {edu.school}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#6b7280", mb: 0.25 }}
                            >
                              {edu.degree}
                              {edu.major && ` • ${edu.major}`}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#9ca3af" }}
                            >
                              {edu.start_date} - {edu.end_date}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Right Column - Settings */}
            <Box
              sx={{
                width: 400,
                overflowY: "auto",
                p: 3,
                bgcolor: "#fafbfc",
              }}
            >
              {/* Public Profile Toggle */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={privacySettings.showProfile}
                      onChange={() => handleToggle("showProfile")}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        โปรไฟล์สาธารณะของคุณ
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", display: "block" }}
                      >
                        {privacySettings.showProfile
                          ? "เปิดใช้งาน - โปรไฟล์ของคุณสามารถเข้าถึงได้โดยสาธารณะ"
                          : "ปิดใช้งาน - โปรไฟล์ของคุณจะไม่แสดงในสาธารณะ"}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Basic Info (Always Visible) */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, mb: 1.5, color: "#ef4444" }}
                >
                  Basic (จำเป็น)
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: "#fef2f2",
                    border: "1px solid #fee2e2",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                    ชื่อ, จำนวนเพื่อน, จำนวนผู้ติดตาม, และภูมิภาค
                  </Typography>
                </Paper>
                <Typography
                  variant="caption"
                  sx={{ color: "#6b7280", mt: 1, display: "block" }}
                >
                  ข้อมูลนี้จำเป็นต้องแสดงในโปรไฟล์สาธารณะ
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Profile Photo Visibility */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, mb: 1.5 }}
                >
                  รูปภาพโปรไฟล์
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={privacySettings.showProfileImage}
                      onChange={() => handleToggle("showProfileImage")}
                      color="primary"
                      disabled={!privacySettings.showProfile}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                      {privacySettings.showProfileImage ? "แสดง" : "ซ่อน"}
                    </Typography>
                  }
                />
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Individual Section Toggles */}
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, mb: 2 }}
              >
                การตั้งค่าความเป็นส่วนตัว
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  mb: 2.5,
                  fontSize: "0.875rem",
                }}
              >
                คุณสามารถกำหนดขีดจำกัดว่าส่วนไหนของโปรไฟล์ที่แสดงต่อผู้ที่ไม่ได้ลงชื่อเข้าใช้
                FYNEX
              </Typography>

              <Stack spacing={2}>
                {/* Profile Image */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showCoverImage}
                        onChange={() => handleToggle("showCoverImage")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      >
                        รูปปก
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Name */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showName}
                        onChange={() => handleToggle("showName")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      >
                        ชื่อ
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Title */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showTitle}
                        onChange={() => handleToggle("showTitle")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      >
                        ตำแหน่งงาน
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* About */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showAboutMe}
                        onChange={() => handleToggle("showAboutMe")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          About
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Experience */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showExperiences}
                        onChange={() => handleToggle("showExperiences")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          Experience
                        </Typography>
                        {experiences.length > 0 && (
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280" }}
                          >
                            รวมถึงรายละเอียดประสบการณ์
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Education */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showEducations}
                        onChange={() => handleToggle("showEducations")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          Education
                        </Typography>
                        {educations.length > 0 && (
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280" }}
                          >
                            รวมถึงรายละเอียดการศึกษา
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Phone */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showPhone}
                        onChange={() => handleToggle("showPhone")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      >
                        เบอร์โทรศัพท์
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Address */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showAddress}
                        onChange={() => handleToggle("showAddress")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      >
                        ที่อยู่
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Email */}
                {profile?.email && (
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.showEmail}
                          onChange={() => handleToggle("showEmail")}
                          color="primary"
                          disabled={!privacySettings.showProfile}
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                        >
                          Email
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                )}

                {/* Job Preference */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showJobPreference}
                        onChange={() => handleToggle("showJobPreference")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      >
                        ตำแหน่งที่สนใจ
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>

                {/* Portfolios */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showPortfolios}
                        onChange={() => handleToggle("showPortfolios")}
                        color="primary"
                        disabled={!privacySettings.showProfile}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                      >
                        ผลงาน (My Works)
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>
              </Stack>
            </Box>
          </Box>
        </DialogContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button onClick={handleReset} color="error" variant="outlined">
            รีเซ็ตเป็นค่าเริ่มต้น
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} variant="outlined">
              ยกเลิก
            </Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              บันทึก
            </Button>
          </Box>
        </Box>
      </Dialog>
    );
  };

export default PublicProfileSettingsDialog;
