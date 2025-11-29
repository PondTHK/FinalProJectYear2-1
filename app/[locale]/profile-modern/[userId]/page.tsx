"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { userAPI } from "@/app/lib/api";
import { Box, CircularProgress, Alert, Container, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

export default function ModernProfileByUserIdPage() {
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
          // If viewing own profile, redirect to /profile-modern
          if (response.data.user_id === userId) {
            router.replace("/profile-modern");
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
    // Fetch target user's profile to verify template
    const fetchTargetProfile = async () => {
      if (!userId || loading) return;
      
      try {
        const response = await userAPI.getProfileByUserId(userId);
        if (response.ok && response.data) {
          const template = response.data.template || "classic";
          // Redirect to appropriate template route
          if (template === "jewelry") {
            router.replace(`/profile-jewelry/${userId}`);
            return;
          }
          if (template !== "modern") {
            router.replace(`/profile/${userId}`);
            return;
          }
          router.replace(`/profile-modern?targetUserId=${userId}`);
        }
      } catch (err) {
        console.error("Error fetching target profile:", err);
        // Continue with modern template if fetch fails
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

  // Redirect handled in effects; show loading fallback
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <CircularProgress />
    </Box>
  );
}
