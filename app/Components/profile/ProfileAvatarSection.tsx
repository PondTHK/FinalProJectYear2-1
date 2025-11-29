"use client";

import React from "react";
import { Box, Avatar, Typography, IconButton, CircularProgress } from "@mui/material";
import { Image as ImageIcon } from "@mui/icons-material";

interface ProfileAvatarSectionProps {
  profileImageUrl: string | null;
  displayName: string;
  roleTitle: string;
  isUploading: boolean;
  onImageSelect?: ((event: React.ChangeEvent<HTMLInputElement>) => void) | undefined;
  isEditable?: boolean;
}

const ProfileAvatarSection: React.FC<ProfileAvatarSectionProps> = ({
  profileImageUrl,
  displayName,
  roleTitle,
  isUploading,
  onImageSelect,
  isEditable = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: -8,
      }}
    >
      <Box sx={{ position: "relative", display: "inline-block" }}>
        <Avatar
          src={profileImageUrl || "https://i.pravatar.cc/150?img=12"}
          onError={(e) => {
            console.log("Failed to load profile image:", profileImageUrl);
            // Fallback to default image
            const target = e.currentTarget as unknown as HTMLImageElement;
            if (target.src !== "https://i.pravatar.cc/150?img=12") {
              target.src = "https://i.pravatar.cc/150?img=12";
            }
          }}
          sx={{
            width: 180,
            height: 180,
            border: "8px solid #ffffff",
            mb: 3,
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: "50%",
              background:
                "linear-gradient(45deg, #667eea, #764ba2, #f093fb)",
              zIndex: -1,
            },
          }}
        />
        {/* Profile Image Upload Button - Only show if editable */}
        {isEditable && (
          <Box
            sx={{
              position: "absolute",
              bottom: 35,
              right: 35,
              zIndex: 10,
            }}
          >
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="profile-image-upload"
              type="file"
              onChange={onImageSelect || (() => { })}
              disabled={isUploading}
            />
            <label htmlFor="profile-image-upload">
              <IconButton
                component="span"
                disabled={isUploading}
                sx={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  width: 40,
                  height: 40,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    transform: "scale(1.05)",
                    boxShadow: "0 6px 16px rgba(16, 185, 129, 0.4)",
                  },
                  "&:disabled": {
                    background: "#e5e7eb",
                    color: "#9ca3af",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {isUploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ImageIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </label>
          </Box>
        )}
        {/* Online Status Indicator */}
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "#10b981",
            border: "4px solid #ffffff",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)",
          }}
        />
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography
          variant="h4"
          sx={{
            color: "#1f2937",
            fontWeight: 700,
            mb: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {displayName}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 3,
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "#6b7280", fontWeight: 500 }}
          >
            {roleTitle}
          </Typography>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#10b981",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileAvatarSection;
