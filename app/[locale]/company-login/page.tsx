"use client";

import { FormEvent, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthForms } from "@/app/lib/hooks/use-auth-forms";
import { authAPI, userAPI, companyAPI } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth/auth-context";
import Link from "next/link";


const capsuleInput =
  "w-full rounded-full border border-transparent bg-white px-6 py-4 text-sm text-gray-900 shadow-[0_15px_45px_rgba(15,23,42,0.08)] placeholder:text-gray-400 outline-none transition focus:border-[#ffbb9b] focus:ring-2 focus:ring-[#ff8364]/50";

const formVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

export default function CompanyLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshAuth, isAuthenticated, isLoading: authLoading, userRole } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && userRole) {
      if (userRole === "CompanyUser") {
        router.replace("/company-public-profile");
      } else {
        router.replace("/profile");
      }
    }
  }, [authLoading, isAuthenticated, userRole, router]);

  const {
    loginForm,
    loginErrors,
    handleLoginChange,
    validateLoginForm,
    resetForms,
  } = useAuthForms();

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsLoading(true);

    console.log("🔐 [Company Login] Starting login process...");

    try {
      const isValid = validateLoginForm();
      if (!isValid) {
        console.log("❌ [Company Login] Form validation failed");
        setIsLoading(false);
        return;
      }

      console.log("📤 [Company Login] Attempting login for username:", loginForm.username);
      const response = await authAPI.login(
        loginForm.username,
        loginForm.password,
      );

      console.log("📥 [Company Login] Login response:", {
        ok: response.ok,
        status: response.status,
        data: response.data
      });

      if (response.ok) {
        console.log("✅ [Company Login] Login successful, checking user role...");

        // Fetch user info to check role
        const userInfoResponse = await userAPI.getUserInfo();
        console.log("📥 [Company Login] User info response:", {
          ok: userInfoResponse.ok,
          status: userInfoResponse.status,
          data: userInfoResponse.data
        });

        if (userInfoResponse.ok && userInfoResponse.data) {
          const role = userInfoResponse.data.role;
          console.log("👤 [Company Login] User role:", role);

          // Check if user is CompanyUser
          if (role === "CompanyUser") {
            console.log("🏢 [Company Login] User is CompanyUser, fetching company info...");

            // Check company status
            try {
              const companyResponse = await companyAPI.getCompany();
              console.log("📥 [Company Login] Company response:", {
                ok: companyResponse.ok,
                status: companyResponse.status,
                data: companyResponse.data
              });

              if (companyResponse.ok && companyResponse.data) {
                const status = companyResponse.data.status?.trim() || "";
                console.log("🔍 [Company Login] Company status (raw):", `"${status}"`);
                console.log("🔍 [Company Login] Company status (type):", typeof status);
                console.log("🔍 [Company Login] Full company data:", JSON.stringify(companyResponse.data, null, 2));

                // Check if approved (trim to handle whitespace issues)
                // Normalize status to lowercase for comparison
                const normalizedStatus = status.toLowerCase().trim();
                console.log("🔍 [Company Login] Normalized status:", `"${normalizedStatus}"`);
                console.log("🔍 [Company Login] Status check:", {
                  isApproved: normalizedStatus === "approved",
                  isApprove: normalizedStatus === "approve",
                  isActive: normalizedStatus === "active",
                });
                
                if (normalizedStatus === "approved" || normalizedStatus === "approve" || normalizedStatus === "active") {
                  console.log("✅ [Company Login] Company is approved, redirecting to company-public-profile...");
                  resetForms();
                  
                  // Save username to localStorage for auth context
                  localStorage.setItem("username", loginForm.username);
                  
                  // Set user_role cookie for middleware to read
                  document.cookie = `user_role=CompanyUser; path=/; max-age=2592000; SameSite=Lax`;
                  
                  // Refresh auth context to update state
                  await refreshAuth();
                  
                  // Wait for cookies to be set - check multiple times
                  const checkCookies = () => {
                    const hasCookies = document.cookie.includes("act=") || document.cookie.includes("rft=");
                    console.log("🍪 [Company Login] Checking cookies:", {
                      hasCookies,
                      cookies: document.cookie,
                    });
                    return hasCookies;
                  };
                  
                  // Check cookies immediately
                  if (!checkCookies()) {
                    console.log("⏳ [Company Login] Cookies not set yet, waiting...");
                    // Wait and check again
                    await new Promise(resolve => setTimeout(resolve, 300));
                    if (!checkCookies()) {
                      console.warn("⚠️ [Company Login] Cookies still not set after wait");
                    }
                  }
                  
                  // Additional delay to ensure everything is ready
                  setTimeout(() => {
                    console.log("🚀 [Company Login] Redirecting to company-public-profile...");
                    // Use window.location.href to force full page reload
                    window.location.href = "/company-public-profile";
                  }, 500);
                  return;
                } else {
                  console.log(`⏳ [Company Login] Company status is "${status}", redirecting to pending approval...`);
                  resetForms();
                  
                  // Save username to localStorage for auth context
                  localStorage.setItem("username", loginForm.username);
                  
                  // Refresh auth context to update state
                  await refreshAuth();
                  
                  // Use window.location.href to force full page reload (same as approved case)
                  setTimeout(() => {
                    console.log("🚀 [Company Login] Redirecting to company-pending-approval...");
                    window.location.href = "/company-pending-approval";
                  }, 300);
                  return;
                }
              } else {
                console.error("❌ [Company Login] Failed to fetch company data");
                setSubmitError("ไม่สามารถดึงข้อมูลบริษัทได้ กรุณาลองใหม่อีกครั้ง");
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error("❌ [Company Login] Error checking company status:", error);
              setSubmitError("เกิดข้อผิดพลาดในการตรวจสอบสถานะบริษัท กรุณาลองใหม่อีกครั้ง");
              setIsLoading(false);
              return;
            }
          } else {
            // If not CompanyUser, show error
            console.log("❌ [Company Login] User role is not CompanyUser:", role);
            setSubmitError("บัญชีนี้ไม่ใช่บัญชีบริษัท กรุณาเข้าสู่ระบบผ่านหน้าเข้าสู่ระบบสำหรับผู้ใช้ทั่วไป");
            setIsLoading(false);
            return;
          }
        } else {
          console.error("❌ [Company Login] Failed to fetch user info");
          setSubmitError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
          setIsLoading(false);
          return;
        }
      } else {
        console.log("❌ [Company Login] Login failed with status:", response.status);
        const errorMessage = typeof response.data === 'string'
          ? response.data
          : 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        setSubmitError(errorMessage);
      }
    } catch (error) {
      console.error("❌ [Company Login] Unexpected error:", error);
      setSubmitError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a45]"></div>
      </main>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated && userRole) {
    return (
      <main className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a45]"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111] text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl font-['Plus Jakarta Sans',_Inter,_'Helvetica Neue',_sans-serif]">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-center gap-3 text-[#ff6a45]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffece4] text-lg font-semibold tracking-tight text-[#ff6a45] shadow-inner">
            SP
          </div>
          <span className="text-xs uppercase tracking-[0.45em] text-gray-400">
            smart persona
          </span>
        </motion.div>

        <motion.div
          variants={formVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 rounded-[32px]"
        >
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-white sm:text-[2.75rem]">
              เข้าสู่ระบบสำหรับบริษัท
            </h1>
            <p className="text-base text-gray-500">
              เข้าสู่ระบบเพื่อจัดการงานและหาคนที่ใช่สำหรับบริษัทของคุณ
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-500"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                className={capsuleInput}
                required
                value={loginForm.username || ""}
                onChange={(e) =>
                  handleLoginChange("username", e.target.value)
                }
                disabled={isLoading}
              />
              {loginErrors.username && (
                <p className="text-sm text-red-500">
                  {loginErrors.username}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-500"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className={capsuleInput}
                required
                value={loginForm.password || ""}
                onChange={(e) =>
                  handleLoginChange("password", e.target.value)
                }
                disabled={isLoading}
              />
              {loginErrors.password && (
                <p className="text-sm text-red-500">
                  {loginErrors.password}
                </p>
              )}
            </div>

            {submitError && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#ffb067] via-[#ff8364] to-[#ff5d6b] px-6 py-4 text-sm font-semibold text-white shadow-[0_25px_45px_rgba(255,131,100,0.45)] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff8364] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="tracking-wide">
                {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </span>
            </button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">
              ยังไม่มีบัญชี?{" "}
              <Link
                href="/company-register"
                className="text-[#ff6a45] hover:text-[#ff8364] transition font-medium"
              >
                สมัครสมาชิก
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              หรือ{" "}
              <Link
                href="/auth"
                className="text-[#ff6a45] hover:text-[#ff8364] transition"
              >
                เข้าสู่ระบบสำหรับผู้ใช้ทั่วไป
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            โดยการดำเนินการต่อ คุณยอมรับ{" "}
            <span className="text-[#ff6a45]">ข้อกำหนด</span> และ{" "}
            <span className="text-[#ff6a45]">นโยบายความเป็นส่วนตัว</span>{" "}
            ของเรา
          </p>
        </motion.div>
      </div>
    </main>
  );
}
