"use client";

import { FormEvent, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthForms } from "@/app/lib/hooks/use-auth-forms";
import { authAPI, userAPI, companyAPI } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CompanyPayload } from "@/app/lib/api";
import {
  getProvinces,
  getAmphoes,
  getDistricts,
  getZipcode,
} from "@/app/lib/thai-address";


const capsuleInput =
  "w-full rounded-full border border-transparent bg-white px-6 py-4 text-sm text-gray-900 shadow-[0_15px_45px_rgba(15,23,42,0.08)] placeholder:text-gray-400 outline-none transition focus:border-[#ffbb9b] focus:ring-2 focus:ring-[#ff8364]/50";

const formInput =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 outline-none transition focus:border-[#ff8364] focus:ring-2 focus:ring-[#ff8364]/50";

const formVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

type Step = "register" | "company";

export default function CompanyRegisterPage() {
  const [step, setStep] = useState<Step>("register");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const {
    registerForm,
    registerErrors,
    handleRegisterChange,
    validateRegisterForm,
    resetForms,
  } = useAuthForms();

  const [companyForm, setCompanyForm] = useState<CompanyPayload>({
    company_name: "",
    industry: null,
    email: null,
    company_size: null,
    description: null,
    phone: null,
    address_detail: null,
    province: null,
    district: null,
    subdistrict: null,
    postal_code: null,
    founded_year: null,
    mission: null,
    vision: null,
  });

  const [companyErrors, setCompanyErrors] = useState<
    Partial<Record<keyof CompanyPayload, string>>
  >({});

  const handleCompanyChange = (
    field: keyof CompanyPayload,
    value: string | null,
  ) => {
    setCompanyForm((prev) => {
      const newForm = {
        ...prev,
        [field]: value || null,
      };

      // Handle cascading address changes
      if (field === "province") {
        newForm.district = null;
        newForm.subdistrict = null;
        newForm.postal_code = null;
      } else if (field === "district") {
        newForm.subdistrict = null;
        newForm.postal_code = null;
      } else if (field === "subdistrict" && value) {
        // Auto-fill postal code
        const zip = getZipcode(
          newForm.province || "",
          newForm.district || "",
          value,
        );
        if (zip) {
          newForm.postal_code = zip;
        }
      }

      return newForm;
    });

    // Clear error when user types
    if (companyErrors[field]) {
      setCompanyErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateCompanyForm = (): boolean => {
    const errors: Partial<Record<keyof CompanyPayload, string>> = {};

    if (!companyForm.company_name.trim()) {
      errors.company_name = "ชื่อบริษัทจำเป็นต้องกรอก";
    }

    if (!companyForm.email || !companyForm.email.trim()) {
      errors.email = "อีเมลจำเป็นต้องกรอก";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyForm.email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    setCompanyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsLoading(true);

    try {
      const isValid = validateRegisterForm();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Don't create account yet, just validate and move to next step
      console.log("Step 1 validated, moving to company info form");
      setStep("company");
    } catch (error) {
      console.error("Validation error:", error);
      setSubmitError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsLoading(true);

    try {
      const isValid = validateCompanyForm();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Step 1: Create user account
      console.log("Creating user account...");
      const registerResponse = await userAPI.register(
        registerForm.username,
        registerForm.password,
        "CompanyUser",
      );

      if (!registerResponse.ok) {
        // Check if it's a duplicate username error
        const errorMsg = typeof registerResponse.data === 'string'
          ? registerResponse.data.toLowerCase()
          : '';

        if (errorMsg.includes('duplicate') || errorMsg.includes('unique') || errorMsg.includes('already exists')) {
          setSubmitError("ชื่อผู้ใช้นี้มีคนใช้งานแล้ว กรุณากลับไปเปลี่ยนชื่อผู้ใช้");
        } else {
          setSubmitError("การสร้างบัญชีล้มเหลว กรุณาลองใหม่อีกครั้ง");
        }
        setIsLoading(false);
        return;
      }

      // Step 2: Auto-login
      console.log("Logging in...");
      const loginResponse = await authAPI.login(
        registerForm.username,
        registerForm.password,
      );

      if (!loginResponse.ok) {
        setSubmitError("สร้างบัญชีสำเร็จ แต่ไม่สามารถเข้าสู่ระบบได้ กรุณาเข้าสู่ระบบด้วยตนเอง");
        setIsLoading(false);
        return;
      }

      console.log("Login successful");

      // Set user_role cookie for middleware to read
      document.cookie = `user_role=CompanyUser; path=/; max-age=2592000; SameSite=Lax`;

      // Sync AuthProvider state
      await refreshAuth();

      // Step 3: Create company record
      console.log("Creating company record...");
      const companyResponse = await companyAPI.upsertCompany(companyForm);

      if (companyResponse.ok) {
        console.log("Company registration successful:", companyResponse.data);
        resetForms();
        // Redirect to pending approval page
        router.push("/company-pending-approval");
      } else {
        setSubmitError("บัญชีถูกสร้างแล้ว แต่การบันทึกข้อมูลบริษัทล้มเหลว คุณสามารถกรอกข้อมูลบริษัทภายหลังได้");
        // Still redirect after a delay since account was created
        setTimeout(() => {
          router.push("/company-pending-approval");
        }, 3000);
      }
    } catch (error) {
      console.error("Company registration error:", error);
      setSubmitError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized address options
  const provinceOptions = useMemo(() => {
    return getProvinces();
  }, []);

  const districtOptions = useMemo(() => {
    if (!companyForm.province) return [];
    return getAmphoes(companyForm.province);
  }, [companyForm.province]);

  const subdistrictOptions = useMemo(() => {
    if (!companyForm.province || !companyForm.district) return [];
    return getDistricts(companyForm.province, companyForm.district);
  }, [companyForm.province, companyForm.district]);

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

        <AnimatePresence mode="wait">
          {step === "register" ? (
            <motion.div
              key="register"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8 rounded-[32px]"
            >
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold text-white sm:text-[2.75rem]">
                  สมัครสมาชิกสำหรับบริษัท
                </h1>
                <p className="text-base text-gray-500">
                  สร้างบัญชีเพื่อเริ่มต้นใช้งาน Smart Persona สำหรับบริษัทของคุณ
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
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
                    value={registerForm.username || ""}
                    onChange={(e) =>
                      handleRegisterChange("username", e.target.value)
                    }
                    disabled={isLoading}
                  />
                  {registerErrors.username && (
                    <p className="text-sm text-red-500">
                      {registerErrors.username}
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
                    placeholder="Enter a secure password"
                    autoComplete="new-password"
                    className={capsuleInput}
                    required
                    value={registerForm.password || ""}
                    onChange={(e) =>
                      handleRegisterChange("password", e.target.value)
                    }
                    disabled={isLoading}
                  />
                  {registerErrors.password && (
                    <p className="text-sm text-red-500">
                      {registerErrors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-500"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className={capsuleInput}
                    required
                    value={registerForm.confirmPassword || ""}
                    onChange={(e) =>
                      handleRegisterChange("confirmPassword", e.target.value)
                    }
                    disabled={isLoading}
                  />
                  {registerErrors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {registerErrors.confirmPassword}
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
                    {isLoading ? "กำลังดำเนินการ..." : "สมัครสมาชิก"}
                  </span>
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="company"
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8 rounded-[32px]"
            >
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold text-white sm:text-[2.75rem]">
                  กรอกข้อมูลบริษัท
                </h1>
                <p className="text-base text-gray-500">
                  กรุณากรอกข้อมูลบริษัทของคุณเพื่อให้เราสามารถช่วยคุณได้ดีขึ้น
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleCompanySubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="company_name"
                    className="text-sm font-medium text-gray-500"
                  >
                    ชื่อบริษัท <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company_name"
                    type="text"
                    placeholder="กรอกชื่อบริษัท"
                    className={formInput}
                    required
                    value={companyForm.company_name || ""}
                    onChange={(e) =>
                      handleCompanyChange("company_name", e.target.value)
                    }
                    disabled={isLoading}
                  />
                  {companyErrors.company_name && (
                    <p className="text-sm text-red-500">
                      {companyErrors.company_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="industry"
                      className="text-sm font-medium text-gray-500"
                    >
                      อุตสาหกรรม
                    </label>
                    <input
                      id="industry"
                      type="text"
                      list="industry-options"
                      placeholder="เลือกหรือค้นหาอุสหกรรม"
                      className={formInput}
                      value={companyForm.industry || ""}
                      onChange={(e) =>
                        handleCompanyChange(
                          "industry",
                          e.target.value || null,
                        )
                      }
                      disabled={isLoading}
                    />
                    <datalist id="industry-options">
                      <option value="เทคโนโลยีสารสนเทศ (IT)" />
                      <option value="ซอฟต์แวร์และการพัฒนา" />
                      <option value="ฮาร์ดแวร์และอุปกรณ์อิเล็กทรอนิกส์" />
                      <option value="ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง" />
                      <option value="ไซเบอร์ซิเคียวริตี้" />
                      <option value="คลาวด์คอมพิวติ้ง" />
                      <option value="การเงินและธนาคาร" />
                      <option value="ประกันภัย" />
                      <option value="การลงทุนและหลักทรัพย์" />
                      <option value="ฟินเทค (FinTech)" />
                      <option value="การบัญชีและการตรวจสอบบัญชี" />
                      <option value="การผลิตและอุตสาหกรรม" />
                      <option value="ยานยนต์และชิ้นส่วน" />
                      <option value="อิเล็กทรอนิกส์" />
                      <option value="สิ่งทอและเครื่องนุ่งห่ม" />
                      <option value="อาหารและเครื่องดื่ม" />
                      <option value="เคมีภัณฑ์และปิโตรเคมี" />
                      <option value="พลาสติกและยาง" />
                      <option value="เหล็กและโลหะ" />
                      <option value="เครื่องจักรและอุปกรณ์" />
                      <option value="การก่อสร้างและอสังหาริมทรัพย์" />
                      <option value="วิศวกรรมโยธา" />
                      <option value="สถาปัตยกรรมและออกแบบ" />
                      <option value="การพัฒนาอสังหาริมทรัพย์" />
                      <option value="บริหารอาคาร" />
                      <option value="การขายปลีกและขายส่ง" />
                      <option value="อีคอมเมิร์ซ" />
                      <option value="ค้าปลีกสินค้าอุปโภคบริโภค" />
                      <option value="ค้าส่งและการจัดจำหน่าย" />
                      <option value="บริการสุขภาพและการแพทย์" />
                      <option value="โรงพยาบาลและคลินิก" />
                      <option value="เภสัชกรรมและยา" />
                      <option value="อุปกรณ์การแพทย์" />
                      <option value="สุขภาพดิจิทัล (HealthTech)" />
                      <option value="การศึกษาและฝึกอบรม" />
                      <option value="EdTech" />
                      <option value="มหาวิทยาลัยและสถาบันการศึกษา" />
                      <option value="การฝึกอบรมองค์กร" />
                      <option value="การท่องเที่ยวและโรงแรม" />
                      <option value="โรงแรมและรีสอร์ท" />
                      <option value="สายการบินและการบิน" />
                      <option value="ท่องเที่ยวและทัวร์" />
                      <option value="ร้านอาหารและบริการอาหาร" />
                      <option value="การขนส่งและโลจิสติกส์" />
                      <option value="การขนส่งทางบก" />
                      <option value="การขนส่งทางเรือ" />
                      <option value="การขนส่งทางอากาศ" />
                      <option value="คลังสินค้าและการจัดการห่วงโซ่อุปทาน" />
                      <option value="พลังงานและสาธารณูปโภค" />
                      <option value="น้ำมันและก๊าซ" />
                      <option value="พลังงานหมุนเวียน" />
                      <option value="ไฟฟ้าและพลังงาน" />
                      <option value="โทรคมนาคมและสื่อสาร" />
                      <option value="ผู้ให้บริการโทรคมนาคม" />
                      <option value="บริการอินเทอร์เน็ต" />
                      <option value="สื่อและบันเทิง" />
                      <option value="โทรทัศน์และวิทยุ" />
                      <option value="ภาพยนตร์และการผลิตวิดีโอ" />
                      <option value="ดนตรีและบันเทิง" />
                      <option value="การเกมและ E-sports" />
                      <option value="สื่อดิจิทัลและโซเชียลมีเดีย" />
                      <option value="การเกษตรและประมง" />
                      <option value="เกษตรกรรม" />
                      <option value="ปศุสัตว์" />
                      <option value="ประมง" />
                      <option value="AgriTech" />
                      <option value="กฎหมายและที่ปรึกษากฎหมาย" />
                      <option value="สำนักงานกฎหมาย" />
                      <option value="ที่ปรึกษากฎหมาย" />
                      <option value="การตลาดและโฆษณา" />
                      <option value="เอเจนซี่โฆษณา" />
                      <option value="การตลาดดิจิทัล" />
                      <option value="ประชาสัมพันธ์" />
                      <option value="ทรัพยากรบุคคลและการจัดหางาน" />
                      <option value="การจัดหางาน" />
                      <option value="ที่ปรึกษาทรัพยากรบุคคล" />
                      <option value="HR Tech" />
                      <option value="การออกแบบและความคิดสร้างสรรค์" />
                      <option value="กราฟิกดีไซน์" />
                      <option value="UX/UI Design" />
                      <option value="แฟชั่นและสิ่งทอ" />
                      <option value="ศิลปะและหัตถกรรม" />
                      <option value="การวิจัยและพัฒนา" />
                      <option value="วิทยาศาสตร์และเทคโนโลยี" />
                      <option value="ไบโอเทคและวิทยาศาสตร์ชีวภาพ" />
                      <option value="สิ่งแวดล้อมและความยั่งยืน" />
                      <option value="พลังงานสะอาด" />
                      <option value="การจัดการขยะและรีไซเคิล" />
                      <option value="ที่ปรึกษาด้านสิ่งแวดล้อม" />
                      <option value="บริการมืออาชีพและที่ปรึกษา" />
                      <option value="ที่ปรึกษาธุรกิจ" />
                      <option value="ที่ปรึกษาการจัดการ" />
                      <option value="ที่ปรึกษาด้านกลยุทธ์" />
                      <option value="บริการทำความสะอาดและดูแลอาคาร" />
                      <option value="ความปลอดภัยและรักษาความปลอดภัย" />
                      <option value="องค์กรไม่แสวงหาผลกำไร (NGO)" />
                      <option value="การกุศลและสังคมสงเคราะห์" />
                      <option value="หน่วยงานรัฐและองค์กรสาธารณะ" />
                      <option value="กีฬาและนันทนาการ" />
                      <option value="ฟิตเนสและสุขภาพ" />
                      <option value="อื่นๆ" />
                    </datalist>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="company_size"
                      className="text-sm font-medium text-gray-500"
                    >
                      ขนาดบริษัท
                    </label>
                    <select
                      id="company_size"
                      className={formInput}
                      value={companyForm.company_size || ""}
                      onChange={(e) =>
                        handleCompanyChange(
                          "company_size",
                          e.target.value || null,
                        )
                      }
                      disabled={isLoading}
                    >
                      <option value="">เลือกขนาดบริษัท</option>
                      <option value="1-10">1-10 คน</option>
                      <option value="11-50">11-50 คน</option>
                      <option value="51-200">51-200 คน</option>
                      <option value="201-500">201-500 คน</option>
                      <option value="501-1000">501-1000 คน</option>
                      <option value="1000+">มากกว่า 1000 คน</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-500"
                  >
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="company@example.com"
                    className={formInput}
                    required
                    value={companyForm.email || ""}
                    onChange={(e) =>
                      handleCompanyChange("email", e.target.value || null)
                    }
                    disabled={isLoading}
                  />
                  {companyErrors.email && (
                    <p className="text-sm text-red-500">
                      {companyErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-500"
                  >
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="02-123-4567"
                    className={formInput}
                    value={companyForm.phone || ""}
                    onChange={(e) =>
                      handleCompanyChange("phone", e.target.value || null)
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-500"
                  >
                    คำอธิบายบริษัท
                  </label>
                  <textarea
                    id="description"
                    placeholder="อธิบายเกี่ยวกับบริษัทของคุณ"
                    rows={4}
                    className={formInput}
                    value={companyForm.description || ""}
                    onChange={(e) =>
                      handleCompanyChange("description", e.target.value || null)
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="founded_year"
                    className="text-sm font-medium text-gray-500"
                  >
                    ปีที่ก่อตั้ง
                  </label>
                  <input
                    id="founded_year"
                    type="text"
                    placeholder="เช่น 2020"
                    maxLength={4}
                    className={formInput}
                    value={companyForm.founded_year || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      handleCompanyChange("founded_year", value || null);
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="mission"
                    className="text-sm font-medium text-gray-500"
                  >
                    พันธกิจ (Mission)
                  </label>
                  <textarea
                    id="mission"
                    placeholder="ระบุพันธกิจของบริษัท"
                    rows={3}
                    className={formInput}
                    value={companyForm.mission || ""}
                    onChange={(e) =>
                      handleCompanyChange("mission", e.target.value || null)
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="vision"
                    className="text-sm font-medium text-gray-500"
                  >
                    วิสัยทัศน์ (Vision)
                  </label>
                  <textarea
                    id="vision"
                    placeholder="ระบุวิสัยทัศน์ของบริษัท"
                    rows={3}
                    className={formInput}
                    value={companyForm.vision || ""}
                    onChange={(e) =>
                      handleCompanyChange("vision", e.target.value || null)
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="address_detail"
                    className="text-sm font-medium text-gray-500"
                  >
                    ที่อยู่
                  </label>
                  <textarea
                    id="address_detail"
                    placeholder="เลขที่ หมู่ที่ ถนน"
                    rows={2}
                    className={formInput}
                    value={companyForm.address_detail || ""}
                    onChange={(e) =>
                      handleCompanyChange(
                        "address_detail",
                        e.target.value || null,
                      )
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="province"
                      className="text-sm font-medium text-gray-500"
                    >
                      จังหวัด
                    </label>
                    <input
                      id="province"
                      type="text"
                      list="province-options"
                      placeholder="เลือกหรือค้นหาจังหวัด"
                      className={formInput}
                      value={companyForm.province || ""}
                      onChange={(e) =>
                        handleCompanyChange("province", e.target.value || null)
                      }
                      disabled={isLoading}
                    />
                    <datalist id="province-options">
                      {provinceOptions.map((province) => (
                        <option key={province} value={province} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="district"
                      className="text-sm font-medium text-gray-500"
                    >
                      อำเภอ/เขต
                    </label>
                    <input
                      id="district"
                      type="text"
                      list="district-options"
                      placeholder="เลือกหรือค้นหาอำเภอ/เขต"
                      className={formInput}
                      value={companyForm.district || ""}
                      onChange={(e) =>
                        handleCompanyChange("district", e.target.value || null)
                      }
                      disabled={isLoading || !companyForm.province}
                    />
                    <datalist id="district-options">
                      {districtOptions.map((district) => (
                        <option key={district} value={district} />
                      ))}
                    </datalist>
                    {!companyForm.province && (
                      <p className="text-xs text-gray-400">
                        กรุณาเลือกจังหวัดก่อน
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="subdistrict"
                      className="text-sm font-medium text-gray-500"
                    >
                      ตำบล/แขวง
                    </label>
                    <input
                      id="subdistrict"
                      type="text"
                      list="subdistrict-options"
                      placeholder="เลือกหรือค้นหาตำบล/แขวง"
                      className={formInput}
                      value={companyForm.subdistrict || ""}
                      onChange={(e) =>
                        handleCompanyChange(
                          "subdistrict",
                          e.target.value || null,
                        )
                      }
                      disabled={isLoading || !companyForm.district}
                    />
                    <datalist id="subdistrict-options">
                      {subdistrictOptions.map((subdistrict) => (
                        <option key={subdistrict} value={subdistrict} />
                      ))}
                    </datalist>
                    {!companyForm.district && (
                      <p className="text-xs text-gray-400">
                        กรุณาเลือกอำเภอ/เขตก่อน
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="postal_code"
                    className="text-sm font-medium text-gray-500"
                  >
                    รหัสไปรษณีย์
                  </label>
                  <input
                    id="postal_code"
                    type="text"
                    placeholder="10500"
                    maxLength={5}
                    className={formInput}
                    value={companyForm.postal_code || ""}
                    onChange={(e) =>
                      handleCompanyChange(
                        "postal_code",
                        e.target.value || null,
                      )
                    }
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-400">
                    จะถูกกรอกอัตโนมัติเมื่อเลือกที่อยู่
                  </p>
                </div>

                {submitError && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep("register")}
                    disabled={isLoading}
                    className="flex-1 rounded-full border border-gray-300 bg-transparent px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative inline-flex flex-1 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#ffb067] via-[#ff8364] to-[#ff5d6b] px-6 py-4 text-sm font-semibold text-white shadow-[0_25px_45px_rgba(255,131,100,0.45)] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff8364] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="tracking-wide">
                      {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-10 text-center text-xs text-gray-400">
          โดยการดำเนินการต่อ คุณยอมรับ{" "}
          <span className="text-[#ff6a45]">ข้อกำหนด</span> และ{" "}
          <span className="text-[#ff6a45]">นโยบายความเป็นส่วนตัว</span>{" "}
          ของเรา
        </p>
        <p className="mt-4 text-center text-sm text-gray-400">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/company-login"
            className="text-[#ff6a45] hover:text-[#ff8364] transition font-medium"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
}

