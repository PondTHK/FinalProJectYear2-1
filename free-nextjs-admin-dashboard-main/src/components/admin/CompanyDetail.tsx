"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Avatar,
  Button,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Flag as MissionIcon,
  Visibility as VisionIcon,
  Category as IndustryIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as VerifiedIcon,
  Work as WorkIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { companyAPI } from "../../../../app/lib/api";
import type { CompanyResponse, CompanyPostResponse, CompanyGalleryResponse } from "../../../../app/lib/api";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";

interface CompanyDetailProps {
  companyId: string;
}

export default function CompanyDetail({ companyId }: CompanyDetailProps) {
  const router = useRouter();

  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [posts, setPosts] = useState<CompanyPostResponse[]>([]);
  const [galleries, setGalleries] = useState<CompanyGalleryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId || !mounted) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch company details
        const companyRes = await companyAPI.getCompanyById(companyId);
        if (redirectToLoginIfUnauthorized(companyRes.status)) {
          return;
        }

        if (!companyRes.ok || !companyRes.data) {
          setError("ไม่พบข้อมูลบริษัท");
          return;
        }

        setCompany(companyRes.data);

        // Fetch company posts
        const postsRes = await companyAPI.getPosts(companyId);
        if (postsRes.ok && postsRes.data) {
          setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        }

        // Fetch company galleries
        const galleriesRes = await companyAPI.getGalleries(companyId);
        if (galleriesRes.ok && galleriesRes.data) {
          setGalleries(Array.isArray(galleriesRes.data) ? galleriesRes.data : []);
        }
      } catch (err) {
        console.error("Failed to fetch company data:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, mounted]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error || !company) {
    return (
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          กลับ
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || "ไม่พบข้อมูลบริษัท"}
        </Alert>
      </Box>
    );
  }

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "อนุมัติแล้ว";
      case "pending":
        return "รอการอนุมัติ";
      case "rejected":
        return "ถูกปฏิเสธ";
      default:
        return status;
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("คุณต้องการลบโพสต์งานนี้หรือไม่?")) {
      return;
    }

    try {
      const response = await companyAPI.deletePost(postId);
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }

      if (response.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert("ไม่สามารถลบโพสต์งานได้");
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("เกิดข้อผิดพลาดในการลบโพสต์งาน");
    }
  };

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <Box display="flex" alignItems="flex-start" gap={2} py={1}>
        <Box sx={{ color: "primary.main", mt: 0.5 }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {label}
          </Typography>
          <Typography variant="body2" color="text.primary">
            {value}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.back()}
        sx={{ mb: 3 }}
        variant="text"
      >
        กลับ
      </Button>

      {/* Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.200",
          background: "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
        }}
      >
        <Box display="flex" alignItems="flex-start" gap={3} flexWrap="wrap">
          {/* Company Logo */}
          <Avatar
            src={company.logo_url || undefined}
            sx={{
              width: 100,
              height: 100,
              bgcolor: "primary.100",
              border: "3px solid",
              borderColor: "primary.200",
            }}
          >
            <BusinessIcon sx={{ fontSize: 48, color: "primary.main" }} />
          </Avatar>

          {/* Company Info */}
          <Box flex={1} minWidth={200}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {company.company_name}
              </Typography>
              {company.is_verified && (
                <VerifiedIcon sx={{ color: "primary.main", fontSize: 28 }} />
              )}
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip
                label={getStatusLabel(company.status)}
                color={getStatusColor(company.status)}
                size="small"
              />
              {company.industry && (
                <Chip
                  icon={<IndustryIcon />}
                  label={company.industry}
                  variant="outlined"
                  size="small"
                />
              )}
              {company.company_size && (
                <Chip
                  icon={<PeopleIcon />}
                  label={company.company_size}
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>

            {company.description && (
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                {company.description}
              </Typography>
            )}
          </Box>

          {/* Stats */}
          <Stack direction="row" spacing={2}>
            <Paper
              variant="outlined"
              sx={{ p: 2, textAlign: "center", minWidth: 100, borderRadius: 2 }}
            >
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {posts.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                โพสต์งาน
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 2, textAlign: "center", minWidth: 100, borderRadius: 2 }}
            >
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {galleries.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                รูปภาพ
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Contact Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2}>
              ข้อมูลติดต่อ
            </Typography>
            <Stack divider={<Divider />}>
              <InfoRow icon={<EmailIcon />} label="อีเมล" value={company.email} />
              <InfoRow icon={<PhoneIcon />} label="โทรศัพท์" value={company.phone} />
              <InfoRow
                icon={<LocationIcon />}
                label="ที่อยู่"
                value={
                  [company.address_detail, company.subdistrict, company.district, company.province, company.postal_code]
                    .filter(Boolean)
                    .join(", ") || null
                }
              />
              <InfoRow icon={<CalendarIcon />} label="ปีที่ก่อตั้ง" value={company.founded_year} />
            </Stack>
          </Paper>
        </Grid>

        {/* Mission & Vision */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: "100%",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2}>
              วิสัยทัศน์และพันธกิจ
            </Typography>
            <Stack spacing={3}>
              {company.vision && (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <VisionIcon sx={{ color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight="600">
                      วิสัยทัศน์ (Vision)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                    {company.vision}
                  </Typography>
                </Box>
              )}
              {company.mission && (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <MissionIcon sx={{ color: "primary.main" }} />
                    <Typography variant="subtitle2" fontWeight="600">
                      พันธกิจ (Mission)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                    {company.mission}
                  </Typography>
                </Box>
              )}
              {!company.vision && !company.mission && (
                <Typography variant="body2" color="text.secondary">
                  ยังไม่ได้ระบุข้อมูล
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Job Posts */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <WorkIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" fontWeight="bold">
                  โพสต์งาน ({posts.length})
                </Typography>
              </Box>
            </Box>

            {posts.length === 0 ? (
              <Box textAlign="center" py={4}>
                <WorkIcon sx={{ fontSize: 48, color: "grey.300", mb: 1 }} />
                <Typography color="text.secondary">ยังไม่มีโพสต์งาน</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {posts.map((post) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={post.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": {
                          borderColor: "primary.main",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        },
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                            {post.title}
                          </Typography>
                          <Chip
                            label={post.status === "active" ? "เปิดรับ" : post.status === "closed" ? "ปิดรับ" : "แบบร่าง"}
                            size="small"
                            color={post.status === "active" ? "success" : "default"}
                            sx={{ ml: 1, fontSize: "0.65rem", height: 20 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          📍 {post.location}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          💼 {post.job_type}
                        </Typography>
                        {post.salary_range && (
                          <Typography variant="caption" color="success.main" fontWeight="600">
                            💰 {post.salary_range}
                          </Typography>
                        )}
                        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon fontSize="small" />}
                            onClick={() => handleDeletePost(post.id)}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          >
                            ลบโพสต์
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Gallery */}
        {galleries.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "grey.200",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3}>
                รูปภาพบริษัท ({galleries.length})
              </Typography>
              <Grid container spacing={2}>
                {galleries.map((gallery) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={gallery.id}>
                    <Box
                      component="img"
                      src={gallery.image_url}
                      alt="Company gallery"
                      sx={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "scale(1.02)",
                        },
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Metadata */}
        <Grid size={{ xs: 12 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              divider={<Divider orientation="vertical" flexItem />}
            >
              <Typography variant="caption" color="text.secondary">
                🆔 Company ID: <code>{company.id}</code>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                📅 สร้างเมื่อ:{" "}
                {new Date(company.created_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                🔄 อัปเดตล่าสุด:{" "}
                {new Date(company.updated_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

