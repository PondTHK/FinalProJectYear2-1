"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GoogleIcon from "@mui/icons-material/Google";
import { AuthMode } from "./types";
import { useAuthForms } from "@/app/lib/hooks/use-auth-forms";
import { authAPI, userAPI } from "@/app/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

// --- Constants ---

const BRAND_NAME = "Smart Persona";
const AUTH_MODES: { [key: string]: AuthMode } = {
  SIGN_UP: "signup",
  SIGN_IN: "signin",
};
const REDIRECT_URLS = {
  ONBOARDING: "/onboarding",
  PROFILE: "/profile",
};

const socialProviders = [
  { id: "google", label: "Google", icon: GoogleIcon },
];

const fieldSets = {
  [AUTH_MODES.SIGN_UP]: [
    { id: "username", label: "Username", type: "text", placeholder: "Enter your username", autoComplete: "username" },
    { id: "password", label: "Password", type: "password", placeholder: "Enter a secure password", autoComplete: "new-password" },
    { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Confirm your password", autoComplete: "new-password" },
  ],
  [AUTH_MODES.SIGN_IN]: [
    { id: "username", label: "Username", type: "text", placeholder: "Enter your username", autoComplete: "username" },
    { id: "password", label: "Password", type: "password", placeholder: "Enter your password", autoComplete: "current-password" },
  ],
};

const contentMap = {
  [AUTH_MODES.SIGN_UP]: {
    title: `Start with ${BRAND_NAME}`,
    subtitle: "Spin up your workspace in minutes and invite your team when you're ready.",
    primaryCta: `Sign up to ${BRAND_NAME}`,
    toggleCopy: "Already have an account?",
    toggleAction: "Sign in",
    socialLabelPrefix: "Sign up with",
  },
  [AUTH_MODES.SIGN_IN]: {
    title: `Welcome back to ${BRAND_NAME}`,
    subtitle: "Pick up where you left off and keep your Smart Persona automations flowing.",
    primaryCta: `Sign in to ${BRAND_NAME}`,
    toggleCopy: "Don't have an account yet?",
    toggleAction: "Sign up",
    socialLabelPrefix: "Sign in with",
  },
};

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid username or password.",
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
};

// --- Styles ---

const capsuleInput = "w-full rounded-full border border-transparent bg-white px-6 py-4 text-sm text-gray-900 shadow-[0_15px_45px_rgba(15,23,42,0.08)] placeholder:text-gray-400 outline-none transition focus:border-[#ffbb9b] focus:ring-2 focus:ring-[#ff8364]/50";
const socialButton = "flex flex-1 items-center justify-center gap-3 rounded-full border border-white/40 bg-white/80 px-5 py-4 text-base font-medium text-gray-700 backdrop-blur-sm shadow-[0_20px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-[#ffbfa9] hover:text-[#ff6a45]";
const formVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

// --- Component ---

type AuthFormProps = {
  mode: AuthMode;
  onModeChange: (next: AuthMode) => void;
};

