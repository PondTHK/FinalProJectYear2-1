"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Palette as PaletteIcon,
} from "@mui/icons-material";
import PublicProfileSettingsDialog from "./PublicProfileSettingsDialog";
import type {
  UserProfileResponse,
  UserAddressResponse,
  UserEducationResponse,
  UserExperienceResponse,
} from "@/app/lib/api";

interface ProfileRightSidebarProps {
  profileLink?: string;
  profileLanguage?: string;
  profile?: UserProfileResponse | null;
  address?: UserAddressResponse | null;
  educations?: UserEducationResponse[];
  experiences?: UserExperienceResponse[];
  aboutMe?: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  onDownloadCV?: (() => void) | undefined;
  onSelectTemplate?: (() => void) | undefined;
  isOwnProfile?: boolean; // If false, hide settings that only owner can access
  hideProfileSettings?: boolean; // If true, hide the Profile Settings card
}

const ProfileRightSidebar: React.FC<ProfileRightSidebarProps> = ({
  profileLink = "FYNEX.com/profile/your-name",
  profileLanguage = "ไทย",
  profile = null,
  address = null,
  educations = [],
  experiences = [],
  aboutMe = "",
  profileImageUrl = null,
  coverImageUrl = null,
  onDownloadCV,
  onSelectTemplate,
  isOwnProfile = true, // Default to true for backward compatibility
  hideProfileSettings = false, // Default to false for backward compatibility
}) => {
  const [publicSettingsOpen, setPublicSettingsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Ensure profileLink is a full URL
  const getFullProfileLink = () => {
    if (profileLink.startsWith("http://") || profileLink.startsWith("https://")) {
      return profileLink;
    }
    if (profileLink.startsWith("/")) {
      return typeof window !== "undefined" ? `${window.location.origin}${profileLink}` : profileLink;
    }
    return `https://${profileLink}`;
  };

  const fullProfileLink = getFullProfileLink();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullProfileLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "โปรไฟล์ของฉัน",
          text: "ดูโปรไฟล์ของฉันบน FYNEX",
          url: fullProfileLink,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to share:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxHeight: { lg: "calc(100vh - 120px)" },
        overflowY: { lg: "auto" },
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(0,0,0,0.2)",
          borderRadius: "3px",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Profile Settings Card */}
        {!hideProfileSettings && (
          <Paper
            elevation={0}
            sx={{
              background: "rgba(255, 255, 255, 0.9)", // Solid semi-transparent white
              borderRadius: 3,
              p: 3,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow:
                "0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#1f2937",
                fontWeight: 700,
                mb: 2.5,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SettingsIcon sx={{ fontSize: 20, color: "#8b5cf6" }} />
              การตั้งค่าโปรไฟล์
            </Typography>

            {/* Profile Language */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2.5,
              }}
            >
              {/* <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: "0.875rem",
                }}
              >
                ภาษาโปรไฟล์
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: "0.875rem",
                }}
              >
                {profileLanguage}
              </Typography>
            </Box> */}
              {/* <IconButton
              size="small"
              sx={{
                color: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                  color: "#2563eb",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton> */}
            </Box>


            {/* Public Profile Link */}
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 700,
                  mb: 1,
                  fontSize: "0.875rem",
                }}
              >
                ลิงก์โปรไฟล์สาธารณะ
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#6366f1",
                    fontSize: "0.75rem",
                    flex: 1,
                    wordBreak: "break-all",
                  }}
                >
                  {fullProfileLink}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleCopyLink}
                  sx={{
                    color: linkCopied ? "#10b981" : "#06b6d4",
                    backgroundColor: linkCopied
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(6, 182, 212, 0.1)",
                    "&:hover": {
                      backgroundColor: linkCopied
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(6, 182, 212, 0.2)",
                      color: linkCopied ? "#059669" : "#0891b2",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {linkCopied ? (
                    <CheckCircleIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <ContentCopyIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Box>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<ShareIcon sx={{ fontSize: 16 }} />}
                onClick={handleShare}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  borderColor: "#10b981",
                  color: "#10b981",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "rgba(16, 185, 129, 0.05)",
                  "&:hover": {
                    borderColor: "#059669",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#059669",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                แชร์โปรไฟล์
              </Button>
            </Box>
          </Paper>
        )}

        {/* Public Profile Settings - Only show for own profile */}
        {isOwnProfile && (
          <Paper
            elevation={0}
            sx={{
              background: "rgba(255, 255, 255, 0.9)", // Solid semi-transparent white
              borderRadius: 3,
              p: 3,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow:
                "0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.55)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "#6366f1", // Solid Indigo
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#1f2937",
                fontWeight: 700,
                mb: 2.5,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 1,
                pt: 1,
              }}
            >
              <VisibilityIcon sx={{ fontSize: 20, color: "#10b981" }} />
              การตั้งค่าโปรไฟล์สาธารณะ
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                mb: 2.5,
                fontSize: "0.875rem",
              }}
            >
              ควบคุมว่าข้อมูลไหนที่แสดงต่อผู้ใช้ทั่วไป
            </Typography>

            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={() => setPublicSettingsOpen(true)}
              startIcon={<SettingsIcon sx={{ fontSize: 16 }} />}
              sx={{
                background: "#10b981", // Solid Green
                color: "white",
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                py: 1,
                fontSize: "0.875rem",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              ตั้งค่าโปรไฟล์สาธารณะ
            </Button>
          </Paper>
        )}

        {/* Quick Actions - Only show for own profile */}
        {isOwnProfile && (
          <Paper
            elevation={0}
            sx={{
              background: "rgba(255, 255, 255, 0.9)", // Solid semi-transparent white
              borderRadius: 3,
              p: 3,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow:
                "0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.55)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#1f2937",
                fontWeight: 700,
                mb: 2,
                fontSize: "1rem",
              }}
            >
              การทำงานด่วน
            </Typography>

            <List sx={{ p: 0 }}>
              {onDownloadCV && (
                <>
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={onDownloadCV}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        "&:hover": {
                          backgroundColor: "rgba(139, 92, 246, 0.1)",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <DownloadIcon
                          sx={{ fontSize: 20, color: "#8b5cf6" }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary="ดาวน์โหลด CV"
                        primaryTypographyProps={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                </>
              )}
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={handleShare}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    "&:hover": {
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ShareIcon sx={{ fontSize: 20, color: "#10b981" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="แชร์โปรไฟล์"
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={handleCopyLink}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    "&:hover": {
                      backgroundColor: "rgba(6, 182, 212, 0.1)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {linkCopied ? (
                      <CheckCircleIcon sx={{ fontSize: 20, color: "#10b981" }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 20, color: "#06b6d4" }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={linkCopied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              {isOwnProfile && (
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      // Navigate to edit profile or onboarding
                      if (typeof window !== "undefined") {
                        window.location.href = "/onboarding";
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      py: 1.25,
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <EditIcon sx={{ fontSize: 20, color: "#3b82f6" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="แก้ไขโปรไฟล์"
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              )}
              {onSelectTemplate && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      onClick={onSelectTemplate}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        "&:hover": {
                          backgroundColor: "rgba(111, 88, 215, 0.1)",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <PaletteIcon sx={{ fontSize: 20, color: "#6f58d7" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="เลือก Template"
                        primaryTypographyProps={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </>
              )}
            </List>
          </Paper>
        )}
      </Box>

      {/* Public Profile Settings Dialog */}
      <PublicProfileSettingsDialog
        open={publicSettingsOpen}
        onClose={() => setPublicSettingsOpen(false)}
        profile={profile}
        address={address}
        educations={educations}
        experiences={experiences}
        aboutMe={aboutMe}
        profileImageUrl={profileImageUrl}
        coverImageUrl={coverImageUrl}
      />
    </Box>
  );
};

export default ProfileRightSidebar;
