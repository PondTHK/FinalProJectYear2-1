"use client";

import React from "react";
import { Box, IconButton, CircularProgress } from "@mui/material";
import { Image as ImageIcon } from "@mui/icons-material";

interface ProfileCoverSectionProps {
  coverImageUrl: string | null;
  isUploading: boolean;
  onImageSelect?: ((event: React.ChangeEvent<HTMLInputElement>) => void) | undefined;
  isEditable?: boolean;
}

const ProfileCoverSection: React.FC<ProfileCoverSectionProps> = ({
  coverImageUrl,
  isUploading,
  onImageSelect,
  isEditable = false,
}) => {
  // Debug: log the cover image URL
  React.useEffect(() => {
    if (coverImageUrl) {
      console.log("Cover image URL:", coverImageUrl);
    }
  }, [coverImageUrl]);

  return (
    <Box
      sx={{
        height: 180,
        background: coverImageUrl
          ? `url(${coverImageUrl})`
          : "#4338ca", // Indigo 700 - Solid Premium Color
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "70%",
          display: "none",
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
        }}
      />
      {/* Cover Image Upload Button - Only show if editable */}
      {isEditable && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
          }}
        >
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="cover-image-upload"
            type="file"
            onChange={onImageSelect || (() => { })}
            disabled={isUploading}
          />
          <label htmlFor="cover-image-upload">
            <IconButton
              component="span"
              disabled={isUploading}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 1)",
                },
                "&:disabled": {
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                },
              }}
            >
              {isUploading ? <CircularProgress size={20} /> : <ImageIcon />}
            </IconButton>
          </label>
        </Box>
      )}
    </Box>
  );
};

export default ProfileCoverSection;
