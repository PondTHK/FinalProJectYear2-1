"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { CVData, CVTemplate } from "@/app/lib/generateCV";
import { CVPreviewContent } from "./CVPreviewContent";

interface CVPreviewDialogProps {
  open: boolean;
  template: CVTemplate;
  cvData: CVData;
  onClose: () => void;
}

const CVPreviewDialog = ({
  open,
  template,
  cvData,
  onClose,
}: CVPreviewDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Preview CV –{" "}
            {template.charAt(0).toUpperCase() + template.slice(1)} Template
          </Typography>
        </Box>

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

      <DialogContent
        sx={{
          overflow: "auto",
          p: 0,
        }}
      >
        <Box
          sx={{
            p: 4,
            bgcolor: "#f9fafb",
            display: "flex",
            justifyContent: "center",
            minHeight: "60vh",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: "100%",
              maxWidth: "210mm",
              minHeight: "297mm",
              bgcolor: "white",
              p: 4,
              transform: "scale(0.75)",
              transformOrigin: "top center",
              mb: -25,
            }}
          >
            <CVPreviewContent template={template} cvData={cvData} />
          </Paper>
        </Box>
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
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVPreviewDialog;
