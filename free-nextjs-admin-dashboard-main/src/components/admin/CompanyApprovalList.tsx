"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
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
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from "@mui/icons-material";
import CompanyApprovalCard from "./CompanyApprovalCard";
import { adminAPI } from "../../../../app/lib/api";
import type { CompanyResponse } from "../../../../app/lib/api";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";

export default function CompanyApprovalList() {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllCompanies();
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }
      if (response.ok) {
        setCompanies(response.data);
      } else {
        setError("ไม่สามารถโหลดข้อมูลบริษัทได้");
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Get unique sizes for filter
  const companySizes = useMemo(() => {
    const unique = Array.from(
      new Set(companies.map((c) => c.company_size).filter(Boolean))
    ) as string[];
    return unique.sort();
  }, [companies]);

  // Helper function to check if company is approved
  const isApproved = (company: CompanyResponse) => {
    return company.status?.toLowerCase() === "approved" || company.is_verified === true;
  };

  // Filter companies based on search and filters
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (selectedStatus === "approved") {
        matchesStatus = isApproved(company);
      } else if (selectedStatus === "pending") {
        matchesStatus = !isApproved(company);
      }

      // Size filter
      const matchesSize =
        selectedSize === "all" || company.company_size === selectedSize;

      return matchesSearch && matchesStatus && matchesSize;
    });
  }, [companies, searchQuery, selectedStatus, selectedSize]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box mb={4}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          fontWeight="bold"
          sx={{ mb: 1 }}
        >
          อนุมัติบริษัท
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          ตรวจสอบและอนุมัติบริษัทที่ลงทะเบียนเข้าใช้งานระบบ
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="ค้นหาบริษัท, อุตสาหกรรม, หรือคำอธิบาย..."
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
            <Grid item xs={12} sm={6} md={3}>
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
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon fontSize="small" color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  <MenuItem value="pending">ยังไม่อนุมัติ</MenuItem>
                  <MenuItem value="approved">อนุมัติแล้ว</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Company Size Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel id="size-filter-label">ขนาดบริษัท</InputLabel>
                <Select
                  labelId="size-filter-label"
                  value={selectedSize}
                  label="ขนาดบริษัท"
                  onChange={(e) => setSelectedSize(e.target.value)}
                  sx={{
                    bgcolor: "white",
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="all">ทั้งหมด</MenuItem>
                  {companySizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {(searchQuery || selectedStatus !== "all" || selectedSize !== "all") && (
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
                  label={
                    selectedStatus === "approved"
                      ? "สถานะ: อนุมัติแล้ว"
                      : "สถานะ: ยังไม่อนุมัติ"
                  }
                  size="small"
                  onDelete={() => setSelectedStatus("all")}
                  sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
                />
              )}
              {selectedSize !== "all" && (
                <Chip
                  label={`ขนาด: ${selectedSize}`}
                  size="small"
                  onDelete={() => setSelectedSize("all")}
                  sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
                />
              )}
              <Chip
                label="ล้างทั้งหมด"
                size="small"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("all");
                  setSelectedSize("all");
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
        <Box mt={3} display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            พบทั้งหมด <strong>{filteredCompanies.length}</strong> รายการ
            {filteredCompanies.length !== companies.length && (
              <span> จาก {companies.length} รายการทั้งหมด</span>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
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
          <FilterIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {companies.length === 0
              ? "ไม่มีบริษัทที่รอการอนุมัติ"
              : "ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไข"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {companies.length === 0
              ? "บริษัทที่สมัครใหม่จะปรากฏที่นี่"
              : "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"}
          </Typography>
        </Paper>
      ) : (
        <Box>
          {filteredCompanies.map((company) => (
            <CompanyApprovalCard
              key={company.id}
              company={company}
              onUpdate={fetchCompanies}
            />
          ))}
        </Box>
      )}
    </Container>
  );
}
