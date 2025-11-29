"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import UserDetailView from "@/components/admin/UserDetailView";
import { Box, Button, Container, Typography } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

export default function UserProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          variant="outlined"
          sx={{ bgcolor: "white" }}
        >
          ย้อนกลับ
        </Button>
        <Typography variant="h5" fontWeight="bold">
          รายละเอียดผู้ใช้
        </Typography>
      </Box>

      <UserDetailView userId={userId} />
    </Container>
  );
}
