"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Collapse,
  Divider,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import type { UserSummary, CompanyResponse } from "../../../../app/lib/api";
import { adminAPI } from "../../../../app/lib/api";
import { useRouter } from "next/navigation";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";

interface UserCardProps {
  user: UserSummary;
  company?: CompanyResponse;
  onUpdate?: () => void;
}

export default function UserCard({ user, company, onUpdate }: UserCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false); // TODO: Get from user status

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

  const handleBan = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!user.id) {
        setError("ไม่พบ ID ของผู้ใช้");
        return;
      }

      const response = await adminAPI.banUser(user.id, banReason);
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }
      if (response.ok) {
        setShowBanModal(false);
        setBanReason("");
        setIsBanned(true);
        if (onUpdate) onUpdate();
      } else {
        let errorMessage = "ไม่สามารถแบนผู้ใช้ได้";
        if (response.status === 404) {
          errorMessage = "ไม่พบผู้ใช้ในระบบ";
        } else if (typeof response.data === "string") {
          errorMessage = response.data;
        } else if (response.data && typeof response.data === "object") {
          const errorData = response.data as any;
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to ban user:", error);
      setError(`เกิดข้อผิดพลาดในการแบนผู้ใช้: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnban = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!user.id) {
        setError("ไม่พบ ID ของผู้ใช้");
        return;
      }

      const response = await adminAPI.unbanUser(user.id);
      if (redirectToLoginIfUnauthorized(response.status)) {
        return;
      }
      if (response.ok) {
        setShowUnbanModal(false);
        setIsBanned(false);
        if (onUpdate) onUpdate();
      } else {
        let errorMessage = "ไม่สามารถยกเลิกการแบนผู้ใช้ได้";
        if (response.status === 404) {
          errorMessage = "ไม่พบผู้ใช้ในระบบ";
        } else if (typeof response.data === "string") {
          errorMessage = response.data;
        } else if (response.data && typeof response.data === "object") {
          errorMessage = (response.data as any).message || errorMessage;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Failed to unban user:", error);
      setError(`เกิดข้อผิดพลาดในการยกเลิกการแบน: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return <AdminIcon />;
      case "companyuser":
        return <BusinessIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "#EF4444";
      case "companyuser":
        return "#3B82F6";
      default:
        return "#8B5CF6";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "Admin";
      case "companyuser":
        return "Company";
      case "personauser":
        return "Persona";
      default:
        return role;
    }
  };

  const createdDate = formatDateShort(user.created_at);
  const daysSince = calculateDays(user.created_at);
  const roleColor = getRoleColor(user.role);
  const isCompanyUser = user.role.toLowerCase() === "companyuser";

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
          onClick={() => {
            if (isCompanyUser) {
              setExpanded(!expanded);
            } else {
              router.push(`/profile/${user.id}`);
            }
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: roleColor,
            }}
          >
            {user.display_name
              ? user.display_name.charAt(0).toUpperCase()
              : user.username.charAt(0).toUpperCase()}
          </Avatar>

          {/* User Name & Role */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              fontWeight="600"
              sx={{ mb: 0.5 }}
              noWrap
            >
              {user.display_name || user.username}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.875rem" }}
              noWrap
            >
              {getRoleLabel(user.role)}
            </Typography>
          </Box>

          {/* Dates */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              {createdDate}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              {daysSince} days ago
            </Typography>
          </Box>

          {/* Role Tag */}
          <Chip
            icon={getRoleIcon(user.role)}
            label={getRoleLabel(user.role)}
            size="small"
            sx={{
              bgcolor: "#E8D5FF",
              color: "#7B2CBF",
              fontWeight: "600",
              fontSize: "0.75rem",
              "& .MuiChip-icon": {
                color: "#7B2CBF",
              },
            }}
          />

          {/* Status Badge */}
          <Chip
            label={isBanned ? "Banned" : "Active"}
            size="small"
            sx={{
              bgcolor: isBanned ? "#EF4444" : "#FCD34D",
              color: "white",
              fontWeight: "600",
              fontSize: "0.75rem",
              minWidth: "80px",
            }}
          />

          {/* Expand/Collapse Icon */}
          {isCompanyUser && (
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
          )}

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
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ p: 3, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            {isCompanyUser && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    ข้อมูลบริษัท
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          src={company?.logo_url || undefined}
                          alt={company?.company_name}
                          variant="rounded"
                          sx={{ width: 64, height: 64 }}
                        >
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {company?.company_name || "ไม่ระบุชื่อบริษัท"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {company?.industry || "ไม่ระบุอุตสาหกรรม"}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          รายละเอียด
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {company?.description || "-"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          ที่อยู่
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {company?.address || "-"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          เว็บไซต์
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {company?.website ? (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#3b82f6" }}
                            >
                              {company.website}
                            </a>
                          ) : (
                            "-"
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    ข้อมูลผู้ติดต่อ
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {user.first_name_th} {user.last_name_th}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EmailIcon color="action" fontSize="small" />
                        <Typography variant="body2">{user.email}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PhoneIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {user.phone || "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          สมัครเมื่อ: {formatDateShort(user.created_at)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            )}
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
            if (user.role === "CompanyUser") {
              setExpanded(true);
            } else {
              router.push(`/profile/${user.id}`);
            }
          }}
        >
          ดูรายละเอียด
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (user.role === "CompanyUser") {
              const targetId = company?.id || user.id;
              router.push(`/companies/${targetId}`);
            } else {
              router.push(`/profile/${user.id}`);
            }
          }}
        >
          {user.role === "CompanyUser" ? "ดูข้อมูลบริษัท" : "ดูโปรไฟล์"}
        </MenuItem>
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
            แบนผู้ใช้
          </MenuItem>
        )}
      </Menu>

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
        <DialogTitle>แบนผู้ใช้</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            คุณแน่ใจหรือไม่ว่าต้องการแบนผู้ใช้ <strong>{user.display_name || user.username}</strong>?
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="เหตุผล (ไม่บังคับ)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="ระบุเหตุผลในการแบนผู้ใช้..."
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
            {isProcessing ? "กำลังแบน..." : "แบนผู้ใช้"}
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
        <DialogTitle>ยกเลิกการแบนผู้ใช้</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการแบนผู้ใช้ <strong>{user.display_name || user.username}</strong>?
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
                <CheckCircleIcon />
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
