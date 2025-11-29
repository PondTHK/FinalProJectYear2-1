"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Tabs,
  Tab,
  Stack,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AccessTime as PendingIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { adminAPI, type CompanyResponse } from "@/app/lib/api";

// Extend CompanyResponse to include local status for UI handling
interface CompanyWithStatus extends CompanyResponse {
  status: "Pending" | "Approved" | "Rejected";
}

const CompanyApprovalList = () => {
  const [companies, setCompanies] = useState<CompanyWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllCompanies();
      if (response.ok) {
        // Map backend status to UI status (capitalize first letter)
        const companiesWithStatus = response.data.map((c) => {
          const backendStatus = (c.status || "pending").toLowerCase();
          let uiStatus: "Pending" | "Approved" | "Rejected";

          if (backendStatus === "approved" || backendStatus === "active") {
            uiStatus = "Approved";
          } else if (backendStatus === "rejected") {
            uiStatus = "Rejected";
          } else {
            uiStatus = "Pending";
          }

          return {
            ...c,
            status: uiStatus,
          };
        });
        setCompanies(companiesWithStatus);
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

  const handleApprove = async (companyId: string) => {
    try {
      setProcessingId(companyId);
      const response = await adminAPI.approveCompany(companyId);
      if (response.ok) {
        // Optimistically update UI
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId ? { ...c, status: "Approved" } : c
          )
        );
      } else {
        alert("ไม่สามารถอนุมัติบริษัทได้");
      }
    } catch (err) {
      console.error("Failed to approve company:", err);
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (companyId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธบริษัทนี้?")) {
      return;
    }

    try {
      setProcessingId(companyId);
      const response = await adminAPI.rejectCompany(companyId);
      if (response.ok) {
        // Optimistically update UI
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId ? { ...c, status: "Rejected" } : c
          )
        );
      } else {
        alert("ไม่สามารถปฏิเสธบริษัทได้");
      }
    } catch (err) {
      console.error("Failed to reject company:", err);
      alert("เกิดข้อผิดพลาดในการปฏิเสธ");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilteredCompanies = () => {
    switch (tabValue) {
      case 0: // Pending
        return companies.filter((c) => c.status === "Pending");
      case 1: // Approved
        return companies.filter((c) => c.status === "Approved");
      case 2: // Rejected
        return companies.filter((c) => c.status === "Rejected");
      case 3: // All
        return companies;
      default:
        return companies;
    }
  };

  const filteredCompanies = getFilteredCompanies();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="800"
              color="primary.main"
              gutterBottom
            >
              จัดการบริษัท
            </Typography>
            <Typography variant="body1" color="text.secondary">
              ตรวจสอบและอนุมัติบริษัทที่ลงทะเบียนเข้าใช้งานระบบ
            </Typography>
          </Box>
          <Chip
            icon={<BusinessIcon />}
            label={`ทั้งหมด ${companies.length} บริษัท`}
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, pt: 1 }}
          >
            <Tab
              icon={<PendingIcon />}
              iconPosition="start"
              label={`รออนุมัติ (${companies.filter((c) => c.status === "Pending").length
                })`}
            />
            <Tab
              icon={<ApproveIcon />}
              iconPosition="start"
              label={`อนุมัติแล้ว (${companies.filter((c) => c.status === "Approved").length
                })`}
            />
            <Tab
              icon={<RejectIcon />}
              iconPosition="start"
              label={`ปฏิเสธ (${companies.filter((c) => c.status === "Rejected").length
                })`}
            />
            <Tab label="ทั้งหมด" />
          </Tabs>
        </Paper>
      </Box>

      {filteredCompanies.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            textAlign: "center",
            borderRadius: 4,
            bgcolor: "grey.50",
            borderStyle: "dashed",
            borderWidth: 2,
            borderColor: "grey.300",
          }}
          elevation={0}
        >
          <HistoryIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight="500">
            ไม่พบข้อมูลในรายการนี้
          </Typography>
          <Typography variant="body2" color="text.disabled">
            ลองเปลี่ยนตัวกรองเพื่อดูข้อมูลอื่นๆ
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "2px solid",
                borderColor: "grey.200",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 20px 48px -12px rgba(0,0,0,0.12)",
                  transform: "translateY(-4px)",
                },
              }}
            >
              {/* Header Section with Gradient Background */}
              <Box
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  p: 3,
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "200px",
                    height: "200px",
                    background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                    transform: "translate(30%, -30%)",
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2.5} flexWrap="wrap">
                  {/* Company Avatar */}
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 72,
                      height: 72,
                      bgcolor: "rgba(255,255,255,0.95)",
                      color: "#667eea",
                      borderRadius: 3,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      border: "3px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 36 }} />
                  </Avatar>

                  <Box flex={1}>
                    {/* Company Name */}
                    <Typography
                      variant="h4"
                      component="h2"
                      fontWeight="800"
                      sx={{
                        color: "white",
                        letterSpacing: "-0.5px",
                        textShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        mb: 0.5,
                      }}
                    >
                      {company.company_name}
                    </Typography>

                    {/* Industry & Date */}
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                      {company.industry && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <BusinessIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: "500" }}>
                            {company.industry}
                          </Typography>
                        </Box>
                      )}
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.75)" }} />
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                          สมัครเมื่อ {formatDate(company.created_at)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Status Badge */}
                  <Chip
                    label={
                      company.status === "Approved" ? "อนุมัติแล้ว" :
                        company.status === "Rejected" ? "ปฏิเสธ" : "รออนุมัติ"
                    }
                    icon={
                      company.status === "Approved" ? <ApproveIcon sx={{ fontSize: 18 }} /> :
                        company.status === "Rejected" ? <RejectIcon sx={{ fontSize: 18 }} /> :
                          <PendingIcon sx={{ fontSize: 18 }} />
                    }
                    sx={{
                      fontWeight: "bold",
                      borderRadius: 2.5,
                      height: 36,
                      px: 1.5,
                      bgcolor:
                        company.status === "Approved" ? "#10b981" :
                          company.status === "Rejected" ? "#ef4444" : "#f59e0b",
                      color: "white",
                      fontSize: "0.95rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      "& .MuiChip-icon": {
                        color: "white",
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Left Column: Info */}
                  <Grid size={{ xs: 12, md: 8 }}>
                    {/* Description */}
                    {company.description && (
                      <Box
                        sx={{
                          mb: 3,
                          p: 2.5,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          borderLeft: "4px solid",
                          borderColor: "primary.main",
                        }}
                      >
                        <Typography variant="caption" fontWeight="700" display="block" mb={0.5}>
                          รายละเอียดบริษัท
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.primary"
                          sx={{
                            lineHeight: 1.7,
                            fontWeight: "400",
                          }}
                        >
                          {company.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Contact Information - Enhanced Layout */}
                    <Typography variant="h6" fontWeight="700" color="text.primary" mb={2} sx={{ fontSize: "1.1rem" }}>
                      ข้อมูลติดต่อ
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack spacing={2}>
                          <ContactItem
                            icon={<PeopleIcon fontSize="small" />}
                            label="ขนาดบริษัท"
                            value={company.company_size}
                          />
                          <ContactItem
                            icon={<PhoneIcon fontSize="small" />}
                            label="เบอร์โทรศัพท์"
                            value={company.phone}
                          />
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack spacing={2}>
                          <ContactItem
                            icon={<WebsiteIcon fontSize="small" />}
                            label="เว็บไซต์"
                            value={company.website_url}
                            isLink
                          />
                          <ContactItem
                            icon={<LocationIcon fontSize="small" />}
                            label="ที่อยู่"
                            value={company.province}
                            tooltip={[
                              company.address_detail,
                              company.subdistrict,
                              company.district,
                              company.province,
                              company.postal_code,
                            ].filter(Boolean).join(" ")}
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Right Column: Actions */}
                  <Grid
                    size={{ xs: 12, md: 4 }}
                    sx={{
                      borderLeft: { xs: "none", md: "2px dashed" },
                      borderTop: { xs: "2px dashed", md: "none" },
                      borderColor: "grey.200",
                      pl: { xs: 0, md: 3 },
                      pt: { xs: 3, md: 0 },
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                  >
                    {company.status === "Pending" ? (
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px dashed",
                            borderColor: "grey.300",
                            textAlign: "center",
                            mb: 1,
                          }}
                        >
                          <Typography variant="overline" color="text.secondary" fontWeight="700" display="block">
                            การดำเนินการ
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontSize="0.85rem">
                            เลือกการอนุมัติหรือปฏิเสธคำขอ
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApprove(company.id)}
                          disabled={processingId === company.id}
                          fullWidth
                          size="large"
                          sx={{
                            borderRadius: 2.5,
                            py: 1.75,
                            fontWeight: "bold",
                            textTransform: "none",
                            fontSize: "1rem",
                            boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.3)",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            "&:hover": {
                              boxShadow: "0 6px 20px 0 rgba(16, 185, 129, 0.4)",
                              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            },
                            "&:disabled": {
                              background: "grey.300",
                            }
                          }}
                        >
                          {processingId === company.id ? "กำลังบันทึก..." : "✓ อนุมัติบริษัท"}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => handleReject(company.id)}
                          disabled={processingId === company.id}
                          fullWidth
                          size="large"
                          sx={{
                            borderRadius: 2.5,
                            py: 1.75,
                            fontWeight: "bold",
                            textTransform: "none",
                            fontSize: "1rem",
                            borderWidth: "2px",
                            "&:hover": {
                              borderWidth: "2px",
                              bgcolor: "error.50",
                            }
                          }}
                        >
                          ✕ ปฏิเสธคำขอ
                        </Button>
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          p: 3.5,
                          background: company.status === "Approved"
                            ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                            : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                          borderRadius: 3,
                          textAlign: "center",
                          border: "2px solid",
                          borderColor: company.status === "Approved" ? "#10b981" : "#ef4444",
                          position: "relative",
                          overflow: "hidden",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: -50,
                            right: -50,
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background: company.status === "Approved"
                              ? "rgba(16, 185, 129, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                          },
                        }}
                      >
                        {company.status === "Approved" ? (
                          <ApproveIcon sx={{ fontSize: 48, color: "#10b981", mb: 1 }} />
                        ) : (
                          <RejectIcon sx={{ fontSize: 48, color: "#ef4444", mb: 1 }} />
                        )}
                        <Typography
                          variant="h6"
                          fontWeight="800"
                          color={company.status === "Approved" ? "#047857" : "#b91c1c"}
                          gutterBottom
                        >
                          {company.status === "Approved" ? "✓ อนุมัติเรียบร้อย" : "✕ ปฏิเสธคำขอแล้ว"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                          ดำเนินการเมื่อ {new Date().toLocaleDateString("th-TH", { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
};

// Helper Component for Contact Items
const ContactItem = ({ icon, label, value, isLink, tooltip }: any) => {
  if (!value) return null;

  const content = (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={1.5}
      sx={{
        p: 1.5,
        bgcolor: "white",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "grey.200",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "grey.50",
          transform: "translateX(2px)",
        }
      }}
    >
      <Box
        sx={{
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
          bgcolor: "primary.50",
          borderRadius: 1.5,
          minWidth: 36,
          height: 36,
        }}
      >
        {icon}
      </Box>
      <Box overflow="hidden" flex={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          lineHeight={1.2}
          mb={0.5}
          fontWeight="600"
          sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.5px" }}
        >
          {label}
        </Typography>
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Typography
              variant="body2"
              fontWeight="600"
              color="primary.main"
              sx={{
                "&:hover": {
                  textDecoration: "underline",
                  color: "primary.dark",
                },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "color 0.2s ease",
              }}
            >
              {value.replace(/^https?:\/\//, '')}
            </Typography>
          </a>
        ) : (
          <Typography
            variant="body2"
            fontWeight="600"
            color="text.primary"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );

  if (tooltip) {
    return <Tooltip title={tooltip} placement="top" arrow>{content}</Tooltip>;
  }

  return content;
};

// Helper icon component
const AccessTimeIcon = (props: any) => <PendingIcon {...props} />;

export default CompanyApprovalList;
