"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Stack,
  Grid,
  Collapse,
  Divider,
  TextField,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
  Block as BlockIcon,
  CheckCircle as UnbanIcon,
  TrackChanges as MissionIcon,
  Visibility as VisionIcon,
} from "@mui/icons-material";
import { adminAPI } from "../../../../app/lib/api";
import type { CompanyResponse } from "../../../../app/lib/api";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";

interface CompanyApprovalCardProps {
  company: CompanyResponse;
  onUpdate: () => void;
}

export default function CompanyApprovalCard({
  company,
  onUpdate,
}: CompanyApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isBanned, setIsBanned] = useState(false); // TODO: Get from company status

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await adminAPI.approveCompany(company.id);
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }
      if (response.ok) {
        setShowApproveModal(false);
        onUpdate();
      } else {
        const errorMessage =
          typeof response.data === "string"
            ? response.data
            : "ไม่สามารถอนุมัติบริษัทได้";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to approve company:", error);
      setError("เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await adminAPI.rejectCompany(company.id);
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }
      if (response.ok) {
        setShowRejectModal(false);
        onUpdate();
      } else {
        const errorMessage =
          typeof response.data === "string"
            ? response.data
            : "ไม่สามารถปฏิเสธบริษัทได้";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to reject company:", error);
      setError("เกิดข้อผิดพลาดในการปฏิเสธ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBan = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await adminAPI.banCompany(company.id, banReason);
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }
      if (response.ok) {
        setShowBanModal(false);
        setBanReason("");
        setIsBanned(true);
        onUpdate();
      } else {
        const errorMessage =
          typeof response.data === "string"
            ? response.data
            : "ไม่สามารถแบนบริษัทได้";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to ban company:", error);
      setError("เกิดข้อผิดพลาดในการแบนบริษัท");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnban = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await adminAPI.unbanCompany(company.id);
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }
      if (response.ok) {
        setShowUnbanModal(false);
        setIsBanned(false);
        onUpdate();
      } else {
        const errorMessage =
          typeof response.data === "string"
            ? response.data
            : "ไม่สามารถยกเลิกการแบนบริษัทได้";
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to unban company:", error);
      setError("เกิดข้อผิดพลาดในการยกเลิกการแบน");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDays = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Check if company is approved
  const isApproved = company.status?.toLowerCase() === "approved" || company.is_verified === true;

  const createdDate = formatDateShort(company.created_at);
  const daysSince = calculateDays(company.created_at);

  return (
    <>
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "grey.200",
          mb: 2,
          overflow: "hidden",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* Main Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            gap: 2,
            flexWrap: { xs: "wrap", md: "nowrap" },
            cursor: "pointer",
            "&:hover": {
              bgcolor: "grey.50",
            },
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {/* Avatar */}
          <Avatar
            src={company.logo_url || undefined}
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
            }}
          >
            {company.company_name.charAt(0).toUpperCase()}
          </Avatar>

          {/* Company Name & Industry */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              fontWeight="600"
              sx={{ mb: 0.5 }}
              noWrap
            >
              {company.company_name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.875rem" }}
              noWrap
            >
              {company.industry || "Company"}
            </Typography>
          </Box>

          {/* Dates */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              {createdDate}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              {formatDateShort(company.updated_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              {formatDateShort(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString())}
            </Typography>
          </Box>

          {/* Category Tag */}
          {company.industry && (
            <Chip
              label={company.industry}
              size="small"
              sx={{
                bgcolor: "#E8D5FF",
                color: "#7B2CBF",
                fontWeight: "600",
                fontSize: "0.75rem",
              }}
            />
          )}

          {/* Days */}
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem", minWidth: "60px", whiteSpace: "nowrap" }}>
            {daysSince} days
          </Typography>

          {/* Status Badge */}
          <Chip
            label={isBanned ? "Banned" : isApproved ? "Approved" : "Pending"}
            size="small"
            sx={{
              bgcolor: isBanned ? "#EF4444" : isApproved ? "#10b981" : "#FCD34D",
              color: "white",
              fontWeight: "600",
              fontSize: "0.75rem",
              minWidth: "80px",
            }}
          />

          {/* Expand/Collapse Icon */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{ ml: 1 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

          {/* Options Menu */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded}>
          <Divider />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Left Column - Company Info */}
              <Grid item xs={12} md={8}>
                {/* Description */}
                {company.description && (
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: "grey.50",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight="700"
                      sx={{ mb: 1, fontSize: "0.875rem" }}
                    >
                      รายละเอียดบริษัท
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {company.description}
                    </Typography>
                  </Box>
                )}

                {/* Mission & Vision */}
                {(company.mission || company.vision) && (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {company.mission && (
                      <Grid item xs={12} md={6}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "primary.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "primary.200",
                            height: "100%",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="primary.main"
                            fontWeight="700"
                            sx={{ mb: 1, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <MissionIcon fontSize="small" /> พันธกิจ (Mission)
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{
                              lineHeight: 1.8,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {company.mission}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {company.vision && (
                      <Grid item xs={12} md={6}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "success.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "success.200",
                            height: "100%",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="success.main"
                            fontWeight="700"
                            sx={{ mb: 1, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <VisionIcon fontSize="small" /> วิสัยทัศน์ (Vision)
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{
                              lineHeight: 1.8,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {company.vision}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Contact Information Grid */}
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  color="text.primary"
                  sx={{ mb: 2 }}
                >
                  ข้อมูลติดต่อ
                </Typography>

                <Grid container spacing={2}>
                  {/* Company Size */}
                  {company.company_size && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <PeopleIcon fontSize="small" sx={{ color: "#10b981", mt: 0.5 }} />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontWeight="600"
                              sx={{ mb: 0.5, fontSize: "0.75rem" }}
                            >
                              ขนาดบริษัท
                            </Typography>
                            <Typography variant="body2" fontWeight="600" color="text.primary">
                              {company.company_size}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  )}

                  {/* Founded Year */}
                  {company.founded_year && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <BusinessIcon fontSize="small" sx={{ color: "#f59e0b", mt: 0.5 }} />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontWeight="600"
                              sx={{ mb: 0.5, fontSize: "0.75rem" }}
                            >
                              ปีที่ก่อตั้ง
                            </Typography>
                            <Typography variant="body2" fontWeight="600" color="text.primary">
                              {company.founded_year}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  )}

                  {/* Phone */}
                  {company.phone && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <PhoneIcon fontSize="small" sx={{ color: "#3b82f6", mt: 0.5 }} />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontWeight="600"
                              sx={{ mb: 0.5, fontSize: "0.75rem" }}
                            >
                              เบอร์โทรศัพท์
                            </Typography>
                            <Typography variant="body2" fontWeight="600" color="text.primary">
                              {company.phone}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  )}

                  {/* Email */}
                  {company.email && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <BusinessIcon fontSize="small" sx={{ color: "#8b5cf6", mt: 0.5 }} />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontWeight="600"
                              sx={{ mb: 0.5, fontSize: "0.75rem" }}
                            >
                              อีเมล
                            </Typography>
                            <Typography variant="body2" fontWeight="600" color="text.primary">
                              {company.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  )}

                  {/* Website */}
                  {company.website_url && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <WebsiteIcon fontSize="small" sx={{ color: "#3b82f6", mt: 0.5 }} />
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontWeight="600"
                              sx={{ mb: 0.5, fontSize: "0.75rem" }}
                            >
                              เว็บไซต์
                            </Typography>
                            <Typography variant="body2" fontWeight="600" color="text.primary">
                              {company.website_url.replace(/^https?:\/\//, "")}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  )}

                  {/* Address */}
                  {(company.address_detail ||
                    company.province ||
                    company.district ||
                    company.subdistrict ||
                    company.postal_code) && (
                      <Grid item xs={12}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.200",
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <LocationIcon fontSize="small" sx={{ color: "#ef4444", mt: 0.5 }} />
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                fontWeight="600"
                                sx={{ mb: 0.5, fontSize: "0.75rem" }}
                              >
                                ที่อยู่
                              </Typography>
                              <Typography variant="body2" fontWeight="600" color="text.primary">
                                {[
                                  company.address_detail,
                                  company.subdistrict,
                                  company.district,
                                  company.province,
                                  company.postal_code,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Grid>
                    )}
                </Grid>
              </Grid>

              {/* Right Column - Actions */}
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: isApproved ? "success.50" : "grey.50",
                    borderRadius: 3,
                    border: "2px solid",
                    borderColor: isApproved ? "success.200" : "grey.200",
                  }}
                >
                  {isApproved ? (
                    <Box textAlign="center">
                      <Typography
                        variant="h6"
                        fontWeight="700"
                        color="success.main"
                        sx={{ mb: 1 }}
                      >
                        อนุมัติแล้ว
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem" }}
                      >
                        บริษัทนี้ได้รับการอนุมัติแล้ว
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography
                        variant="subtitle1"
                        fontWeight="700"
                        color="text.primary"
                        sx={{ mb: 2, textAlign: "center" }}
                      >
                        การดำเนินการ
                      </Typography>

                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={
                            isProcessing ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <ApproveIcon />
                            )
                          }
                          onClick={() => {
                            setError(null);
                            setShowApproveModal(true);
                          }}
                          disabled={isProcessing}
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: "bold",
                            textTransform: "none",
                            fontSize: "1rem",
                          }}
                        >
                          {isProcessing ? "กำลังดำเนินการ..." : "อนุมัติบริษัท"}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="large"
                          startIcon={
                            isProcessing ? (
                              <CircularProgress size={16} />
                            ) : (
                              <RejectIcon />
                            )
                          }
                          onClick={() => {
                            setError(null);
                            setShowRejectModal(true);
                          }}
                          disabled={isProcessing}
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: "bold",
                            textTransform: "none",
                            fontSize: "1rem",
                            borderWidth: "2px",
                          }}
                        >
                          {isProcessing ? "กำลังดำเนินการ..." : "ปฏิเสธคำขอ"}
                        </Button>
                        {isBanned ? (
                          <Button
                            variant="contained"
                            color="success"
                            size="large"
                            startIcon={
                              isProcessing ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <UnbanIcon />
                              )
                            }
                            onClick={() => {
                              setError(null);
                              setShowUnbanModal(true);
                            }}
                            disabled={isProcessing}
                            fullWidth
                            sx={{
                              borderRadius: 2,
                              py: 1.5,
                              fontWeight: "bold",
                              textTransform: "none",
                              fontSize: "1rem",
                            }}
                          >
                            {isProcessing ? "กำลังดำเนินการ..." : "ยกเลิกการแบน"}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="error"
                            size="large"
                            startIcon={
                              isProcessing ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <BlockIcon />
                              )
                            }
                            onClick={() => {
                              setError(null);
                              setShowBanModal(true);
                            }}
                            disabled={isProcessing}
                            fullWidth
                            sx={{
                              borderRadius: 2,
                              py: 1.5,
                              fontWeight: "bold",
                              textTransform: "none",
                              fontSize: "1rem",
                            }}
                          >
                            {isProcessing ? "กำลังดำเนินการ..." : "แบนบริษัท"}
                          </Button>
                        )}
                      </Stack>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Box>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setExpanded(true);
          }}
        >
          ดูรายละเอียด
        </MenuItem>
        {!isApproved && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setShowApproveModal(true);
            }}
          >
            อนุมัติ
          </MenuItem>
        )}
        {!isApproved && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setShowRejectModal(true);
            }}
            sx={{ color: "error.main" }}
          >
            ปฏิเสธ
          </MenuItem>
        )}
        <Divider />
        {isBanned ? (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setShowUnbanModal(true);
            }}
            sx={{ color: "success.main" }}
          >
            ยกเลิกการแบน
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setShowBanModal(true);
            }}
            sx={{ color: "error.main" }}
          >
            แบนบริษัท
          </MenuItem>
        )}
      </Menu>

      {/* Approve Dialog */}
      <Dialog
        open={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>อนุมัติบริษัท</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณแน่ใจหรือไม่ว่าต้องการอนุมัติบริษัท{" "}
            <strong>{company.company_name}</strong>?
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowApproveModal(false);
              setError(null);
            }}
            disabled={isProcessing}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ApproveIcon />
              )
            }
          >
            {isProcessing ? "กำลังอนุมัติ..." : "อนุมัติ"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ปฏิเสธบริษัท</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธบริษัท{" "}
            <strong>{company.company_name}</strong>?
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowRejectModal(false);
              setError(null);
            }}
            disabled={isProcessing}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RejectIcon />
              )
            }
          >
            {isProcessing ? "กำลังปฏิเสธ..." : "ปฏิเสธ"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog
        open={showBanModal}
        onClose={() => {
          setShowBanModal(false);
          setError(null);
          setBanReason("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>แบนบริษัท</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            คุณแน่ใจหรือไม่ว่าต้องการแบนบริษัท <strong>{company.company_name}</strong>?
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="เหตุผล (ไม่บังคับ)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="ระบุเหตุผลในการแบนบริษัท..."
            sx={{ mt: 1 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowBanModal(false);
              setError(null);
              setBanReason("");
            }}
            disabled={isProcessing}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleBan}
            variant="contained"
            color="error"
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <BlockIcon />
              )
            }
          >
            {isProcessing ? "กำลังแบน..." : "แบนบริษัท"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unban Dialog */}
      <Dialog
        open={showUnbanModal}
        onClose={() => {
          setShowUnbanModal(false);
          setError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ยกเลิกการแบนบริษัท</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการแบนบริษัท <strong>{company.company_name}</strong>?
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowUnbanModal(false);
              setError(null);
            }}
            disabled={isProcessing}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleUnban}
            variant="contained"
            color="success"
            disabled={isProcessing}
            startIcon={
              isProcessing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <UnbanIcon />
              )
            }
          >
            {isProcessing ? "กำลังยกเลิก..." : "ยกเลิกการแบน"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
