/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Typography,
    Avatar,
    Stack,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Paper,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,

} from "@mui/material";
import {
    Business as BuildingIcon,
    CheckCircle as CheckCircleIcon,
    Star as StarIcon,
    Language as GlobeIcon,
    Email as MailIcon,

    ArrowBack as ArrowBackIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import { useParams } from "next/navigation";
import Link from "next/link";
import { companyAPI, CompanyResponse, CompanyGalleryResponse, CompanyPostResponse } from "@/app/lib/api";
import { Work as BriefcaseIcon, People as UsersIcon } from "@mui/icons-material";
import { Button } from "@mui/material";

export default function PublicCompanyProfilePage() {
    const params = useParams();
    const companyId = params.companyId as string;

    const [company, setCompany] = useState<CompanyResponse | null>(null);
    const [galleries, setGalleries] = useState<CompanyGalleryResponse[]>([]);
    const [posts, setPosts] = useState<CompanyPostResponse[]>([]);
    const [selectedJob, setSelectedJob] = useState<CompanyPostResponse | null>(null);
    const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch company details by company_id
                console.log('Fetching company with ID:', companyId);
                const companyRes = await companyAPI.getCompanyById(companyId);
                console.log('Company API response:', {
                    ok: companyRes.ok,
                    status: companyRes.status,
                    data: companyRes.data,
                    dataType: typeof companyRes.data
                });

                if (!companyRes.ok) {
                    console.error('Company API error:', {
                        ok: companyRes.ok,
                        status: companyRes.status,
                        data: companyRes.data
                    });
                    if (companyRes.status === 404) {
                        setError('Company profile not found. Please check if the company ID is correct.');
                    } else {
                        const errorMsg = typeof companyRes.data === 'string'
                            ? companyRes.data
                            : `Failed to load company profile: ${companyRes.status}`;
                        setError(errorMsg);
                    }
                    return;
                }

                // Check if data is valid company object
                // Handle case where backend returns plain text on 404 (shouldn't happen but just in case)
                if (!companyRes.data) {
                    console.error('No company data received');
                    setError('No company data received from server.');
                    return;
                }

                // If data is a string (plain text error), treat as error
                if (typeof companyRes.data === 'string') {
                    console.error('Received string instead of company object:', companyRes.data);
                    setError(companyRes.data || 'Invalid response from server.');
                    return;
                }

                // Check if it's a valid company object
                if (typeof companyRes.data !== 'object' || !('id' in companyRes.data)) {
                    console.error('Invalid company data structure:', companyRes.data);
                    setError('Invalid company data structure received.');
                    return;
                }

                setCompany(companyRes.data as CompanyResponse);

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
                        // Filter only active posts
                        const activePosts = postsRes.data.filter((post) => post.status === 'active');
                        setPosts(activePosts);
                    }
                }
            } catch (err) {
                console.error('Error fetching company data:', err);
                setError('Failed to load company profile. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (companyId) {
            fetchData();
        }
    }, [companyId]);


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

    const handleViewJobDetails = (post: CompanyPostResponse) => {
        setSelectedJob(post);
        setJobDetailsOpen(true);
    };

    const handleCloseJobDetails = () => {
        setJobDetailsOpen(false);
        setTimeout(() => setSelectedJob(null), 200); // Clear after animation
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!company) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="info">No company profile found.</Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "grey.50", py: 4 }}>
            <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
                <Box sx={{ mb: 3 }}>
                    <Button
                        component={Link}
                        href="/jobs"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            color: 'text.secondary',
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                        }}
                    >
                        Back to Jobs
                    </Button>
                </Box>
                <Grid container spacing={3} alignItems="stretch">
                    {/* Sidebar */}
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Paper sx={{ ...baseCardSx }}>
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <Avatar
                                    {...(company.logo_url ? { src: company.logo_url } : {})}
                                    sx={{
                                        width: 110,
                                        height: 110,
                                        bgcolor: "primary.light",
                                        mb: 2,
                                        border: "4px solid",
                                        borderColor: "background.paper",
                                        boxShadow: "0 8px 16px -4px rgb(59 130 246 / 0.3)",
                                    }}
                                >
                                    {!company.logo_url && <BuildingIcon sx={{ fontSize: 48, color: "primary.main" }} />}
                                </Avatar>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <Typography variant="h5" fontWeight={700}>{company.company_name}</Typography>
                                    {company.is_verified && <CheckCircleIcon color="primary" fontSize="medium" />}
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
                                            <Typography variant="body2" fontWeight={700} color="primary.main">{company.industry || "-"}</Typography>
                                        </Box>
                                        {company.founded_year && (
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Founded</Typography>
                                                <Typography variant="body2" fontWeight={700} color="primary.main">{company.founded_year}</Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Size</Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary.main">{company.company_size || "-"}</Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Location</Typography>
                                            <Typography variant="body2" fontWeight={700} color="primary.main">{company.province || "-"}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                <Box sx={{ width: "100%", mb: 3, borderTop: "1px solid", borderColor: "divider", pt: 3 }}>
                                    <Stack spacing={2.5}>
                                        {company.website_url && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.light" }}>
                                                    <GlobeIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                                </Avatar>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                    {formatWebsite(company.website_url)}
                                                </Typography>
                                            </Box>
                                        )}
                                        {company.phone && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.light" }}>
                                                    <MailIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                                </Avatar>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>{company.phone}</Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>


                            </Box>
                        </Paper>
                    </Grid>

                    {/* Main Content - Profile Overview */}
                    <Grid size={{ xs: 12, md: 9 }}>
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
                                                { label: "Open Positions", value: posts.length.toString(), color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
                                                { label: "Employees", value: "850+", color: "#22c55e", gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" },
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
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{
                                                    minWidth: "auto",
                                                    px: 2.5,
                                                    py: 1,
                                                    fontSize: "0.75rem",
                                                    boxShadow: "0 4px 6px -1px rgb(59 130 246 / 0.3)",
                                                }}
                                            >
                                                View All
                                            </Button>
                                        </Box>

                                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                                            {galleries.length > 0 ? (
                                                galleries.slice(0, 9).map((gallery) => (
                                                    <Box
                                                        key={gallery.id}
                                                        sx={{
                                                            aspectRatio: "1/1",
                                                            borderRadius: 2.5,
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            boxShadow: "0 2px 4px 0 rgb(0 0 0 / 0.1)",
                                                            "&:hover": { opacity: 0.9 },
                                                        }}
                                                    >
                                                        <img
                                                            src={gallery.image_url}
                                                            alt="Company Gallery"
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
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
                                            bgcolor: "primary.main",
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
                                                            <Typography variant="subtitle2" color="primary" fontWeight={700}>
                                                                {post.salary_range}
                                                            </Typography>
                                                        )}
                                                        {post.tags && post.tags.length > 0 && (
                                                            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                                                                {post.tags.map((tag, idx) => (
                                                                    <Chip key={idx} label={tag} size="small" sx={{ bgcolor: "primary.light", color: "primary.main" }} />
                                                                ))}
                                                            </Stack>
                                                        )}
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        onClick={() => handleViewJobDetails(post)}
                                                        sx={{
                                                            mt: 1,
                                                            py: 1.25,
                                                            fontWeight: 600,
                                                            boxShadow: "0 4px 6px -1px rgb(59 130 246 / 0.3)",
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
                    </Grid>
                </Grid>
            </Container>

            {/* Job Details Dialog */}
            <Dialog
                open={jobDetailsOpen}
                onClose={handleCloseJobDetails}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                {selectedJob && (
                    <>
                        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 1 }}>
                            <Box>
                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    {selectedJob.title}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                    <Chip
                                        size="small"
                                        label={selectedJob.job_type}
                                        sx={{ bgcolor: "primary.50", color: "primary.700", fontWeight: 600 }}
                                    />
                                    <Chip
                                        size="small"
                                        label={selectedJob.location}
                                        icon={<UsersIcon sx={{ fontSize: 14 }} />}
                                        sx={{ bgcolor: "grey.100", fontWeight: 500 }}
                                    />
                                    {selectedJob.salary_range && (
                                        <Chip
                                            size="small"
                                            label={selectedJob.salary_range}
                                            sx={{ bgcolor: "success.50", color: "success.700", fontWeight: 600 }}
                                        />
                                    )}
                                </Stack>
                            </Box>
                            <IconButton onClick={handleCloseJobDetails} size="small">
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Stack spacing={3} sx={{ py: 1 }}>
                                {selectedJob.description && (
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            รายละเอียดงาน (Job Description)
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                                            {selectedJob.description}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedJob.responsibilities && (
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            หน้าที่ความรับผิดชอบ (Responsibilities)
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                                            {selectedJob.responsibilities}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedJob.qualifications && (
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            คุณสมบัติ (Qualifications)
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                                            {selectedJob.qualifications}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedJob.benefits && (
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            สวัสดิการ (Benefits)
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                                            {selectedJob.benefits}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedJob.tags && selectedJob.tags.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Tags
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                            {selectedJob.tags.map((tag, idx) => (
                                                <Chip key={idx} label={tag} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5 }}>
                            <Button onClick={handleCloseJobDetails} variant="outlined" sx={{ borderRadius: 2 }}>
                                Close
                            </Button>
                            <Button
                                variant="contained"
                                component={Link}
                                href={`/jobs`} // Ideally this would link to a specific job page if available, or just back to jobs list
                                sx={{ borderRadius: 2, px: 4 }}
                            >
                                Apply Now
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
