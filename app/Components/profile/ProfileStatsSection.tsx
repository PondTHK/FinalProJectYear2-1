"use client";

import React from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import {
  Download as DownloadIcon,
} from "@mui/icons-material";

interface Stat {
  label: string;
  value: string;
}

interface ProfileStatsSectionProps {
  stats: Stat[];
  onDownloadCV?: (() => void) | undefined;
  isDownloading?: boolean;
}

const ProfileStatsSection: React.FC<ProfileStatsSectionProps> = ({
  stats,
  onDownloadCV,
  isDownloading = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 3,
      }}
    >
      {/* Stats - Left */}
      <Box sx={{ display: "flex", gap: 4 }}>
        {stats.map((stat, index) => (
          <Box key={index} sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{ color: "#1f2937", fontWeight: 600 }}
            >
              {stat.value}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Action Buttons - Right */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {onDownloadCV && (
          <Button
            variant="contained"
            onClick={onDownloadCV}
            disabled={isDownloading}
            startIcon={
              isDownloading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            sx={{
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              textTransform: "none",
              borderRadius: 12,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(139, 92, 246, 0.4)",
              },
              "&:disabled": {
                background: "#e5e7eb",
                color: "#9ca3af",
              },
              transition: "all 0.3s ease",
            }}
          >
            {isDownloading ? "กำลังสร้าง..." : "export to cv"}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ProfileStatsSection;
