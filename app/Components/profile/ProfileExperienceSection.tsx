"use client";

import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";

interface ExperienceItem {
  key: string;
  position: string;
  company: string;
  positionType: string;
  period: string;
  description: string;
}

interface ProfileExperienceSectionProps {
  experienceItems: ExperienceItem[];
}

const ProfileExperienceSection: React.FC<ProfileExperienceSectionProps> = ({
  experienceItems,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#ffffff",
        borderRadius: 5,
        p: 4,
        mb: 5,
        width: "100%",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.06)",
        border: "1px solid #f1f5f9",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.08), transparent)",
          borderRadius: "0 0 0 100%",
        },
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: "#1f2937",
          fontWeight: 700,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 4,
            height: 24,
            background:
              "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: 2,
          }}
        />
        ประสบการณ์ทำงาน
      </Typography>
      {experienceItems.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ color: "#9ca3af", fontStyle: "italic" }}
        >
          ยังไม่มีข้อมูลประสบการณ์จากการกรอกแบบฟอร์ม
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {experienceItems.map((experience) => (
            <Box
              key={experience.key}
              sx={{
                borderRadius: 3,
                p: 3,
                backgroundColor: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.12)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#1f2937", fontWeight: 600, mb: 0.5 }}
                  >
                    {experience.position}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#4b5563", fontWeight: 500, mb: 0.5 }}
                  >
                    {experience.company}
                  </Typography>
                  {experience.positionType && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      <SettingsIcon sx={{ fontSize: 14, color: "#8b5cf6" }} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#8b5cf6",
                          fontWeight: 600,
                        }}
                      >
                        {experience.positionType}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#6366f1",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {experience.period}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "#4b5563", lineHeight: 1.7, mt: 1.5 }}
              >
                {experience.description}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default ProfileExperienceSection;

