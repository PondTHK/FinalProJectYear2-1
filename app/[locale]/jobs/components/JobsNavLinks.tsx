"use client";

import React from "react";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    Bookmark,
    MapPin,
    Sparkles,
    Briefcase,
} from "lucide-react";
import { NAV_ITEMS, NavSection } from "../constants";
import { UserMenu } from "./UserMenu";
import LanguageSwitcher from "@/app/Components/LanguageSwitcher";
import { useTranslations } from "next-intl";

const JobsNavWrapper = styled("div")(() => ({
    color: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "0.25rem 0",
    width: "100%",
    ".inner": {
        width: "100%",
        maxWidth: 800,
        display: "flex",
        justifyContent: "center",
    },
    ".menu": {
        padding: "0.55rem 1rem",
        backgroundColor: "#fff",
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 20,
        boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
        border: "1px solid rgba(15,15,15,0.08)",
        gap: "0.4rem",
        width: "100%",
    },
    ".links": {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1.2rem",
        flex: 1,
        padding: "0 1rem",
    },
    ".profile-slot": {
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        marginLeft: "0.5rem",
    },
    ".link": {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 44,
        borderRadius: 16,
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
        transformOrigin: "center",
        transition: "width 0.25s ease, justify-content 0.25s ease",
        textDecoration: "none",
        color: "inherit",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        font: "inherit",
        padding: "0 16px",
        gap: 0,
        "&:before": {
            position: "absolute",
            zIndex: -1,
            content: '""',
            display: "block",
            borderRadius: 12,
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            transform: "scaleX(0)",
            transition: "transform 0.25s ease",
            transformOrigin: "right center",
            backgroundColor: "#eee",
        },
        "&:hover": {
            outline: 0,
        },
        "&:focus-visible": {
            outline: "2px solid rgba(0,0,0,0.35)",
            outlineOffset: 2,
        },
        "&.active, &:hover, &:focus-visible": {
            width: 140,
            justifyContent: "flex-start",
            gap: 12,
            "&:before": {
                transform: "scaleX(1)",
                transformOrigin: "left center",
            },
            "& .link-title": {
                maxWidth: 120,
                opacity: 1,
                marginLeft: 4,
            },
        },
    },
    ".link-icon": {
        width: 26,
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "transform 0.25s ease",
        svg: {
            width: 24,
            height: 24,
        },
    },
    ".link-title": {
        maxWidth: 0,
        opacity: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        fontSize: "0.9rem",
        fontWeight: 600,
        transition: "max-width 0.25s ease, opacity 0.15s ease, margin-left 0.25s ease",
    },
    "@media (max-width: 900px)": {
        ".menu": {
            flexDirection: "column",
            gap: "0.75rem",
        },
        ".links": {
            flexWrap: "wrap",
            width: "100%",
            paddingRight: 0,
        },
        ".profile-slot": {
            width: "100%",
            justifyContent: "center",
            flexWrap: "wrap",
            marginLeft: 0,
        },
    },
}));

const NAV_ICON_MAP: Record<NavSection, React.ReactNode> = {
    jobs: <Briefcase size={22} />,
    saved: <Bookmark size={22} />,
    near_me: <MapPin size={22} />,
    "ai-matching": <Sparkles size={22} />,
};

type JobsNavLinksProps = {
    section: NavSection;
    onSectionChange: (next: NavSection) => void;
    isLoggedIn: boolean;
};

export function JobsNavLinks({
    section,
    onSectionChange,
    isLoggedIn
}: JobsNavLinksProps) {
    const t = useTranslations("Jobs");
    const tNav = useTranslations("Jobs.nav");

    // Map section IDs to translation keys
    const navKeyMap: Record<string, string> = {
        jobs: "jobs",
        companies: "companies",
        saved: "saved",
        near_me: "nearMe",
        "ai-matching": "aiMatching"
    };

    return (
        <JobsNavWrapper>
            <div className="inner">
                <div className="menu">
                    <div className="links">
                        {NAV_ITEMS.map((item) => {
                            const active = section === item.id;
                            const className = active ? "link active" : "link";
                            const translationKey = navKeyMap[item.id] || item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={className}
                                    aria-pressed={active}
                                    onClick={() => onSectionChange(item.id)}
                                >
                                    <span className="link-icon">{NAV_ICON_MAP[item.id]}</span>
                                    <span className="link-title">{tNav(translationKey)}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="profile-slot">
                        <LanguageSwitcher variant="dark" />
                        {isLoggedIn ? (
                            <UserMenu />
                        ) : (
                            <>
                                <Button variant="text" size="small" sx={{ textTransform: "none", minWidth: 0 }} href="/auth">
                                    {t("login")}
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    disableElevation
                                    sx={{ textTransform: "none", borderRadius: 999, px: 2 }}
                                    href="/auth"
                                >
                                    {t("getStarted")}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </JobsNavWrapper>
    );
}
