'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, CircularProgress, Alert, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { companyAPI, CompanyResponse, CompanyGalleryResponse, CompanyPostResponse } from '@/app/lib/api';
import { useAuth } from '@/app/lib/auth/auth-context';
import CompanyHeader from '@/app/Components/company-profile/CompanyHeader';
import CompanyAbout from '@/app/Components/company-profile/CompanyAbout';
import CompanyGallery from '@/app/Components/company-profile/CompanyGallery';
import CompanyPosts from '@/app/Components/company-profile/CompanyPosts';

export default function CompanyProfilePage() {
    const { isAuthenticated, isLoading, userRole } = useAuth();
    const router = useRouter();
    const [company, setCompany] = useState<CompanyResponse | null>(null);
    const [galleries, setGalleries] = useState<CompanyGalleryResponse[]>([]);
    const [posts, setPosts] = useState<CompanyPostResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect((): void | (() => void) => {
        console.log("🔍 [Company Profile] Auth check:", {
            isLoading,
            isAuthenticated,
            userRole,
        });

        // Wait for auth context to finish loading
        if (isLoading) {
            console.log("⏳ [Company Profile] Auth context still loading...");
            return;
        }

        // Since cookies are httpOnly, we can't check them directly via document.cookie
        // Instead, we rely on auth context which checks via API call
        // If auth context says not authenticated but we just logged in, wait a bit
        if (!isAuthenticated) {
            console.log("⏳ [Company Profile] Not authenticated, checking if we need to wait...");
            
            // If we just logged in, auth context might not have updated yet
            // Try to verify by calling API directly
            const verifyAuth = async () => {
                try {
                    const { userAPI } = await import('@/app/lib/api');
                    const userInfoResponse = await userAPI.getUserInfo();
                    if (userInfoResponse.ok && userInfoResponse.data) {
                        console.log("✅ [Company Profile] API call successful, user is authenticated");
                        // User is authenticated, just wait for auth context to update
                        // Don't redirect, just wait
                        return;
                    }
                } catch (error) {
                    console.error("❌ [Company Profile] API call failed:", error);
                }
                
                // If API call fails, user is not authenticated
                console.log("❌ [Company Profile] Not authenticated, redirecting to login");
                router.replace("/company-login");
            };
            
            // Wait a bit before checking to give auth context time to update
            const timeout = setTimeout(() => {
                verifyAuth();
            }, 500);
            
            return () => clearTimeout(timeout);
        }

        // If authenticated, check role
        if (isAuthenticated) {
            if (userRole === "PersonaUser") {
                console.log("❌ [Company Profile] PersonaUser trying to access, redirecting to profile");
                router.replace("/profile");
                return;
            }
            
            // If role is not set yet, wait a bit more for it to load
            if (!userRole) {
                console.log("⏳ [Company Profile] Waiting for user role...");
                return;
            }
            
            console.log("✅ [Company Profile] Access allowed");
        }
        return;
    }, [isAuthenticated, isLoading, userRole, router]);

    useEffect(() => {
        // Don't fetch if:
        // 1. Not authenticated
        // 2. Role is PersonaUser (explicitly wrong role)
        // 3. Still loading (wait for role to be determined)
        if (!isAuthenticated || userRole === "PersonaUser" || isLoading) {
            if (isLoading) {
                console.log("⏳ [Company Profile] Still loading, waiting to fetch...");
            }
            return;
        }
        
        // If role is not set yet, wait a bit more
        if (!userRole) {
            console.log("⏳ [Company Profile] Role not set yet, waiting...");
            return;
        }
        
        console.log("📥 [Company Profile] Fetching company data...", {
            isAuthenticated,
            userRole,
        });

        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch company details
                const companyRes = await companyAPI.getCompany();
                if (!companyRes.ok || !companyRes.data) {
                    // If 404, it might mean the user hasn't created a company yet
                    if (companyRes.status === 404) {
                        setError('No company profile found. Please complete onboarding.');
                    } else {
                        throw new Error('Failed to load company profile');
                    }
                    return;
                }
                
                // Check company status - redirect if not approved
                // Normalize status to handle case variations
                const status = companyRes.data.status?.toLowerCase().trim() || "";
                if (status !== "approved" && status !== "approve" && status !== "active") {
                    router.replace("/company-pending-approval");
                    return;
                }
                
                setCompany(companyRes.data);

                // Fetch galleries and posts using the company ID
                if (companyRes.data.id) {
                    const [galleryRes, postsRes] = await Promise.all([
                        companyAPI.getGalleries(companyRes.data.id),
                        companyAPI.getPosts(companyRes.data.id),
                    ]);

                    if (galleryRes.ok && galleryRes.data) {
                        setGalleries(galleryRes.data);
                    }

                    if (postsRes.ok && postsRes.data) {
                        setPosts(postsRes.data);
                    }
                }
            } catch (err) {
                console.error('Error fetching company data:', err);
                setError('Failed to load company profile. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, isLoading, router, userRole]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    if (userRole === "PersonaUser") {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบด้วยบัญชี CompanyUser
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push("/profile")}
                    variant="outlined"
                >
                    กลับไปหน้า Profile
                </Button>
            </Container>
        );
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!company) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="info">No company profile found.</Alert>
            </Container>
        );
    }

    return (
        <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>
                <CompanyHeader company={company} />
                <CompanyAbout company={company} />
                <CompanyGallery galleries={galleries} />
                <CompanyPosts posts={posts} />
            </Container>
        </Box>
    );
}
