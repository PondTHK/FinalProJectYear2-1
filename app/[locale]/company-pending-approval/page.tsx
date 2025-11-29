"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/auth/auth-context";
import { companyAPI } from "@/app/lib/api";
import { CheckCircle, Clock, Mail, LogOut } from "lucide-react";

export default function CompanyPendingApprovalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userRole, logout } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/company-login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const checkCompanyStatus = useCallback(async () => {
    try {
      setCheckingStatus(true);
      const response = await companyAPI.getCompany();
      if (response.ok && response.data) {
        const status = response.data.status;
        const name = response.data.company_name || "";
        setCompanyName(name);

        // If approved, redirect to company public profile
        // Normalize status to handle case variations
        const normalizedStatus = status?.toLowerCase().trim() || "";
        if (normalizedStatus === "approved" || normalizedStatus === "approve" || normalizedStatus === "active") {
          router.push("/company-public-profile");
          return; // Don't set checkingStatus to false, let redirect happen
        }
        // If pending or rejected, stay on this page and show UI
        setCheckingStatus(false);
      } else {
        // No company data - might be an error, but still show the page
        setCheckingStatus(false);
      }
    } catch (error) {
      console.error("Failed to check company status:", error);
      setCheckingStatus(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/company-login");
      return;
    }

    // Only redirect if userRole is actually set and is not CompanyUser
    // Don't redirect if userRole is null (still loading)
    if (!isLoading && isAuthenticated && userRole && userRole !== "CompanyUser") {
      router.replace("/profile");
      return;
    }

    // Check company status
    if (isAuthenticated && userRole === "CompanyUser") {
      checkCompanyStatus();
    }
  }, [checkCompanyStatus, isAuthenticated, isLoading, userRole, router]);

  if (checkingStatus || isLoading) {
    return (
      <main className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6a45] mx-auto mb-4"></div>
          <p className="text-gray-400">กำลังตรวจสอบสถานะ...</p>
        </div>
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 rounded-[32px] bg-[#1a1a1a] p-8 border border-gray-800"
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-[#ff6a45]/20 rounded-full blur-xl"></div>
                <Clock className="w-20 h-20 text-[#ff6a45] relative z-10" />
              </div>
            </div>

            <h1 className="text-4xl font-semibold text-white sm:text-[2.75rem]">
              รอการอนุมัติ
            </h1>
            {companyName && (
              <p className="text-lg text-[#ff6a45] font-medium">
                {companyName}
              </p>
            )}
            <p className="text-base text-gray-400 max-w-md mx-auto">
              ขอบคุณที่สมัครสมาชิกกับ Smart Persona
              <br />
              เราได้รับคำขอสมัครสมาชิกของคุณแล้ว และกำลังตรวจสอบข้อมูล
            </p>
          </div>

          <div className="space-y-6 bg-[#222] rounded-2xl p-6 border border-gray-700">
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-[#ff6a45] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  เราได้ส่งอีเมลยืนยันไปยังคุณแล้ว
                </h3>
                <p className="text-sm text-gray-400">
                  กรุณาตรวจสอบอีเมลของคุณเพื่อดูรายละเอียดเพิ่มเติม
                  เราแจ้งเตือนคุณทันทีเมื่อได้รับการอนุมัติ
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  ขั้นตอนต่อไป
                </h3>
                <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                  <li>ทีมงานของเราจะตรวจสอบข้อมูลบริษัทของคุณ</li>
                  <li>คุณจะได้รับอีเมลแจ้งเตือนเมื่อได้รับการอนุมัติ</li>
                  <li>หลังจากอนุมัติแล้ว คุณสามารถเข้าสู่ระบบและใช้งานได้ทันที</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              มีคำถาม? ติดต่อเราได้ที่{" "}
              <a
                href="mailto:support@FYNEX.com"
                className="text-[#ff6a45] hover:text-[#ff8364] transition"
              >
                support@FYNEX.com
              </a>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={checkCompanyStatus}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#222] border border-gray-700 text-white hover:bg-[#2a2a2a] transition text-sm font-medium"
              >
                <Clock className="w-4 h-4" />
                ตรวจสอบสถานะอีกครั้ง
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
