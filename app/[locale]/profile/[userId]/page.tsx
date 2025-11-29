"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UserProfile from "@/app/Components/profile/UserProfile";
import { userAPI } from "@/app/lib/api";
import { Box, CircularProgress, Alert, Container, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

export default function ProfileByUserIdPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userAPI.getProfile();
        if (response.ok && response.data) {
          setCurrentUserId(response.data.user_id);
          // If viewing own profile, redirect to appropriate template route
          if (response.data.user_id === userId) {
            const template = response.data.template || "classic";
            if (template === "modern") {
              router.replace("/profile-modern");
            } else if (template === "jewelry") {
              router.replace("/profile-jewelry");
            } else {
              router.replace("/profile");
            }
            return;
          }
        } else {
          // If can't get own profile, still allow viewing other profiles
          setCurrentUserId(null);
        }
      } catch (err) {
        console.error("Error fetching current user profile:", err);
        // Allow viewing other profiles even if we can't get own profile
        setCurrentUserId(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCurrentUserId();
    } else {
      setError("ไม่พบ User ID");
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    // Fetch target user's profile to get their template preference
    const fetchTargetProfile = async () => {
      if (!userId || loading) return;
      
      try {
        const response = await userAPI.getProfileByUserId(userId);
        if (response.ok && response.data) {
          const template = response.data.template || "classic";
          console.log("Target user template:", template, "from profile:", response.data);
          // Redirect to appropriate template route
          const currentPath = window.location.pathname;
          if (template === "modern" && !currentPath.includes("profile-modern") && !currentPath.includes("profile-jewelry")) {
            router.replace(`/profile-modern/${userId}`);
          } else if (template === "jewelry" && !currentPath.includes("profile-jewelry")) {
            router.replace(`/profile-jewelry/${userId}`);
          } else if (template === "classic" && (currentPath.includes("profile-modern") || currentPath.includes("profile-jewelry"))) {
            router.replace(`/profile/${userId}`);
          }
        } else {
          console.error("Failed to get target profile:", response);
        }
      } catch (err) {
        console.error("Error fetching target profile:", err);
        // Continue with default template if fetch fails
      }
    };

    // Only fetch if not viewing own profile
    if (userId && currentUserId !== userId) {
      fetchTargetProfile();
    }
  }, [userId, currentUserId, loading, router]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          variant="outlined"
        >
          กลับ
        </Button>
      </Container>
    );
  }

  // Pass userId to UserProfile component
  return <UserProfile targetUserId={userId} />;
}
