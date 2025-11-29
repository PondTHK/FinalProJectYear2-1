"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
} from "@mui/icons-material";
import { type CVData, CVTemplate } from "@/app/lib/generateCV";
import CVPreviewDialog from "./CVPreviewDialog";

interface CVTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  cvData: CVData;
  onGenerate: (template: CVTemplate) => Promise<void>;
  isGenerating: boolean;
}

const templates = [
  {
    id: "modern" as CVTemplate,
    name: "Modern",
    description: "สไตล์โมเดิร์น สะอาดตา",
  },
  {
    id: "classic" as CVTemplate,
    name: "Classic",
    description: "สไตล์คลาสสิก ทางการ",
  },
  {
    id: "minimal" as CVTemplate,
    name: "Minimal",
    description: "สไตล์มินิมอล สวยงาม",
  },
];

const CVTemplateSelector: React.FC<CVTemplateSelectorProps> = ({
  open,
  onClose,
  cvData,
  onGenerate,
  isGenerating,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate>("modern");
  const [previewTemplate, setPreviewTemplate] = useState<CVTemplate | null>(null);

  const handlePreview = (templateId: CVTemplate) => {
    setPreviewTemplate(templateId);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleGenerate = async () => {
    await onGenerate(selectedTemplate);
  };

  return (
    <>
      <Dialog
        open={open && !previewTemplate}
        onClose={onClose}
        maxWidth="md"
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
          เลือก Template CV
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
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", mb: 3 }}
          >
            เลือก template ที่คุณชอบแล้วกด &quot;ดู Preview&quot; เพื่อดูตัวอย่าง หรือ &quot;ดาวน์โหลด&quot; เพื่อดาวน์โหลด CV
          </Typography>

          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Paper
                  elevation={selectedTemplate === template.id ? 4 : 1}
                  onClick={() => setSelectedTemplate(template.id)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    border: selectedTemplate === template.id ? "2px solid #6366f1" : "2px solid transparent",
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      aspectRatio: "3/4",
                      bgcolor: "#f3f4f6",
                      borderRadius: 1,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Preview placeholder */}
                    <Box
                      sx={{
                        width: "80%",
                        height: "80%",
                        bgcolor: "white",
                        borderRadius: 1,
                        p: 2,
                        boxShadow: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: "60%",
                          height: 12,
                          bgcolor: "#6366f1",
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                      <Box
                        sx={{
                          width: "40%",
                          height: 8,
                          bgcolor: "#e5e7eb",
                          borderRadius: 1,
                          mb: 2,
                        }}
                      />
                      <Box
                        sx={{
                          width: "100%",
                          height: 1,
                          bgcolor: "#d1d5db",
                          mb: 2,
                        }}
                      />
                      <Box
                        sx={{
                          width: "90%",
                          height: 6,
                          bgcolor: "#f3f4f6",
                          borderRadius: 0.5,
                          mb: 1,
                        }}
                      />
                      <Box
                        sx={{
                          width: "95%",
                          height: 6,
                          bgcolor: "#f3f4f6",
                          borderRadius: 0.5,
                          mb: 1,
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 0.5,
                      color: selectedTemplate === template.id ? "#6366f1" : "#1f2937",
                    }}
                  >
                    {template.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", mb: 1.5, fontSize: "0.875rem" }}
                  >
                    {template.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<PreviewIcon sx={{ fontSize: 16 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(template.id);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      borderColor: "#d1d5db",
                      color: "#374151",
                      "&:hover": {
                        borderColor: "#6366f1",
                        backgroundColor: "rgba(99, 102, 241, 0.04)",
                      },
                    }}
                  >
                    ดู Preview
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={onClose}
            disabled={isGenerating}
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
            onClick={handleGenerate}
            variant="contained"
            disabled={isGenerating}
            startIcon={
              isGenerating ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            sx={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #5558e3 0%, #7c3aed 100%)",
              },
              "&:disabled": {
                background: "#e5e7eb",
                color: "#9ca3af",
              },
            }}
          >
            {isGenerating ? "กำลังสร้าง..." : "ดาวน์โหลด CV"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      {previewTemplate && (
        <CVPreviewDialog
          open={!!previewTemplate}
          template={previewTemplate}
          cvData={cvData}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
};

export default CVTemplateSelector;
