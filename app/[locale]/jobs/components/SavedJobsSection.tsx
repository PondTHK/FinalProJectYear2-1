"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,

  Stack,
  Typography,
  CircularProgress,
  Alert,
  Collapse,
  Snackbar,
} from "@mui/material";
import { Alert as MuiAlert } from "@mui/material";
import { Bookmark, Building2, MapPin, Trash2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { userAPI, companyAPI, type SavedJobResponse } from "@/app/lib/api";
import { JobCardData } from "@/app/lib/jobs";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

interface SavedJobsSectionProps {
  isLoggedIn: boolean;
  onBackToJobs: () => void;
}

export function SavedJobsSection({ isLoggedIn, onBackToJobs }: SavedJobsSectionProps) {
  const router = useRouter();
  const [, setSavedJobs] = useState<SavedJobResponse[]>([]);
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchSavedJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        const savedResponse = await userAPI.getSavedJobs();
        if (!savedResponse.ok) {
          throw new Error("Failed to fetch saved jobs");
        }

        const saved = savedResponse.data || [];
        setSavedJobs(saved);

        // Fetch all posts to get job details
        const postsResponse = await companyAPI.getAllPosts();
        if (!postsResponse.ok) {
          throw new Error("Failed to fetch job posts");
        }

        // Map saved jobs to job cards
        const savedPostIds = new Set(saved.map((sj) => sj.post_id));
        const savedPosts = (postsResponse.data || []).filter((post) =>
          savedPostIds.has(post.id)
        );

        const transformedJobs = savedPosts.map((post, index) => ({
          id: index + 1,
          company: `Company ${post.company_id.slice(0, 8)}`,
          company_id: post.company_id,
          post_id: post.id,
          role: post.title,
          location: post.location,
          onsite: (post.location.toLowerCase().includes("remote")
            ? "Remote"
            : post.location.toLowerCase().includes("hybrid")
              ? "Hybrid"
              : "On-site") as any,
          rate: post.salary_range || "Negotiable",
          type: post.job_type as any,
          applicants: "0 /50",
          level: "Mid" as any,
          time: new Date(post.created_at).toLocaleDateString(),
          sortIndex: index,
          tags: post.tags || [],
          description: post.description
            ? post.description.split("\n").filter((line) => line.trim())
            : ["No description provided."],
          responsibilities: post.responsibilities || "",
          qualifications: post.qualifications || "",
          benefits: post.benefits || "",
        }));

        setJobs(transformedJobs);
      } catch (err) {
        console.error("Error fetching saved jobs:", err);
        setError(err instanceof Error ? err.message : "Failed to load saved jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, [isLoggedIn]);

  // Load applied jobs from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && isLoggedIn) {
      const saved = localStorage.getItem("applied_jobs");
      if (saved) {
        try {
          const applied = JSON.parse(saved) as string[];
          setAppliedJobs(new Set(applied));
        } catch (e) {
          console.error("Failed to load applied jobs", e);
        }
      }
    }
  }, [isLoggedIn]);

  const handleUnsave = async (postId: string) => {
    setUnsavingId(postId);
    try {
      const response = await userAPI.unsaveJob(postId);
      if (response.ok) {
        setSavedJobs((prev) => prev.filter((sj) => sj.post_id !== postId));
        setJobs((prev) => prev.filter((j) => j.post_id !== postId));
        if (expandedJobId === postId) {
          setExpandedJobId(null);
        }
      } else {
        throw new Error("Failed to unsave job");
      }
    } catch (err) {
      console.error("Error unsaving job:", err);
      setError(err instanceof Error ? err.message : "Failed to unsave job");
    } finally {
      setUnsavingId(null);
    }
  };

  const handleToggleDetails = (postId: string) => {
    setExpandedJobId(expandedJobId === postId ? null : postId);
  };

  const isJobApplied = (job: JobCardData): boolean => {
    if (!job.post_id) return false;
    return appliedJobs.has(job.post_id);
  };

  const handleApply = (job: JobCardData) => {
    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }

    if (!job.company_id || !job.post_id) {
      return;
    }

    // Check if already applied
    const jobKey = job.post_id;
    if (appliedJobs.has(jobKey)) {
      setNotificationMessage(`คุณได้สมัครงานที่ ${job.company} ไปแล้ว`);
      setNotificationOpen(true);
      return;
    }

    // Save to localStorage
    const newAppliedJobs = new Set(appliedJobs);
    newAppliedJobs.add(jobKey);
    setAppliedJobs(newAppliedJobs);

    if (typeof window !== "undefined") {
      localStorage.setItem("applied_jobs", JSON.stringify(Array.from(newAppliedJobs)));
    }

    // Show notification
    setNotificationMessage(`สมัครงานที่ ${job.company} สำเร็จ!`);
    setNotificationOpen(true);

    // Redirect to company profile page after a short delay
    setTimeout(() => {
      router.push(`/companies/${job.company_id}`);
    }, 1500);
  };

  if (!isLoggedIn) {
    return (
      <Container maxWidth="lg" className="!px-5 md:!px-8 !py-10">
        <Card variant="outlined" sx={{ borderRadius: 5, p: 4, textAlign: "center" }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            กรุณาเข้าสู่ระบบเพื่อดูงานที่บันทึกไว้
          </Typography>
          <Button variant="contained" onClick={onBackToJobs}>
            กลับไปดูงาน
          </Button>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" className="!px-5 md:!px-8 !py-10">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className="!px-5 md:!px-8 !py-10">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={onBackToJobs}>
          กลับไปดูงาน
        </Button>
      </Container>
    );
  }

  if (jobs.length === 0) {
    return (
      <Container maxWidth="lg" className="!px-5 md:!px-8 !py-10">
        <Card variant="outlined" sx={{ borderRadius: 5, p: 4, textAlign: "center" }}>
          <Bookmark size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
          <Typography variant="h6" fontWeight={700} mb={2}>
            ยังไม่มีงานที่บันทึกไว้
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            บันทึกงานที่คุณสนใจเพื่อดูในภายหลัง
          </Typography>
          <Button variant="contained" onClick={onBackToJobs}>
            ไปดูงาน
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="!px-5 md:!px-8 !py-10">
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={800}>
            งานที่บันทึกไว้ ({jobs.length})
          </Typography>
          <Button variant="outlined" onClick={onBackToJobs}>
            กลับไปดูงาน
          </Button>
        </Box>

        <Stack spacing={2}>
          {jobs.map((job) => (
            <Box key={job.post_id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight={700} mb={1}>
                          {job.role}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                          <Building2 size={16} style={{ opacity: 0.6 }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.company}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MapPin size={16} style={{ opacity: 0.6 }} />
                          <Typography variant="body2" color="text.secondary">
                            {job.location} • {job.onsite}
                          </Typography>
                        </Stack>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Trash2 size={16} />}
                        onClick={() => job.post_id && handleUnsave(job.post_id)}
                        disabled={unsavingId === job.post_id}
                      >
                        {unsavingId === job.post_id ? "กำลังลบ..." : "ลบ"}
                      </Button>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label={job.rate} />
                      <Chip size="small" label={job.type} />
                      <Chip size="small" label={job.level} />
                    </Stack>

                    {job.description && job.description.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {job.description[0].substring(0, 150)}
                        {job.description[0].length > 150 ? "..." : ""}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: "none" }}
                        onClick={() => job.post_id && handleToggleDetails(job.post_id)}
                        endIcon={expandedJobId === job.post_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      >
                        {expandedJobId === job.post_id ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                      </Button>
                    </Stack>

                    {/* Expanded Details */}
                    <Collapse in={expandedJobId === job.post_id}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                        <Stack spacing={2}>
                          {/* Job Description */}
                          {job.description && job.description.length > 0 && (
                            <>
                              <Typography variant="subtitle2" fontWeight={600}>
                                รายละเอียดงาน (Job Description)
                              </Typography>
                              {job.description.map((p, i) => (
                                <Typography key={i} variant="body2" color="text.secondary">
                                  {p}
                                </Typography>
                              ))}
                            </>
                          )}

                          {/* Responsibilities */}
                          {job.responsibilities && (
                            <>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                                หน้าที่ความรับผิดชอบ (Responsibilities)
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                {job.responsibilities}
                              </Typography>
                            </>
                          )}

                          {/* Qualifications */}
                          {job.qualifications && (
                            <>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                                คุณสมบัติ (Qualifications)
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                {job.qualifications}
                              </Typography>
                            </>
                          )}

                          {/* Benefits */}
                          {job.benefits && (
                            <>
                              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                                สวัสดิการ (Benefits)
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                {job.benefits}
                              </Typography>
                            </>
                          )}

                          {/* Tags */}
                          {job.tags && job.tags.length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                              {job.tags.map((t) => (
                                <Chip key={t} size="small" label={t} />
                              ))}
                            </Stack>
                          )}

                          {/* Company Info */}
                          <Box sx={{ mt: 2, p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                              <ShieldCheck size={16} style={{ opacity: 0.6 }} />
                              <Typography variant="body2" fontWeight={600}>
                                Verified Company
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {job.location}
                            </Typography>
                          </Box>

                          {/* Action Buttons */}
                          <Stack direction="row" spacing={1.2} sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              disableElevation
                              onClick={() => handleApply(job)}
                              disabled={isJobApplied(job)}
                              fullWidth
                            >
                              {isJobApplied(job) ? "สมัครแล้ว" : "Apply"}
                            </Button>
                            {job.company_id && (
                              <NextLink href={`/companies/${job.company_id}`} passHref>
                                <Button variant="outlined" fullWidth sx={{ textTransform: "none" }}>
                                  ดูข้อมูลบริษัท
                                </Button>
                              </NextLink>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
                    </Collapse>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Stack>
      </Stack>

      {/* Notification Snackbar */}
      <Snackbar
        open={notificationOpen}
        autoHideDuration={3000}
        onClose={() => setNotificationOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={() => setNotificationOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {notificationMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
}

