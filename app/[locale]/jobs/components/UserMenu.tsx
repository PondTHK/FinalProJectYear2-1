"use client";

import React, { useState, useEffect } from "react";
import {
    Avatar,
    Box,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Tooltip,
    Typography,
    Skeleton,
} from "@mui/material";
import { User, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
    first_name_en?: string;
    last_name_en?: string;
    profile_image_url?: string;
    email?: string;
}

export function UserMenu() {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const open = Boolean(anchorEl);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile");

                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });

            // Clear localStorage as well
            localStorage.removeItem("username");
            localStorage.removeItem("profile_image_url");
            localStorage.removeItem("cover_image_url");
            localStorage.removeItem("user_about_me");

            // Redirect to landing page
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const displayName = profile
        ? `${profile.first_name_en || ""} ${profile.last_name_en || ""}`.trim() || "User"
        : "User";

    return (
        <>
            <Box sx={{ display: "flex", alignItems: "center", textAlign: "center" }}>
                <Tooltip title="Account settings">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={open ? "account-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? "true" : undefined}
                    >
                        {loading ? (
                            <Skeleton variant="circular" width={40} height={40} />
                        ) : (
                            <Avatar
                                src={profile?.profile_image_url || ""}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: "black",
                                    color: "white",
                                    border: "2px solid rgba(0,0,0,0.1)",
                                }}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </Avatar>
                        )}
                    </IconButton>
                </Tooltip>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        borderRadius: 3,
                        minWidth: 200,
                        "& .MuiAvatar-root": {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: "background.paper",
                            transform: "translateY(-50%) rotate(45deg)",
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {loading ? <Skeleton width={100} /> : displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {profile?.email || "user@example.com"}
                    </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => router.push("/profile")}>
                    <ListItemIcon>
                        <User size={18} />
                    </ListItemIcon>
                    Profile
                </MenuItem>
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <Settings size={18} />
                    </ListItemIcon>
                    Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                    <ListItemIcon>
                        <LogOut size={18} color="var(--mui-palette-error-main)" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </>
    );
}
