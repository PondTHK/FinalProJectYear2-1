"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Card,
  CardContent,
  Button,
  Collapse,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { companyAPI, adminAPI } from "../../../../app/lib/api";
import type { CompanyPostResponse, CompanyResponse } from "../../../../app/lib/api";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";

interface JobPostWithCompany extends CompanyPostResponse {
  company?: CompanyResponse;
}

export default function JobPostsList() {
  const [posts, setPosts] = useState<JobPostWithCompany[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  
  // Expanded cards state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpand = (postId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all posts
      const postsResponse = await companyAPI.getAllPosts();
      if (redirectToLoginIfUnauthorized(postsResponse.status)) {
        return;
      }
      
      if (!postsResponse.ok) {
        setError("ไม่สามารถโหลดข้อมูลโพสต์งานได้");
        return;
      }

      // Fetch all companies
      const companiesResponse = await adminAPI.getAllCompanies();
      if (redirectToLoginIfUnauthorized(companiesResponse.status)) {
        return;
      }
      
      if (companiesResponse.ok) {
        setCompanies(companiesResponse.data);
        
        // Merge posts with company info
        const postsWithCompany: JobPostWithCompany[] = (postsResponse.data || []).map(post => {
          const company = companiesResponse.data?.find(c => c.id === post.company_id);
          return {
            ...post,
            company: company,
          };
        });
        
        setPosts(postsWithCompany);
      } else {
        // If companies fetch fails, still show posts without company info
        setPosts((postsResponse.data || []).map(post => ({ ...post })));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted]);

  // Get unique job types for filter
  const jobTypes = useMemo(() => {
    const unique = Array.from(
      new Set(posts.map((p) => p.job_type).filter(Boolean))
    ) as string[];
    return unique.sort();
  }, [posts]);

  // Filter posts based on search and filters
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.company?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus =
        selectedStatus === "all" || post.status === selectedStatus;

      // Job type filter
      const matchesJobType =
        selectedJobType === "all" || post.job_type === selectedJobType;

      // Company filter
      const matchesCompany =
        selectedCompany === "all" || post.company_id === selectedCompany;

      return matchesSearch && matchesStatus && matchesJobType && matchesCompany;
    });
  }, [posts, searchQuery, selectedStatus, selectedJobType, selectedCompany]);

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
        // Remove post from list
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        alert("ไม่สามารถลบโพสต์งานได้");
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("เกิดข้อผิดพลาดในการลบโพสต์งาน");
    }
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header Section */}
      <Box mb={4}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          fontWeight="bold"
          sx={{ 
            mb: 1,
            color: "text.primary",
            fontSize: { xs: "1.75rem", sm: "2rem" }
          }}
        >
          โพสต์งานทั้งหมด
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mb: 3,
            fontSize: { xs: "0.9rem", sm: "1rem" }
          }}
        >
          ดูและจัดการโพสต์งานที่บริษัทต่างๆ โพสต์ไว้ในระบบ
        </Typography>

        {/* Search and Filter Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: "grey.50",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Search Bar */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="ค้นหาโพสต์งาน, ตำแหน่ง, สถานที่, หรือบริษัท..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "white",
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">สถานะ</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={selectedStatus}
                  label="สถานะ"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{
                    bgcolor: "white",
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="active">เปิดรับ</MenuItem>
                  <MenuItem value="closed">ปิดรับ</MenuItem>
                  <MenuItem value="draft">แบบร่าง</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Job Type Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="job-type-filter-label">ประเภทงาน</InputLabel>
                <Select
                  labelId="job-type-filter-label"
                  value={selectedJobType}
                  label="ประเภทงาน"
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  sx={{
                    bgcolor: "white",
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  {jobTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Company Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="company-filter-label">บริษัท</InputLabel>
                <Select
                  labelId="company-filter-label"
                  value={selectedCompany}
                  label="บริษัท"
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  sx={{
                    bgcolor: "white",
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.company_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {(searchQuery || selectedStatus !== "all" || selectedJobType !== "all" || selectedCompany !== "all") && (
            <Box mt={2} display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <FilterIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary" fontWeight="600">
                ตัวกรองที่ใช้งาน:
              </Typography>
              {searchQuery && (
                <Chip
                  label={`ค้นหา: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery("")}
                  sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
                />
              )}
              {selectedStatus !== "all" && (
                <Chip
                  label={`สถานะ: ${selectedStatus === "active" ? "เปิดรับ" : selectedStatus === "closed" ? "ปิดรับ" : "แบบร่าง"}`}
                  size="small"
                  onDelete={() => setSelectedStatus("all")}
                  sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
                />
              )}
              {selectedJobType !== "all" && (
                <Chip
                  label={`ประเภท: ${selectedJobType}`}
                  size="small"
                  onDelete={() => setSelectedJobType("all")}
                  sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
                />
              )}
              {selectedCompany !== "all" && (
                <Chip
                  label={`บริษัท: ${companies.find(c => c.id === selectedCompany)?.company_name || ""}`}
                  size="small"
                  onDelete={() => setSelectedCompany("all")}
                  sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
                />
              )}
              <Chip
                label="ล้างทั้งหมด"
                size="small"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("all");
                  setSelectedJobType("all");
                  setSelectedCompany("all");
                }}
                sx={{
                  bgcolor: "grey.300",
                  color: "text.primary",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "grey.400" },
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Results Summary */}
        <Box 
          mt={3} 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1" color="text.primary" fontWeight="600">
              พบทั้งหมด <Box component="span" sx={{ color: "primary.main" }}>{filteredPosts.length}</Box> โพสต์
              {filteredPosts.length !== posts.length && (
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 400, ml: 1 }}>
                  จาก {posts.length} โพสต์ทั้งหมด
                </Box>
              )}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: "center",
            bgcolor: "grey.50",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <WorkIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {posts.length === 0
              ? "ยังไม่มีโพสต์งาน"
              : "ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไข"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {posts.length === 0
              ? "โพสต์งานที่บริษัทโพสต์จะปรากฏที่นี่"
              : "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredPosts.map((post) => {
            const isExpanded = expandedCards.has(post.id);
            return (
            <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={post.id}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: isExpanded ? "primary.main" : "grey.200",
                  borderRadius: 3,
                  transition: "all 0.2s ease",
                  bgcolor: "white",
                  "&:hover": {
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    borderColor: "primary.200",
                  },
                }}
              >
                {/* Main Content - Always Visible */}
                <CardContent sx={{ p: 2, pb: 1.5 }}>
                  {/* Company Header */}
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between"
                    mb={1.5}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          bgcolor: "primary.50",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <BusinessIcon sx={{ fontSize: 18, color: "primary.main" }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight="500"
                          noWrap
                          sx={{ display: "block" }}
                        >
                          {post.company?.company_name || "ไม่ระบุบริษัท"}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={post.status === "active" ? "เปิดรับ" : post.status === "closed" ? "ปิดรับ" : "แบบร่าง"}
                      size="small"
                      color={post.status === "active" ? "success" : post.status === "closed" ? "default" : "warning"}
                      sx={{ 
                        height: 20,
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        "& .MuiChip-label": { px: 1 }
                      }}
                    />
                  </Box>

                  {/* Job Title */}
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    sx={{ 
                      mb: 1,
                      color: "text.primary",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.4,
                      minHeight: 40,
                    }}
                  >
                    {post.title}
                  </Typography>

                  {/* Basic Info - Always Visible */}
                  <Stack spacing={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon sx={{ fontSize: 14, color: "grey.400" }} />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {post.location}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <WorkIcon sx={{ fontSize: 14, color: "grey.400" }} />
                      <Typography variant="caption" color="text.secondary">
                        {post.job_type}
                      </Typography>
                    </Box>

                    {post.salary_range && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <MoneyIcon sx={{ fontSize: 14, color: "success.main" }} />
                        <Typography variant="caption" color="success.main" fontWeight="600">
                          {post.salary_range}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>

                {/* Expand Button */}
                <Box 
                  sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    borderTop: "1px dashed",
                    borderColor: "grey.200",
                    py: 0.5,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "grey.50",
                    }
                  }}
                  onClick={() => toggleCardExpand(post.id)}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                    {isExpanded ? "ซ่อนรายละเอียด" : "ดูเพิ่มเติม"}
                  </Typography>
                  {isExpanded ? (
                    <ExpandLessIcon sx={{ fontSize: 18, color: "grey.500" }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 18, color: "grey.500" }} />
                  )}
                </Box>

                {/* Collapsible Content */}
                <Collapse in={isExpanded}>
                  <Box sx={{ px: 2, pb: 2 }}>
                    {/* Description */}
                    {post.description && (
                      <Box 
                        sx={{
                          p: 1.5,
                          bgcolor: "grey.50",
                          borderRadius: 1.5,
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: "block", mb: 0.5 }}>
                          รายละเอียดงาน
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.6,
                          }}
                        >
                          {post.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <Box mb={1.5}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: "block", mb: 0.5 }}>
                          ทักษะที่ต้องการ
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {post.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: "0.65rem",
                                height: 22,
                                borderColor: "primary.200",
                                color: "primary.main",
                                "& .MuiChip-label": { px: 1 }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Date */}
                    <Box display="flex" alignItems="center" gap={0.5} mb={1.5}>
                      <CalendarIcon sx={{ fontSize: 14, color: "grey.400" }} />
                      <Typography variant="caption" color="text.disabled">
                        โพสต์เมื่อ {new Date(post.created_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={() => window.open(`/companies/${post.company_id}`, "_self")}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          py: 0.75,
                        }}
                      >
                        ดูบริษัท
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleDeletePost(post.id)}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          py: 0.75,
                          minWidth: 70,
                        }}
                      >
                        ลบ
                      </Button>
                    </Stack>
                  </Box>
                </Collapse>
              </Card>
            </Grid>
          )})}
        </Grid>
      )}
    </Box>
  );
}

