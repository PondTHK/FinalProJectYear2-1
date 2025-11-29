"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import type { UserPortfolioPayload } from "@/app/lib/api";

interface PortfolioEditDialogProps {
  open: boolean;
  formData: UserPortfolioPayload;
  imagePreview: string | null;
  isEditing: boolean;
  isUploadingImage: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (data: UserPortfolioPayload) => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PortfolioEditDialog: React.FC<PortfolioEditDialogProps> = ({
  open,
  formData,
  imagePreview,
  isEditing,
  isUploadingImage,
  error,
  onClose,
  onSave,
  onFormChange,
  onImageSelect,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
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
        แก้ไขผลงาน
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
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={3}>
          <TextField
            label="ชื่อผลงาน"
            fullWidth
            value={formData.title}
            onChange={(e) =>
              onFormChange({ ...formData, title: e.target.value })
            }
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            label="คำอธิบาย"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) =>
              onFormChange({ ...formData, description: e.target.value })
            }
            placeholder="อธิบายเกี่ยวกับผลงานของคุณ..."
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            label="ลิงก์ผลงาน"
            fullWidth
            value={formData.link}
            onChange={(e) =>
              onFormChange({ ...formData, link: e.target.value })
            }
            placeholder="https://..."
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          {/* Image Upload Section */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "#374151",
                fontWeight: 600,
                mb: 1.5,
              }}
            >
              รูปภาพผลงาน
            </Typography>

            {/* Current/Preview Image */}
            {imagePreview && (
              <Box
                sx={{
                  width: "100%",
                  aspectRatio: "16/9",
                  borderRadius: 2,
                  overflow: "hidden",
                  mb: 2,
                  border: "1px solid #e5e7eb",
                  position: "relative",
                }}
              >
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}

            {/* Upload Button */}
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="portfolio-image-upload"
              type="file"
              onChange={onImageSelect}
              disabled={isUploadingImage}
            />
            <label htmlFor="portfolio-image-upload">
              <Button
                component="span"
                variant="outlined"
                fullWidth
                disabled={isUploadingImage}
                startIcon={
                  isUploadingImage ? (
                    <CircularProgress size={20} />
                  ) : (
                    <EditIcon />
                  )
                }
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: "#d1d5db",
                  color: "#374151",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#6366f1",
                    backgroundColor: "rgba(99, 102, 241, 0.04)",
                  },
                  "&:disabled": {
                    borderColor: "#e5e7eb",
                    color: "#9ca3af",
                  },
                }}
              >
                {imagePreview
                  ? "เปลี่ยนรูปภาพ"
                  : isUploadingImage
                  ? "กำลังอัพโหลด..."
                  : "เลือกรูปภาพ"}
              </Button>
            </label>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: "#6b7280",
            textTransform: "none",
            borderRadius: 2,
            px: 3,
          }}
        >
          ยกเลิก
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={!formData.title?.trim() || isEditing || isUploadingImage}
          sx={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            minWidth: 120,
            "&:hover": {
              background: "linear-gradient(135deg, #5558e3 0%, #7c3aed 100%)",
            },
            "&:disabled": {
              background: "#e5e7eb",
              color: "#9ca3af",
            },
          }}
        >
          {isEditing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              กำลังบันทึก...
            </>
          ) : (
            "บันทึก"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortfolioEditDialog;

