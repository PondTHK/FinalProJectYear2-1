/* eslint-disable @next/next/no-img-element */
"use client";

import React, { Suspense, useEffect, useState } from "react";
import {
    Box,
    Grid,
    Typography,
    TextField,
    InputAdornment,
    Avatar,
    Stack,
    Button,
    IconButton,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
} from "@mui/material";
import {
    Search as SearchIcon,
    Business as BuildingIcon,
    CheckCircle as CheckCircleIcon,
    Star as StarIcon,
    Language as GlobeIcon,
    Email as MailIcon,
    Work as BriefcaseIcon,
    People as UsersIcon,
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Key as KeyIcon,
    Close as CloseIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import { companyAPI, CompanyResponse, CompanyGalleryResponse, CompanyPostResponse, storageAPI, userAPI, jobApplicationAPI, JobApplicationWithUserResponse } from "@/app/lib/api";
import CreateJobPostDialog from "@/app/Components/company/CreateJobPostDialog";
import DeleteJobPostDialog from "@/app/Components/company/DeleteJobPostDialog";
import { PhotoCamera, Add, Person as PersonIcon } from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";

function CompanyProfilePageContent() {
    const searchParams = useSearchParams();
    const [company, setCompany] = useState<CompanyResponse | null>(null);
    const [galleries, setGalleries] = useState<CompanyGalleryResponse[]>([]);
    const [posts, setPosts] = useState<CompanyPostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<"profile" | "jobpost" | "access" | "candidate">("profile");
    const [candidateProfile, setCandidateProfile] = useState<any>(null);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
    const [editJobDialogOpen, setEditJobDialogOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<CompanyPostResponse | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<CompanyPostResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);
    const [isDeletingGallery, setIsDeletingGallery] = useState<string | null>(null);
    const [deleteGalleryDialogOpen, setDeleteGalleryDialogOpen] = useState(false);
    const [galleryToDelete, setGalleryToDelete] = useState<string | null>(null);
    const [viewAllGalleryOpen, setViewAllGalleryOpen] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Candidates Dialog State
    const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
    const [applicants, setApplicants] = useState<JobApplicationWithUserResponse[]>([]);
    const [applicantsLoading, setApplicantsLoading] = useState(false);
    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<CompanyPostResponse | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch company details
                const companyRes = await companyAPI.getCompany();
                if (!companyRes.ok || !companyRes.data) {
                    if (companyRes.status === 404) {
                        setError('No company profile found. Please complete onboarding first.');
                    } else {
                        throw new Error('Failed to load company profile');
                    }
                    return;
                }
                setCompany(companyRes.data);

                // Fetch galleries and posts
                if (companyRes.data.id) {
                    const [galleryRes, postsRes] = await Promise.all([
                        companyAPI.getGalleries(companyRes.data.id),
                        companyAPI.getPosts(companyRes.data.id),
                    ]);

                    if (galleryRes.ok && galleryRes.data) {
                        setGalleries(galleryRes.data);
                    }

                    if (postsRes.ok && postsRes.data) {
                        setPosts(postsRes.data);
                    }
                }
            } catch (err) {
                console.error('Error fetching company data:', err);
                setError('Failed to load company profile. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Check for candidate query parameter
    useEffect(() => {
        const candidateParam = searchParams.get("candidate");
        if (candidateParam) {
            setActiveSection("candidate");
            fetchCandidateProfile(candidateParam);
        }
    }, [searchParams]);

    const fetchCandidateProfile = async (userId: string) => {
        try {
            setCandidateLoading(true);
            const response = await userAPI.getProfileByUserId(userId);
            if (response.ok && response.data) {
                setCandidateProfile(response.data);
            } else {
                setError("Failed to load candidate profile");
            }
        } catch (err) {
            console.error("Error fetching candidate profile:", err);
            setError("Failed to load candidate profile");
        } finally {
            setCandidateLoading(false);
        }
    };

    const refreshPosts = async () => {
        if (company?.id) {
            const postsRes = await companyAPI.getPosts(company.id);
            if (postsRes.ok && postsRes.data) {
                setPosts(postsRes.data);
            }
        }
    };

    const handleEditPost = (post: CompanyPostResponse) => {
        setSelectedPost(post);
        setEditJobDialogOpen(true);
    };

    const handleDeletePost = (post: CompanyPostResponse) => {
        setPostToDelete(post);
        setDeleteDialogOpen(true);
        setDeleteError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!postToDelete) return;

        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await companyAPI.deletePost(postToDelete.id);
            if (response.ok || response.status === 204) {
                setDeleteDialogOpen(false);
                setPostToDelete(null);
                await refreshPosts();
            } else {
                const errorMessage =
                    (response.data as any)?.error ||
                    (typeof response.data === "string" ? response.data : null) ||
                    "ไม่สามารถลบโพสต์งานได้ กรุณาลองอีกครั้ง";
                setDeleteError(errorMessage);
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "เกิดข้อผิดพลาดในการลบโพสต์งาน กรุณาลองอีกครั้ง";
            setDeleteError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setPostToDelete(null);
        setDeleteError(null);
    };

    const refreshGalleries = async () => {
        if (company?.id) {
            const galleryRes = await companyAPI.getGalleries(company.id);
            if (galleryRes.ok && galleryRes.data) {
                setGalleries(galleryRes.data);
            }
        }
    };

    const handleDeleteGalleryClick = (galleryId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent opening image viewer when clicking delete
        setGalleryToDelete(galleryId);
        setDeleteGalleryDialogOpen(true);
    };

    const handleDeleteGalleryConfirm = async () => {
        if (!galleryToDelete) return;

        setIsDeletingGallery(galleryToDelete);
        setDeleteGalleryDialogOpen(false);

        try {
            const response = await companyAPI.deleteGallery(galleryToDelete);
            if (response.ok || response.status === 204) {
                // Check if the deleted image is currently being viewed
                const deletedIndex = galleries.findIndex(g => g.id === galleryToDelete);
                if (deletedIndex !== -1 && imageViewerOpen && selectedImageIndex === deletedIndex) {
                    // Close image viewer if viewing the deleted image
                    setImageViewerOpen(false);
                }

                await refreshGalleries();
                setSnackbar({ open: true, message: "ลบรูปภาพสำเร็จ", severity: 'success' });
            } else {
                const errorMsg = typeof response.data === 'string'
                    ? response.data
                    : "ไม่สามารถลบรูปภาพได้ กรุณาลองอีกครั้ง";
                setSnackbar({ open: true, message: errorMsg, severity: 'error' });
            }
        } catch (error) {
            console.error("Error deleting gallery image:", error);
            setSnackbar({ open: true, message: "เกิดข้อผิดพลาดในการลบรูปภาพ", severity: 'error' });
        } finally {
            setIsDeletingGallery(null);
            setGalleryToDelete(null);
        }
    };

    const handleDeleteGalleryCancel = () => {
        setDeleteGalleryDialogOpen(false);
        setGalleryToDelete(null);
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setSnackbar({ open: true, message: "Please select an image file", severity: 'error' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSnackbar({ open: true, message: "Image size must be less than 5MB", severity: 'error' });
            return;
        }

        setIsUploadingLogo(true);
        try {
            const uploadRes = await storageAPI.uploadFile(file, "company-logos");
            if (uploadRes.ok && uploadRes.data?.url) {
                // Update company logo
                const updateRes = await companyAPI.updateCompany({ logo_url: uploadRes.data.url });
                if (updateRes.ok && updateRes.data) {
                    setCompany(updateRes.data);
                    setSnackbar({ open: true, message: "Logo updated successfully!", severity: 'success' });
                } else {
                    setSnackbar({ open: true, message: "Failed to update logo", severity: 'error' });
                }
            } else {
                setSnackbar({ open: true, message: "Failed to upload logo", severity: 'error' });
            }
        } catch (error) {
            console.error("Error uploading logo:", error);
            setSnackbar({ open: true, message: "Error uploading logo", severity: 'error' });
        } finally {
            setIsUploadingLogo(false);
            event.target.value = "";
        }
    };

    const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setSnackbar({ open: true, message: "Please select an image file", severity: 'error' });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setSnackbar({ open: true, message: "Image size must be less than 10MB", severity: 'error' });
            return;
        }

        if (!company?.id) {
            setSnackbar({ open: true, message: "Company ID not found", severity: 'error' });
            return;
        }

        setIsUploadingGallery(true);
        try {
            const uploadRes = await storageAPI.uploadFile(file, "company-galleries");
            if (uploadRes.ok && uploadRes.data?.url) {
                // Create gallery entry
                const createRes = await companyAPI.createGallery(company.id, { image_url: uploadRes.data.url });
                if (createRes.ok && createRes.data) {
                    await refreshGalleries();
                    setSnackbar({ open: true, message: "Image added to gallery successfully!", severity: 'success' });
                } else {
                    setSnackbar({ open: true, message: "Failed to add image to gallery", severity: 'error' });
                }
            } else {
                setSnackbar({ open: true, message: "Failed to upload image", severity: 'error' });
            }
        } catch (error) {
            console.error("Error uploading gallery image:", error);
            setSnackbar({ open: true, message: "Error uploading image", severity: 'error' });
        } finally {
            setIsUploadingGallery(false);
            event.target.value = "";
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 1600, mx: "auto", mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!company) {
        return (
            <Box sx={{ maxWidth: 1600, mx: "auto", mt: 4 }}>
                <Alert severity="info">No company profile found.</Alert>
            </Box>
        );
    }

    const sectionTabs: {
        id: "profile" | "jobpost" | "access" | "candidate";
        label: string;
        icon: typeof BuildingIcon;
    }[] = [
            {
                id: "profile",
                label: "Profile Overview",
                icon: BuildingIcon,
            },
            {
                id: "jobpost",
                label: "Job Posts",
                icon: BriefcaseIcon,
            },
            {
                id: "candidate",
                label: "Candidates",
                icon: PersonIcon,
            },
            {
                id: "access",
                label: "Access Config",
                icon: SettingsIcon,
            },
        ];

    const formatWebsite = (raw: string) => {
        if (!raw) return "-";
        const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
        try {
            const parsed = new URL(normalized);
            return parsed.hostname.replace(/^www\./, "");
        } catch {
            return raw.length > 30 ? `${raw.slice(0, 30)}…` : raw;
        }
    };

    const baseCardSx = {
        borderRadius: 4,
        p: { xs: 3, md: 4 },
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    };

    const outlinedCardSx = {
        ...baseCardSx,
        border: "1px solid",
        borderColor: "grey.200",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    };

    const renderProfileSection = () => (
        <Stack spacing={3}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper sx={{ ...baseCardSx, height: "100%" }}>
                        <Typography variant="h6" gutterBottom>Company Details</Typography>

                        <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
                            {company.description || "No description provided."}
                        </Typography>

                        {(company.mission || company.vision) && (
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                {company.mission && (
                                    <Grid size={{ xs: 12, md: company.vision ? 6 : 12 }}>
                                        <Box sx={{ p: 2.5, bgcolor: "grey.50", borderRadius: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>Mission</Typography>
                                            <Typography variant="body2" color="text.secondary">{company.mission}</Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {company.vision && (
                                    <Grid size={{ xs: 12, md: company.mission ? 6 : 12 }}>
                                        <Box sx={{ p: 2.5, bgcolor: "grey.50", borderRadius: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>Vision</Typography>
                                            <Typography variant="body2" color="text.secondary">{company.vision}</Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        )}

                        {/* <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" gutterBottom>Key Products</Typography>
                            <ul style={{ margin: 0, paddingLeft: 20, color: "#6b7280", fontSize: "0.875rem" }}>
                                <li>FlowPay Enterprise</li>
                                <li>LedgerSync API</li>
                                <li>SmartReconcile AI</li>
                            </ul>
                        </Box> */}

                        <Typography variant="h6" gutterBottom>Company Status</Typography>
                        <Grid container spacing={2}>
                            {[
                                { label: "Total Job Posts", value: posts.length.toString(), color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
                                { label: "Open Positions", value: posts.filter(p => p.status === "active").length.toString(), color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
                                { label: "Employees", value: company.company_size || "N/A", color: "#22c55e", gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" },
                                { label: "Avg Hiring Time", value: "14d", color: "#a855f7", gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)" },
                            ].map((stat, index) => (
                                <Grid size={{ xs: 6, md: 3 }} key={index}>
                                    <Box
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            textAlign: "center",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            background: stat.gradient,
                                            position: "relative",
                                            overflow: "hidden",
                                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                                            "&::before": {
                                                content: '""',
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: "rgba(255, 255, 255, 0.1)",
                                                borderRadius: 3,
                                            },
                                        }}
                                    >
                                        <Typography variant="h4" fontWeight={800} color="white" sx={{ position: "relative", zIndex: 1 }}>{stat.value}</Typography>
                                        <Typography variant="caption" sx={{ mt: 1, fontWeight: 600, color: "rgba(255, 255, 255, 0.9)", position: "relative", zIndex: 1 }}>{stat.label}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ ...baseCardSx, height: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                            <Typography variant="h6" fontWeight={700}>Company Gallery</Typography>
                            <Stack direction="row" spacing={1}>
                                {galleries.length > 9 && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setViewAllGalleryOpen(true)}
                                        sx={{
                                            minWidth: "auto",
                                            px: 2.5,
                                            py: 1,
                                            fontSize: "0.75rem",
                                            borderColor: "#667eea",
                                            color: "#667eea",
                                            "&:hover": {
                                                borderColor: "#5568d3",
                                                bgcolor: "rgba(102, 126, 234, 0.1)",
                                            },
                                        }}
                                    >
                                        View All
                                    </Button>
                                )}
                                <input
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    id="gallery-upload"
                                    type="file"
                                    onChange={handleGalleryUpload}
                                    disabled={isUploadingGallery}
                                />
                                <label htmlFor="gallery-upload">
                                    <Button
                                        variant="contained"
                                        size="small"
                                        component="span"
                                        startIcon={isUploadingGallery ? <CircularProgress size={16} /> : <Add />}
                                        disabled={isUploadingGallery}
                                        sx={{
                                            minWidth: "auto",
                                            px: 2.5,
                                            py: 1,
                                            fontSize: "0.75rem",
                                            bgcolor: "#10b981",
                                            "&:hover": { bgcolor: "#059669" },
                                            boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)",
                                        }}
                                    >
                                        {isUploadingGallery ? "Uploading..." : "Add Image"}
                                    </Button>
                                </label>
                            </Stack>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                            {galleries.length > 0 ? (
                                galleries.slice(0, 9).map((gallery, index) => (
                                    <Box
                                        key={gallery.id}
                                        onClick={() => {
                                            setSelectedImageIndex(index);
                                            setImageViewerOpen(true);
                                        }}
                                        sx={{
                                            aspectRatio: "1/1",
                                            borderRadius: 2.5,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            boxShadow: "0 2px 4px 0 rgb(0 0 0 / 0.1)",
                                            position: "relative",
                                            "&:hover": {
                                                opacity: 0.9,
                                                transform: "scale(1.02)",
                                                transition: "all 0.2s ease",
                                                "& .gallery-actions": {
                                                    opacity: 1,
                                                },
                                            },
                                        }}
                                    >
                                        <img
                                            src={gallery.image_url}
                                            alt="Company Gallery"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                        <Box
                                            className="gallery-actions"
                                            sx={{
                                                position: "absolute",
                                                top: 8,
                                                right: 8,
                                                display: "flex",
                                                gap: 0.5,
                                                opacity: 0,
                                                transition: "opacity 0.2s ease",
                                            }}
                                        >
                                            <IconButton
                                                onClick={(e) => handleDeleteGalleryClick(gallery.id, e)}
                                                disabled={isDeletingGallery === gallery.id}
                                                size="small"
                                                sx={{
                                                    bgcolor: "rgba(239, 68, 68, 0.8)",
                                                    borderRadius: "50%",
                                                    p: 0.5,
                                                    minWidth: "auto",
                                                    width: 28,
                                                    height: 28,
                                                    "&:hover": {
                                                        bgcolor: "rgba(239, 68, 68, 1)",
                                                    },
                                                }}
                                            >
                                                {isDeletingGallery === gallery.id ? (
                                                    <CircularProgress size={14} sx={{ color: "white" }} />
                                                ) : (
                                                    <DeleteIcon sx={{ color: "white", fontSize: 14 }} />
                                                )}
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">No gallery images yet</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ ...baseCardSx }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight={700}>Active Job Listings</Typography>
                    <Chip
                        label={`${posts.length} jobs`}
                        sx={{
                            bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            fontWeight: 600,
                            px: 1,
                        }}
                    />
                </Box>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <Grid size={{ xs: 12, md: 6 }} key={post.id}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        ...outlinedCardSx,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        borderLeft: "4px solid",
                                        borderLeftColor: "primary.main",
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                            <Typography variant="subtitle1" fontWeight={600}>{post.title}</Typography>
                                            <Chip label={post.status} color={post.status === "active" ? "success" : "default"} size="small" />
                                        </Box>
                                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <BriefcaseIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                                <Typography variant="caption" color="text.secondary">{post.job_type}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <UsersIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                                <Typography variant="caption" color="text.secondary">{post.location}</Typography>
                                            </Box>
                                        </Stack>
                                        {post.salary_range && (
                                            <Typography variant="subtitle2" sx={{ color: "#10b981" }} fontWeight={700}>
                                                {post.salary_range}
                                            </Typography>
                                        )}
                                        {post.tags && post.tags.length > 0 && (
                                            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                                                {post.tags.map((tag, idx) => {
                                                    const colors = [
                                                        { bg: "#dbeafe", text: "#1e40af" },
                                                        { bg: "#fce7f3", text: "#9f1239" },
                                                        { bg: "#fef3c7", text: "#92400e" },
                                                        { bg: "#d1fae5", text: "#065f46" },
                                                        { bg: "#e9d5ff", text: "#6b21a8" },
                                                    ];
                                                    const color = colors[idx % colors.length];
                                                    return (
                                                        <Chip
                                                            key={idx}
                                                            label={tag}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: color.bg,
                                                                color: color.text,
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        )}
                                    </Box>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        sx={{
                                            mt: 1,
                                            py: 1.25,
                                            fontWeight: 600,
                                            bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                            boxShadow: "0 4px 6px -1px rgba(102, 126, 234, 0.3)",
                                            "&:hover": {
                                                background: "linear-gradient(135deg, #5568d3 0%, #653a8f 100%)",
                                            },
                                        }}
                                    >
                                        View Details
                                    </Button>
                                </Paper>
                            </Grid>
                        ))
                    ) : (
                        <Grid size={{ xs: 12 }}>
                            <Paper variant="outlined" sx={{ ...outlinedCardSx, textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">No active job listings at the moment</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Stack>
    );

    const renderJobPostSection = () => {
        // Safety check: ensure posts is an array
        const safePosts = Array.isArray(posts) ? posts : [];

        return (
            <Stack spacing={3}>
                <Paper sx={{ ...baseCardSx }}>
                    <Typography variant="h6" gutterBottom>Job Post Performance</Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: "Active Posts", value: safePosts.filter((p) => p.status === "active").length.toString() || "0", color: "primary.main" },
                            { label: "Drafts", value: safePosts.filter((p) => p.status === "draft").length.toString() || "0", color: "warning.main" },
                            { label: "Closed", value: safePosts.filter((p) => p.status === "closed").length.toString() || "0", color: "text.secondary" },
                            // { label: "Applicants", value: "248", color: "success.main" },
                        ].map((stat, index) => (
                            <Grid size={{ xs: 6, md: 3 }} key={index}>
                                <Paper variant="outlined" sx={{ ...outlinedCardSx, textAlign: "center" }}>
                                    <Typography variant="h4" sx={{ color: stat.color }}>{stat.value}</Typography>
                                    <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                <Paper sx={{ ...baseCardSx }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Typography variant="h6">Job Posts</Typography>
                        <Button variant="contained" onClick={() => setCreateJobDialogOpen(true)}>Create Job Post</Button>
                    </Box>
                    <Grid container spacing={2}>
                        {safePosts.length > 0 ? (
                            safePosts.map((post) => (
                                <Grid size={{ xs: 12 }} key={post.id}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            ...outlinedCardSx,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={600}>{post.title}</Typography>
                                                <Typography variant="body2" color="text.secondary">{post.location} • {post.job_type}</Typography>
                                            </Box>
                                            <Chip label={post.status} color={post.status === "active" ? "success" : "default"} size="small" />
                                        </Stack>
                                        {post.description && (
                                            <>
                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>
                                                    รายละเอียดงาน (Job Description)
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                                    {post.description}
                                                </Typography>
                                            </>
                                        )}
                                        {post.responsibilities && (
                                            <>
                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                                                    หน้าที่ความรับผิดชอบ (Responsibilities)
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                                    {post.responsibilities}
                                                </Typography>
                                            </>
                                        )}
                                        {post.qualifications && (
                                            <>
                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                                                    คุณสมบัติ (Qualifications)
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                                    {post.qualifications}
                                                </Typography>
                                            </>
                                        )}
                                        {post.benefits && (
                                            <>
                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                                                    สวัสดิการ (Benefits)
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                                    {post.benefits}
                                                </Typography>
                                            </>
                                        )}
                                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleEditPost(post)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleDeletePost(post)}
                                            >
                                                Delete
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => handleViewApplicants(post)}
                                            >
                                                View Applicants
                                            </Button>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))
                        ) : (
                            <Grid size={{ xs: 12 }}>
                                <Paper variant="outlined" sx={{ ...outlinedCardSx }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No job posts yet. Create your first job post to start attracting candidates.
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            </Stack>
        );
    };

    const renderAccessSection = () => (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...baseCardSx, height: "100%" }}>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <SecurityIcon sx={{ color: "#8b5cf6" }} />
                        <Typography variant="h6">Team Access</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Manage who can access this company profile and their permissions.
                    </Typography>
                    <Stack spacing={2}>
                        {[{ name: "Owner", members: 2 }, { name: "Recruiter", members: 5 }, { name: "Viewer", members: 12 }].map((role) => (
                            <Paper key={role.name} variant="outlined" sx={{ ...outlinedCardSx }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography fontWeight={600}>{role.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{role.members} members</Typography>
                                    </Box>
                                    <Button size="small" variant="outlined">Manage</Button>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ ...baseCardSx, height: "100%" }}>
                    <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <KeyIcon sx={{ color: "#f59e0b" }} />
                        <Typography variant="h6">Access Keys</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Generate or revoke API keys for external integrations.
                    </Typography>
                    <Stack spacing={2}>
                        {[1, 2].map((idx) => (
                            <Paper key={idx} variant="outlined" sx={{ ...outlinedCardSx }}>
                                <Typography fontWeight={600}>Primary Key #{idx}</Typography>
                                <Typography variant="caption" color="text.secondary">Last used 3 days ago</Typography>
                                <Stack direction="row" spacing={1} mt={2}>
                                    <Button size="small" variant="outlined">View</Button>
                                    <Button size="small" color="error">Revoke</Button>
                                </Stack>
                            </Paper>
                        ))}
                        <Button
                            variant="contained"
                            startIcon={<SettingsIcon />}
                            sx={{
                                bgcolor: "#f59e0b",
                                "&:hover": { bgcolor: "#d97706" },
                                boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.3)",
                            }}
                        >
                            Generate New Key
                        </Button>
                    </Stack>
                </Paper>
            </Grid>
        </Grid>
    );

    const renderCandidateSection = () => {
        // Show all applicants across all jobs
        return (
            <Stack spacing={3}>
                <Paper sx={{ ...baseCardSx }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Box>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                Job Applicants
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                View and manage all candidates who applied to your job postings
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack spacing={2}>
                        {posts.map((post) => (
                            <Paper
                                key={post.id}
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    borderColor: "grey.300",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                    },
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" fontWeight={600} gutterBottom>
                                            {post.title}
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                            <Chip
                                                size="small"
                                                label={post.job_type}
                                                sx={{ bgcolor: "primary.50", color: "primary.700" }}
                                            />
                                            <Chip
                                                size="small"
                                                label={post.location}
                                                icon={<UsersIcon sx={{ fontSize: 14 }} />}
                                            />
                                            <Chip
                                                size="small"
                                                label={post.salary_range || "Negotiable"}
                                                sx={{ bgcolor: "success.50", color: "success.700" }}
                                            />
                                        </Stack>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<UsersIcon />}
                                        onClick={() => handleViewApplicants(post)}
                                        sx={{ minWidth: 140 }}
                                    >
                                        View Applicants
                                    </Button>
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Stack direction="row" spacing={4}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} color={post.status === 'active' ? 'success.main' : 'text.secondary'}>
                                            {post.status === 'active' ? 'Active' : 'Inactive'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Posted
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                        {posts.length === 0 && (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Typography color="text.secondary">
                                    No job postings yet. Create your first job post to start receiving applications.
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Paper>

                {candidateProfile && (
                    <Paper sx={{ ...baseCardSx }}>
                        <Typography variant="h6" gutterBottom fontWeight={700} mb={3}>
                            Selected Candidate Profile
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <Avatar
                                        {...(candidateProfile.profile_image_url ? { src: candidateProfile.profile_image_url } : {})}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            mb: 2,
                                            bgcolor: "primary.main",
                                        }}
                                    >
                                        {(candidateProfile.first_name_en || candidateProfile.first_name_th || "U").charAt(0)}
                                    </Avatar>
                                    <Typography variant="h6" fontWeight={700}>
                                        {`${candidateProfile.first_name_en || candidateProfile.first_name_th || ""} ${candidateProfile.last_name_en || candidateProfile.last_name_th || ""}`.trim() || "Unknown"}
                                    </Typography>
                                    {candidateProfile.title && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {candidateProfile.title}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Stack spacing={2}>
                                    {candidateProfile.phone && (
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                            <Typography variant="body1">{candidateProfile.phone}</Typography>
                                        </Box>
                                    )}
                                    {candidateProfile.email && (
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                            <Typography variant="body1">{candidateProfile.email}</Typography>
                                        </Box>
                                    )}
                                    {candidateProfile.about_me && (
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">About</Typography>
                                            <Typography variant="body1">{candidateProfile.about_me}</Typography>
                                        </Box>
                                    )}
                                    <Button
                                        variant="outlined"
                                        onClick={() => setCandidateProfile(null)}
                                    >
                                        Close Profile
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </Stack>
        );
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case "jobpost":
                return renderJobPostSection();
            case "access":
                return renderAccessSection();
            case "candidate":
                return renderCandidateSection();
            default:
                return renderProfileSection();
        }
    };

    const handleViewApplicants = async (post: CompanyPostResponse) => {
        setSelectedJobForApplicants(post);
        setApplicantsDialogOpen(true);
        setApplicantsLoading(true);
        try {
            const response = await jobApplicationAPI.getJobCandidates(post.id);
            if (response.ok && response.data) {
                // Filter out rejected applicants
                setApplicants(response.data.filter((app: any) => app.status !== 'rejected'));
            } else {
                setSnackbar({ open: true, message: "Failed to load applicants", severity: 'error' });
            }
        } catch (error) {
            console.error("Error fetching applicants:", error);
            setSnackbar({ open: true, message: "Error loading applicants", severity: 'error' });
        } finally {
            setApplicantsLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "grey.50", py: 4 }}>
            <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 } }}>
                {/* ... (existing content) ... */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
                    <TextField
                        placeholder="Search here"
                        variant="outlined"
                        size="small"
                        sx={{
                            width: 400,
                            maxWidth: "100%",
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 3,
                                bgcolor: "background.paper",
                                border: "none",
                                boxShadow: 1,
                                "& fieldset": { border: "none" },
                            },
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="disabled" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Box>

                <Grid container spacing={3} alignItems="stretch">
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Stack spacing={3}>
                            <Paper sx={{ ...baseCardSx }}>
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <Box sx={{ position: "relative", mb: 2 }}>
                                        <Avatar
                                            {...(company.logo_url ? { src: company.logo_url } : {})}
                                            sx={{
                                                width: 110,
                                                height: 110,
                                                bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                border: "4px solid",
                                                borderColor: "background.paper",
                                                boxShadow: "0 8px 16px -4px rgba(102, 126, 234, 0.4)",
                                            }}
                                        >
                                            {!company.logo_url && <BuildingIcon sx={{ fontSize: 48, color: "white" }} />}
                                        </Avatar>
                                        <input
                                            accept="image/*"
                                            style={{ display: "none" }}
                                            id="logo-upload"
                                            type="file"
                                            onChange={handleLogoUpload}
                                            disabled={isUploadingLogo}
                                        />
                                        <label htmlFor="logo-upload">
                                            <IconButton
                                                component="span"
                                                disabled={isUploadingLogo}
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    right: 0,
                                                    bgcolor: "#8b5cf6",
                                                    color: "white",
                                                    "&:hover": { bgcolor: "#7c3aed" },
                                                    boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
                                                }}
                                            >
                                                {isUploadingLogo ? <CircularProgress size={20} /> : <PhotoCamera />}
                                            </IconButton>
                                        </label>
                                    </Box>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <Typography variant="h5" fontWeight={700} sx={{ color: "#1e293b" }}>{company.company_name}</Typography>
                                        <CheckCircleIcon sx={{ color: "#10b981" }} fontSize="medium" />
                                    </Box>

                                    <Stack direction="row" spacing={0.5} mb={3}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <StarIcon key={star} sx={{ color: "#FBBF24", fontSize: 20 }} />
                                        ))}
                                    </Stack>

                                    <Box sx={{ width: "100%", mb: 3 }}>
                                        <Stack spacing={2.5}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Industry</Typography>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: "#6366f1" }}>{company.industry || "SaaS / Fintech"}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Founded</Typography>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: "#f59e0b" }}>{company.founded_year || "2018"}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Size</Typography>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: "#10b981" }}>{company.company_size || "50-200 Employees"}</Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Location</Typography>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: "#ef4444" }}>{company.province || "San Francisco, CA"}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Divider sx={{ width: "100%", mb: 3 }} />

                                    <Stack spacing={2.5} width="100%" mb={3}>
                                        {company.website_url && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: "#dbeafe", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
                                                    <GlobeIcon sx={{ fontSize: 20, color: "white" }} />
                                                </Avatar>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                    {formatWebsite(company.website_url)}
                                                </Typography>
                                            </Box>
                                        )}
                                        {company.phone && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: "#fef3c7", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
                                                    <MailIcon sx={{ fontSize: 20, color: "white" }} />
                                                </Avatar>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>{company.phone}</Typography>
                                            </Box>
                                        )}
                                    </Stack>


                                </Box>
                            </Paper>

                            <Paper sx={{ ...baseCardSx }}>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                                    Quick Navigation
                                </Typography>
                                <Stack spacing={1.5}>
                                    {sectionTabs.map((tab) => {
                                        const isActive = activeSection === tab.id;
                                        const Icon = tab.icon;
                                        return (
                                            <Button
                                                key={tab.id}
                                                variant={isActive ? "contained" : "outlined"}
                                                onClick={() => setActiveSection(tab.id)}
                                                fullWidth
                                                startIcon={<Icon fontSize="medium" />}
                                                sx={{
                                                    justifyContent: "flex-start",
                                                    borderRadius: 2.5,
                                                    textTransform: "none",
                                                    fontWeight: 700,
                                                    py: 1.5,
                                                    px: 2.5,
                                                    ...(isActive ? {
                                                        bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                        color: "white",
                                                        borderColor: "transparent",
                                                        boxShadow: "0 4px 6px -1px rgba(102, 126, 234, 0.3)",
                                                        "&:hover": {
                                                            background: "linear-gradient(135deg, #5568d3 0%, #653a8f 100%)",
                                                        },
                                                    } : {
                                                        borderColor: "grey.300",
                                                        color: "#64748b",
                                                        "&:hover": {
                                                            bgcolor: "#f1f5f9",
                                                            borderColor: "#cbd5e1",
                                                        },
                                                    }),
                                                }}
                                            >
                                                <Box sx={{ textAlign: "left" }}>
                                                    <Typography variant="body2">{tab.label}</Typography>
                                                </Box>
                                            </Button>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 9 }}>
                        {renderSectionContent()}
                    </Grid>
                </Grid>
            </Box>

            {/* Create Job Post Dialog */}
            {company && (
                <CreateJobPostDialog
                    open={createJobDialogOpen}
                    onClose={() => setCreateJobDialogOpen(false)}
                    companyId={company.id}
                    onSuccess={refreshPosts}
                />
            )}

            {/* Edit Job Post Dialog */}
            {company && selectedPost && (
                <CreateJobPostDialog
                    open={editJobDialogOpen}
                    onClose={() => {
                        setEditJobDialogOpen(false);
                        setSelectedPost(null);
                    }}
                    companyId={company.id}
                    post={selectedPost}
                    onSuccess={refreshPosts}
                />
            )}

            {/* Delete Job Post Dialog */}
            <DeleteJobPostDialog
                open={deleteDialogOpen}
                postTitle={postToDelete?.title || ""}
                isDeleting={isDeleting}
                error={deleteError}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
            />

            {/* Applicants Dialog */}
            <Dialog
                open={applicantsDialogOpen}
                onClose={() => setApplicantsDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Applicants</Typography>
                        {selectedJobForApplicants && (
                            <Typography variant="body2" color="text.secondary">
                                for {selectedJobForApplicants.title}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={() => setApplicantsDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {applicantsLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : applicants.length > 0 ? (
                        <Stack spacing={2}>
                            {(() => {
                                console.log("Applicants data:", applicants);
                                return applicants.map((applicant) => {
                                    console.log("Applicant status:", applicant.status, "for", applicant.first_name);
                                    return (
                                        <Paper key={applicant.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar
                                                    {...(applicant.profile_image_url ? { src: applicant.profile_image_url } : {})}
                                                    sx={{ width: 56, height: 56 }}
                                                >
                                                    {(applicant.first_name || "U").charAt(0)}
                                                </Avatar>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {applicant.first_name} {applicant.last_name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Applied on {new Date(applicant.created_at).toLocaleDateString()}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} mt={0.5}>
                                                        {applicant.email && (
                                                            <Chip size="small" icon={<MailIcon sx={{ fontSize: 14 }} />} label={applicant.email} />
                                                        )}
                                                        {applicant.phone && (
                                                            <Chip size="small" label={applicant.phone} />
                                                        )}
                                                        <Chip
                                                            size="small"
                                                            label={applicant.status}
                                                            color={applicant.status === 'pending' ? 'warning' : applicant.status === 'accepted' ? 'success' : 'error'}
                                                        />
                                                    </Stack>
                                                </Box>
                                                <Stack direction="column" spacing={1} sx={{ minWidth: 140 }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        fullWidth
                                                        component="a"
                                                        href={`/profile/${applicant.user_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        View Profile
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        color="success"
                                                        fullWidth
                                                        disabled={applicant.status === 'accepted'}
                                                        onClick={async () => {
                                                            try {
                                                                const response = await jobApplicationAPI.updateApplicationStatus(applicant.id, 'accepted');
                                                                if (response.ok) {
                                                                    setSnackbar({ open: true, message: "Candidate accepted", severity: 'success' });
                                                                    // Refresh applicants list
                                                                    if (selectedJobForApplicants) {
                                                                        const refreshResponse = await jobApplicationAPI.getJobCandidates(selectedJobForApplicants.id);
                                                                        if (refreshResponse.ok && refreshResponse.data) {
                                                                            setApplicants(refreshResponse.data.filter((app: any) => app.status !== 'rejected'));
                                                                        }
                                                                    }
                                                                } else {
                                                                    setSnackbar({ open: true, message: "Failed to accept candidate", severity: 'error' });
                                                                }
                                                            } catch (error) {
                                                                console.error("Error accepting candidate:", error);
                                                                setSnackbar({ open: true, message: "Error accepting candidate", severity: 'error' });
                                                            }
                                                        }}
                                                    >
                                                        รับ
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        color="error"
                                                        fullWidth
                                                        disabled={applicant.status === 'rejected'}
                                                        onClick={async () => {
                                                            try {
                                                                const response = await jobApplicationAPI.updateApplicationStatus(applicant.id, 'rejected');
                                                                if (response.ok) {
                                                                    setSnackbar({ open: true, message: "Candidate rejected", severity: 'info' });
                                                                    // Remove from local state immediately
                                                                    setApplicants(prev => prev.filter(app => app.id !== applicant.id));

                                                                    // Refresh applicants list
                                                                    if (selectedJobForApplicants) {
                                                                        const refreshResponse = await jobApplicationAPI.getJobCandidates(selectedJobForApplicants.id);
                                                                        if (refreshResponse.ok && refreshResponse.data) {
                                                                            setApplicants(refreshResponse.data.filter((app: any) => app.status !== 'rejected'));
                                                                        }
                                                                    }
                                                                } else {
                                                                    setSnackbar({ open: true, message: "Failed to reject candidate", severity: 'error' });
                                                                }
                                                            } catch (error) {
                                                                console.error("Error rejecting candidate:", error);
                                                                setSnackbar({ open: true, message: "Error rejecting candidate", severity: 'error' });
                                                            }
                                                        }}
                                                    >
                                                        ไม่รับ
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    );
                                });
                            })()}
                        </Stack>
                    ) : (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <Typography color="text.secondary">No applicants yet.</Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* View All Gallery Dialog */}
            <Dialog
                open={viewAllGalleryOpen}
                onClose={() => setViewAllGalleryOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography component="span" variant="h6" fontWeight={700}>Company Gallery</Typography>
                    <IconButton onClick={() => setViewAllGalleryOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                        {galleries.map((gallery, index) => (
                            <Box
                                key={gallery.id}
                                onClick={() => {
                                    setSelectedImageIndex(index);
                                    setViewAllGalleryOpen(false);
                                    setImageViewerOpen(true);
                                }}
                                sx={{
                                    aspectRatio: "1/1",
                                    borderRadius: 2,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    position: "relative",
                                    "&:hover": {
                                        transform: "scale(1.05)",
                                        transition: "transform 0.2s ease",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                        "& .gallery-actions": {
                                            opacity: 1,
                                        },
                                    },
                                }}
                            >
                                <img
                                    src={gallery.image_url}
                                    alt={`Gallery ${index + 1}`}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <Box
                                    className="gallery-actions"
                                    sx={{
                                        position: "absolute",
                                        top: 8,
                                        right: 8,
                                        display: "flex",
                                        gap: 0.5,
                                        opacity: 0,
                                        transition: "opacity 0.2s ease",
                                    }}
                                >
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteGalleryClick(gallery.id, e);
                                        }}
                                        disabled={isDeletingGallery === gallery.id}
                                        size="small"
                                        sx={{
                                            bgcolor: "rgba(239, 68, 68, 0.8)",
                                            borderRadius: "50%",
                                            p: 0.5,
                                            minWidth: "auto",
                                            width: 28,
                                            height: 28,
                                            "&:hover": {
                                                bgcolor: "rgba(239, 68, 68, 1)",
                                            },
                                        }}
                                    >
                                        {isDeletingGallery === gallery.id ? (
                                            <CircularProgress size={14} sx={{ color: "white" }} />
                                        ) : (
                                            <DeleteIcon sx={{ color: "white", fontSize: 14 }} />
                                        )}
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Image Viewer Dialog */}
            <Dialog
                open={imageViewerOpen}
                onClose={() => setImageViewerOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        bgcolor: "rgba(0,0,0,0.9)",
                        color: "white",
                    },
                }}
            >
                <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
                    <Typography component="span" variant="h6" fontWeight={700}>
                        Image {selectedImageIndex + 1} of {galleries.length}
                    </Typography>
                    <IconButton onClick={() => setImageViewerOpen(false)} sx={{ color: "white" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ position: "relative", p: 0 }}>
                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            minHeight: "60vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "rgba(0,0,0,0.5)",
                        }}
                    >
                        {galleries[selectedImageIndex] && (
                            <Box
                                component="img"
                                src={galleries[selectedImageIndex].image_url}
                                alt={`Gallery ${selectedImageIndex + 1}`}
                                sx={{
                                    maxWidth: "100%",
                                    maxHeight: "80vh",
                                    objectFit: "contain",
                                }}
                            />
                        )}

                        {galleries.length > 1 && (
                            <>
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleries.length - 1));
                                    }}
                                    sx={{
                                        position: "absolute",
                                        left: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        bgcolor: "rgba(255,255,255,0.2)",
                                        color: "white",
                                        "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                                    }}
                                >
                                    <NavigateBeforeIcon />
                                </IconButton>
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex((prev) => (prev < galleries.length - 1 ? prev + 1 : 0));
                                    }}
                                    sx={{
                                        position: "absolute",
                                        right: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        bgcolor: "rgba(255,255,255,0.2)",
                                        color: "white",
                                        "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                                    }}
                                >
                                    <NavigateNextIcon />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button onClick={() => setImageViewerOpen(false)} sx={{ color: "white" }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Gallery Confirmation Dialog */}
            <Dialog
                open={deleteGalleryDialogOpen}
                onClose={handleDeleteGalleryCancel}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    },
                }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
                    <DeleteIcon sx={{ color: "error.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                        ยืนยันการลบรูปภาพ
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        คุณต้องการลบรูปภาพนี้หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={handleDeleteGalleryCancel}
                        variant="outlined"
                        sx={{
                            minWidth: 100,
                        }}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleDeleteGalleryConfirm}
                        variant="contained"
                        color="error"
                        disabled={isDeletingGallery !== null}
                        sx={{
                            minWidth: 100,
                        }}
                    >
                        {isDeletingGallery ? <CircularProgress size={20} /> : "ลบ"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default function CompanyProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CompanyProfilePageContent />
        </Suspense>
    );
}
