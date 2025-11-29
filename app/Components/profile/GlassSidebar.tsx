"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  styled,
  Tooltip,
  Typography,
  Avatar,
} from "@mui/material";
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Logout as LogoutIcon,
  WorkOutline as WorkOutlineIcon,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { userAPI, type UserProfileResponse } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth/auth-context";

const SidebarShell = styled(Box, {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{
  expanded: boolean;
}>(({ expanded }) => ({
  position: "fixed",
  top: 16,
  left: 16,
  height: "calc(100vh - 32px)",
  width: expanded ? 280 : 84,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: expanded ? "24px 20px" : "20px 12px",
  borderRadius: 28,
  background: "rgba(255, 255, 255, 0.95)", // Solid semi-transparent white
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.30)",
  boxShadow:
    "0 24px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.35)",
  zIndex: 1200,
  transition: "width .25s ease, padding .25s ease",
  "&::after": {
    content: '""',
    position: "absolute",
    left: 2,
    top: 20,
    bottom: 20,
    width: 2,
    display: "none", // Remove gradient border effect
    borderRadius: 2,
  },
}));

const MenuButton = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "active" && prop !== "expanded" && prop !== "color",
})<{
  active?: boolean;
  expanded?: boolean;
  color?: string;
}>(({ active, expanded, color = "#6366f1" }) => {
  // Parse hex color to RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    display: "flex",
    alignItems: "center",
    justifyContent: expanded ? "flex-start" : "center",
    width: "100%",
    padding: expanded ? "12px 16px" : "12px 0",
    borderRadius: expanded ? 12 : 18,
    cursor: "pointer",
    transition: "all .25s ease",
    backgroundColor: active
      ? expanded
        ? `rgba(${r}, ${g}, ${b}, 0.15)`
        : `rgba(${r}, ${g}, ${b}, 0.20)`
      : expanded
        ? "transparent"
        : "rgba(255,255,255,0.20)",
    border: expanded
      ? "none"
      : active
        ? `2px solid rgba(${r}, ${g}, ${b}, 0.5)`
        : "1px solid rgba(255,255,255,0.40)",
    boxShadow: expanded
      ? active
        ? `0 2px 8px rgba(${r}, ${g}, ${b}, 0.2)`
        : "none"
      : active
        ? `0 8px 24px rgba(${r}, ${g}, ${b}, 0.3), inset 0 1px 0 rgba(255,255,255,0.6)`
        : "0 8px 18px rgba(0,0,0,0.16)",
    color: "#111827",
    "&:hover": {
      backgroundColor: active
        ? expanded
          ? `rgba(${r}, ${g}, ${b}, 0.25)`
          : `rgba(${r}, ${g}, ${b}, 0.30)`
        : expanded
          ? `rgba(${r}, ${g}, ${b}, 0.08)`
          : `rgba(${r}, ${g}, ${b}, 0.15)`,
      transform: expanded ? "translateX(2px)" : "translateX(2px)",
      boxShadow: expanded
        ? `0 4px 12px rgba(${r}, ${g}, ${b}, 0.25)`
        : `0 12px 26px rgba(${r}, ${g}, ${b}, 0.25)`,
      border: expanded
        ? "none"
        : `2px solid rgba(${r}, ${g}, ${b}, 0.6)`,
    },
    "& .MuiSvgIcon-root": {
      fontSize: 24,
      color: active ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, 0.8)`,
      marginRight: expanded ? 12 : 0,
      marginLeft: expanded ? 0 : 0,
      transition: "color .25s ease",
    },
  };
});

const GlassSidebar: React.FC = () => {
  const [expanded, setExpanded] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const { logout } = useAuth();

  const menu = React.useMemo(
    () => [
      {
        icon: <WorkOutlineIcon />,
        label: "หางาน",
        href: "/jobs",
        color: "#ec4899", // Pink - ดึงดูดสายตา เน้นการกระทำ
      },
      {
        icon: <PersonIcon />,
        label: "โปรไฟล์",
        href: "/profile",
        color: "#3b82f6", // Blue - สื่อถึงความน่าเชื่อถือและความเป็นมืออาชีพ
      },
      {
        icon: <SettingsIcon />,
        label: "ตั้งค่า",
        href: "/onboarding",
        color: "#00B8DB", // Slate - สื่อถึงเครื่องมือและการจัดการ
      },
    ],
  );

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        if (response.ok && response.data) {
          setProfile(response.data as UserProfileResponse);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    loadProfile();

    // Load profile image from localStorage
    if (typeof window !== "undefined") {
      const savedImageUrl = localStorage.getItem("profile_image_url");
      if (savedImageUrl) {
        setProfileImageUrl(savedImageUrl);
      }
    }
  }, []);

  const currentIndex = React.useMemo(() => {
    const foundIndex = menu.findIndex(
      (item) => item.href && pathname?.startsWith(item.href),
    );
    return foundIndex === -1 ? 0 : foundIndex;
  }, [menu, pathname]);

  const handleNavigate = (href?: string) => {
    if (!href) return;
    router.push(href);
  };



  const handleGoToProfile = () => {
    router.push("/profile");
    handleAccountMenuClose();
  };

  const handleLogout = () => {
    logout();
  };

  const displayName = profile
    ? `${profile.first_name_en || profile.first_name_th || ""} ${profile.last_name_en || profile.last_name_th || ""
      }`.trim() || "ผู้ใช้งานใหม่"
    : "ผู้ใช้งานใหม่";


  return (
    <SidebarShell expanded={expanded}>
      {/* Toggle handle */}
      <Box
        onClick={() => setExpanded((e) => !e)}
        sx={{
          position: "absolute",
          right: -12,
          top: "50%",
          transform: "translateY(-50%)",
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
          cursor: "pointer",
          transition: "all .25s ease",
          "&:hover": {
            background: "rgba(255,255,255,0.95)",
            transform: "translateY(-50%) scale(1.1)",
          },
        }}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      />

      {/* Header - App Name or Logo */}
      <Box
        sx={{
          width: "100%",
          mb: expanded ? 3 : 2,
          display: "flex",
          justifyContent: expanded ? "flex-start" : "center",
          alignItems: "center",
        }}
      >
        {expanded ? (
          <Typography
            variant="h5"
            sx={{
              color: "#111827",
              fontWeight: 700,
              fontSize: "1.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            FYNEX
          </Typography>
        ) : (
          <Typography
            variant="h5"
            sx={{
              color: "#111827",
              fontWeight: 700,
              fontSize: "1.5rem",
              letterSpacing: "-0.02em",
            }}
          >

          </Typography>
        )}
      </Box>

      {/* Profile Section */}
      <Box
        sx={{
          width: "100%",
          mb: 3,
          pb: 3,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {expanded ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              p: 1.5,
              borderRadius: 2,
              transition: "background .25s ease",
              "&:hover": {
                background: "rgba(99, 102, 241, 0.1)",
              },
            }}
            onClick={handleGoToProfile}
          >
            <Avatar
              src={profileImageUrl || ""}
              sx={{
                width: 48,
                height: 48,
                border: "2px solid rgba(255,255,255,0.55)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
              }}
            >
              {!profileImageUrl && <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                sx={{
                  color: "#111827",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  mb: 0.25,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: "0.8rem",
                }}
              >
                My Account
              </Typography>
            </Box>
            <ExpandMoreIcon
              sx={{ color: "#6b7280", fontSize: 20 }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Avatar
              src={profileImageUrl || ""}
              sx={{
                width: 36,
                height: 36,
                border: "2px solid rgba(255,255,255,0.55)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                cursor: "pointer",
              }}
            >
              {!profileImageUrl && <PersonIcon />}
            </Avatar>
          </Box>
        )}
      </Box>

      {/* Account Menu */}
      {/* <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={handleAccountMenuClose}
        PaperProps={{
          sx: {
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.90) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.40)",
            borderRadius: 2,
            mt: 1,
            minWidth: 200,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        <MenuItem
          onClick={handleGoToOnboarding}
          sx={{
            color: "#111827",
            "&:hover": {
              background: "rgba(99, 102, 241, 0.1)",
            },
          }}
        >
          <AccountCircleIcon sx={{ mr: 2, fontSize: 20 }} />
          แก้ไขโปรไฟล์
        </MenuItem>
      </Menu> */}

      {/* Menu Section */}
      <Box
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: expanded ? "stretch" : "flex-start",
          justifyContent: expanded ? "flex-start" : "flex-start",
        }}
      >
        {expanded && (
          <Typography
            variant="caption"
            sx={{
              color: "#111827",
              opacity: 0.7,
              fontWeight: 700,
              letterSpacing: ".08em",
              px: 1,
              mb: 1,
              fontSize: "0.7rem",
              textTransform: "uppercase",
            }}
          >
            MENU
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            width: "100%",
            alignItems: expanded ? "stretch" : "flex-start",
          }}
        >
          {menu.map((m, i) => (
            <Tooltip
              key={i}
              title={!expanded ? m.label : ""}
              placement="right"
              arrow
            >
              <MenuButton
                active={currentIndex === i}
                expanded={expanded}
                color={m.color}
                onClick={() => handleNavigate(m.href)}
                sx={{
                  width: expanded ? "100%" : 52,
                  height: 52,
                  margin: expanded ? 0 : "6px 0",
                  marginLeft: expanded ? 0 : 0,
                }}
              >
                {m.icon}
                {expanded && (
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        currentIndex === i
                          ? m.color
                          : "rgba(17, 24, 39, 0.7)",
                      fontWeight: currentIndex === i ? 700 : 500,
                      fontSize: "0.95rem",
                      transition: "color .25s ease",
                    }}
                  >
                    {m.label}
                  </Typography>
                )}
              </MenuButton>
            </Tooltip>
          ))}
        </Box>
        <Box
          sx={{
            width: "100%",
            mt: "auto",
            pt: 2,
            borderTop: expanded ? "1px solid rgba(0,0,0,0.08)" : "none",
          }}
        >
          <MenuButton
            expanded={expanded}
            color="#ef4444"
            onClick={handleLogout}
            sx={{
              width: expanded ? "100%" : 52,
              height: 52,
              marginTop: expanded ? 0 : 1,
            }}
          >
            <LogoutIcon />
            {expanded && (
              <Typography
                variant="body2"
                sx={{
                  color: "#ef4444",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  transition: "color .25s ease",
                }}
              >
                ออกจากระบบ
              </Typography>
            )}
          </MenuButton>
        </Box>
      </Box>
    </SidebarShell>
  );
};

export default GlassSidebar;
