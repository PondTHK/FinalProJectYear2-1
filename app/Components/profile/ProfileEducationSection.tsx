"use client";

import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";

interface EducationItem {
  key: string;
  school: string;
  degree: string;
  major: string;
  period: string;
  description: string;
}

interface ProfileEducationSectionProps {
  educationItems: EducationItem[];
}

const ProfileEducationSection: React.FC<ProfileEducationSectionProps> = ({
  educationItems,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#ffffff",
        borderRadius: 5,
        p: 4,
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
          width: "80px",
          height: "80px",
          background:
            "linear-gradient(135deg, rgba(236, 72, 153, 0.1), transparent)",
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
              "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
            borderRadius: 2,
          }}
        />
        ประวัติการศึกษา
      </Typography>
      {educationItems.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ color: "#9ca3af", fontStyle: "italic" }}
        >
          ยังไม่มีข้อมูลการศึกษาจากการกรอกแบบฟอร์ม
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {educationItems.map((education) => (
            <Box
              key={education.key}
              sx={{
                borderRadius: 3,
                p: 3,
                backgroundColor: "rgba(236, 72, 153, 0.05)",
                border: "1px solid rgba(236, 72, 153, 0.12)",
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
                    {education.school}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#4b5563", fontWeight: 500, mb: 0.5 }}
                  >
                    {education.degree}
                  </Typography>
                  {education.major && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      <SettingsIcon sx={{ fontSize: 14, color: "#f97316" }} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#f97316",
                          fontWeight: 600,
                        }}
                      >
                        {education.major}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#ec4899",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {education.period}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "#4b5563", lineHeight: 1.7, mt: 1.5 }}
              >
                {education.description}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default ProfileEducationSection;

