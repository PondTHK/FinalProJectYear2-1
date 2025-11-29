"use client";

import React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

interface ContactItem {
  id: string;
  icon: React.ReactNode;
  gradient: string;
  title: string;
  subtitle: string;
}

interface ProfileAboutSectionProps {
  aboutSummary: string;
  isEditingAboutMe: boolean;
  aboutMeTemp: string;
  contactItems: ContactItem[];
  onEditClick: () => void;
  onSaveClick: () => void;
  onCancelClick: () => void;
  onAboutMeChange: (value: string) => void;
  isEditable?: boolean;
}

const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  aboutSummary,
  isEditingAboutMe,
  aboutMeTemp,
  contactItems,
  onEditClick,
  onSaveClick,
  onCancelClick,
  onAboutMeChange,
  isEditable = false,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 100%)",
        borderRadius: 5,
        p: 4,
        width: "100%",
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
          right: 0,
          width: "100px",
          height: "100px",
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)",
          borderRadius: "0 0 0 100%",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "#1f2937",
            fontWeight: 700,
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
          About Me
        </Typography>
        {!isEditingAboutMe && isEditable && (
          <IconButton
            onClick={onEditClick}
            sx={{
              color: "#6366f1",
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.1)",
              },
            }}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      {isEditingAboutMe ? (
        <Box sx={{ mb: 4 }}>
          <TextField
            multiline
            rows={6}
            fullWidth
            value={aboutMeTemp}
            onChange={(e) => onAboutMeChange(e.target.value)}
            placeholder="เขียนเกี่ยวกับตัวคุณ..."
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                "& fieldset": {
                  borderColor: "rgba(99, 102, 241, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(99, 102, 241, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#6366f1",
                },
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              onClick={onCancelClick}
              startIcon={<CancelIcon />}
              sx={{
                color: "#6b7280",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "rgba(107, 114, 128, 0.1)",
                },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={onSaveClick}
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                textTransform: "none",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #5558e3 0%, #7c3aed 100%)",
                },
              }}
            >
              บันทึก
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body1"
          sx={{
            color: "#4b5563",
            mb: 4,
            lineHeight: 1.8,
            fontSize: "0.95rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {aboutSummary}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {contactItems.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "#9ca3af", fontStyle: "italic" }}
          >
            ยังไม่มีข้อมูลการติดต่อจากการกรอกแบบฟอร์ม
          </Typography>
        ) : (
          contactItems.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                p: 2,
                borderRadius: 2,
                transition:
                  "background-color 0.3s ease, transform 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.05)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: item.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: "#4b5563", fontWeight: 500 }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#9ca3af" }}
                >
                  {item.subtitle}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default ProfileAboutSection;

