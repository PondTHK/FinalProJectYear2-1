"use client";

import React from "react";
import { Box, Avatar, IconButton, Badge, styled } from "@mui/material";
import {
  Search as SearchIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Favorite as FavoriteIcon,
} from "@mui/icons-material";

const NavbarContainer = styled(Box)({
  height: 56,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.10) 100%)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 28px",
  position: "fixed",
  top: 12,
  left: 100,
  right: 12,
  borderRadius: 16,
  zIndex: 1100,
  border: "1px solid rgba(255,255,255,0.35)",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
});

const NavIconButton = styled(IconButton)({
  width: 36,
  height: 36,
  color: "#111827",
  borderRadius: 10,
  background: "rgba(255,255,255,0.30)",
  border: "1px solid rgba(255,255,255,0.45)",
  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
  "&:hover": {
    background: "rgba(255,255,255,0.50)",
    color: "#111827",
  },
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
});

const StyledBadge = styled(Badge)({
  "& .MuiBadge-badge": {
    background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    color: "#ffffff",
    fontSize: 10,
    height: 18,
    minWidth: 18,
    padding: "0 4px",
    fontWeight: 600,
  },
});

const ProfileNavbar: React.FC = () => {
  return (
    <NavbarContainer>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <NavIconButton>
          <SearchIcon />
        </NavIconButton>
        <NavIconButton>
          <SettingsIcon />
        </NavIconButton>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <NavIconButton>
          <NotificationsIcon />
        </NavIconButton>

        <NavIconButton>
          <StyledBadge badgeContent={3} color="error">
            <FavoriteIcon />
          </StyledBadge>
        </NavIconButton>

        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            overflow: "hidden",
            cursor: "pointer",
            "&:hover": { opacity: 0.8 },
          }}
        >
          <Box
            component="img"
            src="https://flagcdn.com/w40/gb.png"
            alt="Language"
            sx={{ width: 24, height: 24, objectFit: "cover" }}
          />
        </Box>

        <Avatar
          src="https://cdn.getmerlin.in/cms/pfp1_fe1e0a17e8.jpg"
          sx={{
            width: 32,
            height: 32,
            cursor: "pointer",
            border: "2px solid #6366f1",
            "&:hover": {
              borderColor: "#5558e3",
            },
          }}
        />
      </Box>
    </NavbarContainer>
  );
};

export default ProfileNavbar;

