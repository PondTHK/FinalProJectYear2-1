"use client";
import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { adminAPI } from "../../../../app/lib/api";
import type { UserSummary, CompanyResponse } from "../../../../app/lib/api";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";
import UserCard from "./UserCard";

export default function UserList() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users and companies in parallel
      const [usersResponse, companiesResponse] = await Promise.all([
        adminAPI.getUsersLast7Days(),
        adminAPI.getAllCompanies()
      ]);

      if (redirectToLoginIfUnauthorized(usersResponse.status)) {
        return;
      }

      if (usersResponse.ok) {
        setUsers(usersResponse.data.users || []);
      } else {
        setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      }

      if (companiesResponse.ok) {
        setCompanies(companiesResponse.data || []);
        console.log("Fetched Companies:", companiesResponse.data);
      }

      if (usersResponse.ok && companiesResponse.ok) {
        const users = usersResponse.data.users || [];
        const companies = companiesResponse.data || [];
        console.log("Matching Debug:", {
          userCount: users.length,
          companyCount: companies.length,
          sampleMatch: users.map(u => ({
            userId: u.id,
            role: u.role,
            foundCompany: companies.find(c => c.user_id === u.id)
          }))
        });
      }

    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query and role
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.username.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query);

    const matchesRole =
      filterRole === "all" ||
      (filterRole === "company" && user.role === "CompanyUser") ||
      (filterRole === "user" && user.role === "PersonaUser");

    return matchesSearch && matchesRole;
  });


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
          รายการผู้ใช้ทั้งหมด
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          ดูและจัดการข้อมูลผู้ใช้ในระบบ
        </Typography>

        {/* Search and Filter Section */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200",
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <TextField
            fullWidth
            placeholder="ค้นหาชื่อผู้ใช้, ชื่อแสดง, หรือบทบาท..."
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
              flex: 1,
              minWidth: "300px",
              "& .MuiOutlinedInput-root": {
                bgcolor: "white",
                borderRadius: 2,
              },
            }}
          />
          <TextField
            select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            SelectProps={{
              native: true,
            }}
            sx={{
              width: "200px",
              "& .MuiOutlinedInput-root": {
                bgcolor: "white",
                borderRadius: 2,
              },
            }}
          >
            <option value="all">ทั้งหมด</option>
            <option value="company">บริษัท (Company)</option>
            <option value="user">ผู้ใช้ทั่วไป (User)</option>
          </TextField>
        </Paper>

        {/* Results Summary */}
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            พบทั้งหมด <strong>{filteredUsers.length}</strong> รายการ
            {filteredUsers.length !== users.length && (
              <span> จาก {users.length} รายการทั้งหมด</span>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
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
          <PersonIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {users.length === 0
              ? "ไม่มีผู้ใช้ในระบบ"
              : "ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไข"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {users.length === 0
              ? "ผู้ใช้ที่ลงทะเบียนใหม่จะปรากฏที่นี่"
              : "ลองเปลี่ยนคำค้นหา"}
          </Typography>
        </Paper>
      ) : (
        <Box>
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              company={companies.find(c => c.user_id === user.id)}
              onUpdate={fetchUsers}
            />
          ))}
        </Box>
      )}
    </Container>
  );
}

