"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { userAPI } from "../../../../app/lib/api";
import type { UserProfileResponse, UserAddressResponse } from "../../../../app/lib/api";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";

interface UserProfileDetailProps {
  userId: string;
}

export default function UserProfileDetail({ userId }: UserProfileDetailProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [address, setAddress] = useState<UserAddressResponse | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug: Check cookies
      console.log("Current cookies:", document.cookie);
      console.log("Has act_admin cookie:", document.cookie.includes("act_admin="));
      console.log("Has act cookie:", document.cookie.includes("act="));

      // Debug: Log the userId being used
      console.log("=== FETCHING PROFILE FOR USER ID ===", userId);
      console.log("API endpoint will be:", `/api/user/profile/${userId}`);

      // Fetch profile
      const profileResponse = await userAPI.getProfileByUserId(userId);
      console.log("=== PROFILE API RESPONSE ===");
      console.log("Status:", profileResponse.status);
      console.log("OK:", profileResponse.ok);
      console.log("Data type:", typeof profileResponse.data);
      console.log("Data:", profileResponse.data);
      console.log("Data is object:", typeof profileResponse.data === 'object');
      console.log("Data keys:", profileResponse.data && typeof profileResponse.data === 'object' ? Object.keys(profileResponse.data) : 'N/A');
      console.log("================================");

      if (redirectToLoginIfUnauthorized(profileResponse.status)) {
        return;
      }

      if (profileResponse.ok) {
        // Check if data exists and is not empty object
        if (profileResponse.data &&
          typeof profileResponse.data === 'object' &&
          Object.keys(profileResponse.data).length > 0) {
          setProfile(profileResponse.data);
        } else {
          console.warn("Profile response ok but data is empty or invalid:", profileResponse.data);
          // Check if user might not have created a profile yet
          setError("ผู้ใช้ยังไม่ได้สร้างโปรไฟล์");
          return;
        }
      } else {
        // Handle different error status codes
        let errorMessage = "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้";

        if (profileResponse.status === 404) {
          errorMessage = "ไม่พบข้อมูลโปรไฟล์ของผู้ใช้";
        } else if (profileResponse.status === 403) {
          errorMessage = "ไม่มีสิทธิ์เข้าถึงข้อมูลโปรไฟล์นี้";
        } else if (profileResponse.status === 500) {
          errorMessage = "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
        }

        // Try to extract error message from response data
        if (profileResponse.data) {
          if (typeof profileResponse.data === 'string') {
            errorMessage = profileResponse.data;
          } else if (typeof profileResponse.data === 'object') {
            // Check if it's an empty object
            if (Object.keys(profileResponse.data).length === 0) {
              errorMessage = "ไม่พบข้อมูลโปรไฟล์";
            } else if ('error' in profileResponse.data) {
              errorMessage = (profileResponse.data as any).error || errorMessage;
            } else if ('message' in profileResponse.data) {
              errorMessage = (profileResponse.data as any).message || errorMessage;
            }
          }
        }

        // Only log error if it's not an expected case (like 404)
        if (profileResponse.status !== 404) {
          console.error("Failed to fetch profile:", {
            status: profileResponse.status,
            data: profileResponse.data,
            userId: userId
          });
        }

        setError(errorMessage);
        return;
      }

      // Fetch address
      try {
        const addressResponse = await userAPI.getAddressByUserId(userId);
        if (addressResponse.ok) {
          setAddress(addressResponse.data);
        }
      } catch (err) {
        // Address is optional, so we don't show error
        console.log("Address not available");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role?: string) => {
    if (!role) return <PersonIcon />;
    switch (role.toLowerCase()) {
      case "admin":
        return <AdminIcon />;
      case "companyuser":
        return <BusinessIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role?: string) => {
    if (!role) return "default";
    switch (role.toLowerCase()) {
      case "admin":
        return "error";
      case "companyuser":
        return "primary";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return "Unknown";
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

  if (error || !profile) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "ไม่พบข้อมูลผู้ใช้"}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/profile")}
          variant="outlined"
        >
          กลับไปหน้ารายการ
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/profile")}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          กลับไปหน้ารายการ
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: "primary.main",
            color: "white",
            borderRadius: 3,
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={profile.profile_image_url || undefined}
              sx={{
                width: 100,
                height: 100,
                bgcolor: "rgba(255,255,255,0.2)",
                fontSize: "2.5rem",
                border: "3px solid white",
              }}
            >
              {profile.first_name_th?.charAt(0) ||
                profile.first_name_en?.charAt(0) ||
                "U"}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {profile.first_name_th && profile.last_name_th
                  ? `${profile.first_name_th} ${profile.last_name_th}`
                  : profile.first_name_en && profile.last_name_en
                    ? `${profile.first_name_en} ${profile.last_name_en}`
                    : "ไม่ระบุชื่อ"}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                {profile.title || "ไม่ระบุตำแหน่ง"}
              </Typography>
              {userRole && (
                <Chip
                  icon={getRoleIcon(userRole)}
                  label={getRoleLabel(userRole)}
                  color={getRoleColor(userRole) as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontWeight: "600",
                  }}
                />
              )}
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Profile Details */}
      <Grid container spacing={3}>
        {/* Left Column - Basic Info */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.300" }}>
            <Typography variant="h6" fontWeight="700" gutterBottom>
              ข้อมูลส่วนตัว
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              {profile.email && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    อีเมล
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {profile.email}
                  </Typography>
                </Box>
              )}

              {profile.phone && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    เบอร์โทรศัพท์
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {profile.phone}
                  </Typography>
                </Box>
              )}

              {profile.gender && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    เพศ
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {profile.gender}
                  </Typography>
                </Box>
              )}

              {profile.birth_date && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    วันเกิด
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {new Date(profile.birth_date).toLocaleDateString("th-TH")}
                  </Typography>
                </Box>
              )}

              {profile.nationality && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    สัญชาติ
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {profile.nationality}
                  </Typography>
                </Box>
              )}

              {profile.religion && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    ศาสนา
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {profile.religion}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column - Address */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "grey.300" }}>
            <Typography variant="h6" fontWeight="700" gutterBottom>
              ที่อยู่
            </Typography>
            <Divider sx={{ my: 2 }} />

            {address ? (
              <Stack spacing={2}>
                {address.address_detail && (
                  <Box>
                    <Typography variant="body1" fontWeight="600">
                      {address.address_detail}
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  {[
                    address.subdistrict,
                    address.district,
                    address.province,
                    address.postal_code,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                ไม่มีข้อมูลที่อยู่
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

