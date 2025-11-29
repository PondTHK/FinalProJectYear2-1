"use client";

import * as React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import CompanySidebar from "../../Components/company/CompanySidebar";

const lightTheme = createTheme({
    palette: {
        mode: "light",
        background: {
            default: "#f8fafc",
            paper: "#ffffff",
        },
        primary: {
            main: "#3b82f6",
            light: "#dbeafe",
            dark: "#2563eb",
        },
        text: {
            primary: "#1e293b",
            secondary: "#64748b",
        },
        grey: {
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1",
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                },
                contained: {
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    "&:hover": {
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                },
            },
        },
    },
});

export default function CompanyPublicProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Box
                sx={{
                    display: 'flex',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    position: 'relative',
                }}
            >
                <CompanySidebar />
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        px: { xs: 2, md: 4 },
                        py: { xs: 4, md: 6 },
                        ml: { xs: '120px', md: '280px' },
                        transition: 'margin-left .25s ease',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </ThemeProvider>
    );
}