export default function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    loginForm,
    registerForm,
    loginErrors,
    registerErrors,
    handleLoginChange,
    handleRegisterChange,
    validateLoginForm,
    validateRegisterForm,
    resetForms,
  } = useAuthForms();

  const performSignIn = async () => {
    if (!validateLoginForm()) return;

    const response = await authAPI.login(loginForm.username, loginForm.password);
    if (response.ok) {
      console.log("Login successful:", response.data);
      
      // Fetch user info to check role
      const userInfoResponse = await userAPI.getUserInfo();
      if (userInfoResponse.ok && userInfoResponse.data) {
        const role = userInfoResponse.data.role;
        
        // Check if user is CompanyUser - prevent them from logging in through user login
        if (role === "CompanyUser") {
          setSubmitError("บัญชีนี้เป็นบัญชีบริษัท กรุณาเข้าสู่ระบบผ่านหน้าเข้าสู่ระบบสำหรับบริษัท");
          return;
        }
        
        // Set user_role cookie for middleware to read
        document.cookie = `user_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
      }
      
      resetForms();
      const redirectUrl = searchParams.get('redirect') || REDIRECT_URLS.PROFILE;
      router.push(redirectUrl);
    } else {
      setSubmitError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
  };

  const performSignUp = async () => {
    if (!validateRegisterForm()) return;

    const registerResponse = await userAPI.register(registerForm.username, registerForm.password);
    if (!registerResponse.ok) {
      // Check if it's a duplicate username error
      const errorMsg = typeof registerResponse.data === 'string' ? registerResponse.data.toLowerCase() : '';
      if (errorMsg.includes('duplicate') || errorMsg.includes('unique') || errorMsg.includes('already exists')) {
        setSubmitError("ชื่อผู้ใช้นี้มีคนใช้งานแล้ว กรุณาเลือกชื่อผู้ใช้อื่น");
      } else {
        setSubmitError(ERROR_MESSAGES.REGISTRATION_FAILED);
      }
      return;
    }

    // Auto-login after successful registration
    const loginResponse = await authAPI.login(registerForm.username, registerForm.password);
    if (loginResponse.ok) {
      console.log("Registration and login successful:", loginResponse.data);
      
      // Set user_role cookie for middleware (new users are PersonaUser by default)
      document.cookie = `user_role=PersonaUser; path=/; max-age=2592000; SameSite=Lax`;
      
      resetForms();
      router.push(REDIRECT_URLS.ONBOARDING);
    } else {
      // This case is unlikely but handled: registration worked but immediate login failed.
      // We can redirect to login page with a success message.
      console.log("Registration successful. Please log in.");
      onModeChange(AUTH_MODES.SIGN_IN);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsLoading(true);

    try {
      if (mode === AUTH_MODES.SIGN_IN) {
        await performSignIn();
      } else {
        await performSignUp();
      }
    } catch (error) {
      console.error("Auth error:", error);
      setSubmitError(ERROR_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    if (mode === AUTH_MODES.SIGN_IN) {
      handleLoginChange(fieldId as keyof typeof loginForm, value);
    } else {
      handleRegisterChange(fieldId as keyof typeof registerForm, value);
    }
  };

  const getFieldError = (fieldId: string) => {
    return mode === AUTH_MODES.SIGN_IN
      ? loginErrors[fieldId as keyof typeof loginErrors]
      : registerErrors[fieldId as keyof typeof registerErrors];
  };

  const getFieldValue = (fieldId: string) => {
    return mode === AUTH_MODES.SIGN_IN
      ? loginForm[fieldId as keyof typeof loginForm]
      : registerForm[fieldId as keyof typeof registerForm];
  };

  const content = contentMap[mode];
  const nextMode: AuthMode = mode === AUTH_MODES.SIGN_UP ? AUTH_MODES.SIGN_IN : AUTH_MODES.SIGN_UP;

  return (
    <div className="w-full max-w-md font-['Plus Jakarta Sans',_Inter,_'Helvetica Neue',_sans-serif]">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-10 flex items-center gap-3 text-[#ff6a45]">
        <span className="text-xs uppercase tracking-[0.45em] text-gray-400">{BRAND_NAME.toLowerCase()}</span>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={mode} variants={formVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="space-y-8 rounded-[32px]">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-white sm:text-[2.75rem]">{content.title}</h1>
            <p className="text-base text-gray-500">{content.subtitle}</p>
          </div>

          <div className="flex">
            {socialProviders.map((provider) => (
              <button key={provider.id} type="button" className={socialButton} disabled={isLoading}>
                <provider.icon />
                <span>{`${content.socialLabelPrefix} ${provider.label}`}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.35em] text-gray-300">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            or
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {fieldSets[mode].map((field) => (
              <div key={field.id} className="space-y-2">
                <label htmlFor={field.id} className="text-sm font-medium text-gray-500">{field.label}</label>
                <input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  className={capsuleInput}
                  required
                  value={getFieldValue(field.id) || ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  disabled={isLoading}
                />
                {getFieldError(field.id) && <p className="text-sm text-red-500">{getFieldError(field.id)}</p>}
              </div>
            ))}

            {mode === AUTH_MODES.SIGN_IN && (
              <div className="flex justify-end text-sm font-medium text-[#ff6a45]">
                <button type="button" className="hover:opacity-80" disabled={isLoading}>Forgot password?</button>
              </div>
            )}

            {submitError && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#ffb067] via-[#ff8364] to-[#ff5d6b] px-6 py-4 text-sm font-semibold text-white shadow-[0_25px_45px_rgba(255,131,100,0.45)] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff8364] disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="tracking-wide">{isLoading ? "Processing..." : content.primaryCta}</span>
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <span>{content.toggleCopy} </span>
            <button type="button" onClick={() => onModeChange(nextMode)} className="font-semibold text-[#ff6a45] hover:opacity-80" disabled={isLoading}>
              {content.toggleAction}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-10 text-center text-xs text-gray-400">
        By continuing, you agree to our <span className="text-[#ff6a45]">Terms</span> and <span className="text-[#ff6a45]">Privacy Policy</span>.
      </p>
    </div>
  );
}


