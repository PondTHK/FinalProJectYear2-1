"use client";

import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    CircularProgress,
    IconButton,
    Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface DeleteJobPostDialogProps {
    open: boolean;
    postTitle: string;
    isDeleting: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteJobPostDialog({
    open,
    postTitle,
    isDeleting,
    error,
    onClose,
    onConfirm,
}: DeleteJobPostDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
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
                ยืนยันการลบ
                <IconButton
                    onClick={onClose}
                    size="small"
                    disabled={isDeleting}
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
                <Typography variant="body1" sx={{ color: "#4b5563" }}>
                    คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์งาน <strong>&quot;{postTitle}&quot;</strong>?
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "#9ca3af", mt: 1 }}
                >
                    การกระทำนี้ไม่สามารถยกเลิกได้
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                    onClick={onClose}
                    disabled={isDeleting}
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
                    onClick={onConfirm}
                    variant="contained"
                    disabled={isDeleting}
                    sx={{
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        "&:hover": {
                            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                        },
                        "&:disabled": {
                            background: "#e5e7eb",
                            color: "#9ca3af",
                        },
                    }}
                >
                    {isDeleting ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        "ลบ"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
