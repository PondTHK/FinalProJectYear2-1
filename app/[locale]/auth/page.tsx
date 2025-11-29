"use client";

import { ReactNode, useState, Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AuthForm from "../../Components/auth/AuthForm";
import { AuthMode } from "../../Components/auth/types";
import { useAuth } from "../../lib/auth/auth-context";

const Showcase = dynamic(() => import("../../Components/auth/Showcase"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-3xl bg-white/5" />
  ),
});

type PanelVariant = "form" | "showcase";


const slideTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as const,
};

const leftSlideVariants = {
  enter: { x: "110%", opacity: 0 },
  center: { x: "0%", opacity: 1 },
  exit: { x: "-110%", opacity: 0 },
};

const rightSlideVariants = {
  enter: { x: "-110%", opacity: 0 },
  center: { x: "0%", opacity: 1 },
  exit: { x: "110%", opacity: 0 },
};

export default function AuthExperiencePage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const isSignup = mode === "signup";
  const leftVariant: PanelVariant = isSignup ? "showcase" : "form";
  const rightVariant: PanelVariant = isSignup ? "form" : "showcase";

  // Redirect authenticated users based on their role
  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole) {
      if (userRole === "CompanyUser") {
        router.replace("/company-public-profile");
      } else {
        router.replace("/profile");
      }
    }
  }, [isLoading, isAuthenticated, userRole, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </main>
    );
  }

  // Don't render auth form if user is authenticated (will redirect)
  if (isAuthenticated && userRole) {
    return (
      <main className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111] text-white">
      <div className="hidden min-h-screen grid-cols-2 gap-0 overflow-hidden px-8 py-12 sm:px-12 lg:grid lg:px-16">
        <SlidingSlot position="left" variant={leftVariant}>
          {leftVariant === "form" ? (
            <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
              <AuthForm mode={mode} onModeChange={setMode} />
            </Suspense>
          ) : (
            <Showcase mode={mode} />
          )}
        </SlidingSlot>

        <SlidingSlot position="right" variant={rightVariant}>
          {rightVariant === "form" ? (
            <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
              <AuthForm mode={mode} onModeChange={setMode} />
            </Suspense>
          ) : (
            <Showcase mode={mode} />
          )}
        </SlidingSlot>
      </div>

      <div className="flex min-h-screen flex-col gap-12 px-6 py-12 sm:px-10 lg:hidden">
        <PanelSurface variant="form">
          <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
            <AuthForm mode={mode} onModeChange={setMode} />
          </Suspense>
        </PanelSurface>
        <PanelSurface variant="showcase">
          <Showcase mode={mode} />
        </PanelSurface>
      </div>
    </main>
  );
}

type SlidingSlotProps = {
  position: "left" | "right";
  variant: PanelVariant;
  children: ReactNode;
};

function SlidingSlot({ position, variant, children }: SlidingSlotProps) {
  // key เปลี่ยนเมื่อ panel กลับด้าน ทำให้ AnimatePresence เล่นอนิเมชันออก-เข้าให้ครบ
  const key = `${variant}-${position}`;
  const variants = position === "left" ? leftSlideVariants : rightSlideVariants;

  return (
    <div className="relative flex h-full items-stretch overflow-hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={key}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={slideTransition}
          className="absolute inset-0 flex"
        >
          <PanelSurface variant={variant}>{children}</PanelSurface>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type PanelSurfaceProps = {
  children: ReactNode;
  variant: PanelVariant;
};

function PanelSurface({ children, variant }: PanelSurfaceProps) {
  // แค่สลับ padding/เงาให้รู้สึกว่าฟอร์มคือบัตรใบเล็ก ส่วนโชว์เคสคือภาพใหญ่เต็มพื้นที่
  const padding =
    variant === "form"
      ? "px-8 py-12 sm:px-14 lg:px-16 lg:py-12"
      : "px-2 sm:px-4 lg:px-6";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center ${padding}`}
    >
      {variant === "form" ? (
        <div className="w-full max-w-md">{children}</div>
      ) : (
        <div className="h-full w-full rounded-3xl shadow-[0_45px_120px_rgba(0,0,0,0.45)]">
          {children}
        </div>
      )}
    </div>
  );
}
