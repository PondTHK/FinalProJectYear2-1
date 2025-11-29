"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlassSidebar from "@/app/Components/profile/GlassSidebar";
import ImageCropModal from "@/app/Components/profile/ImageCropModal";
import ProfileTemplateSelector from "@/app/[locale]/profile-modern/components/ProfileTemplateSelector";
import type { ProfileTemplate } from "@/app/[locale]/profile-modern/components/ProfileTemplateSelector";
import { useUserProfileData } from "@/app/Components/profile/hooks/useUserProfileData";
import { useUserProfileDataByUserId } from "@/app/Components/profile/hooks/useUserProfileDataByUserId";
import { useImageUpload } from "@/app/Components/profile/hooks/useImageUpload";
import { useCVGeneration } from "@/app/Components/profile/hooks/useCVGeneration";
import {
  useDisplayName,
  useEducationItems,
  useExperienceItems,
} from "@/app/Components/profile/utils/profileUtils";
import LoadingState from "@/app/[locale]/profile-modern/components/LoadingState";
import ProfileRightSidebar from "@/app/Components/profile/ProfileRightSidebar";
import { getProfileLink } from "@/app/lib/profile-utils";
import type { ProfileTab } from "@/app/[locale]/profile-modern/types";
import TabSwitcher from "@/app/[locale]/profile-jewelry/components/TabSwitcher";
import { getPrivacySettings, getPrivacySettingsByUserId } from "@/app/lib/privacy-settings";
import type { PrivacySettings } from "@/app/lib/privacy-settings";
import {
  Mail,
  Edit2,
  Plus,
  Maximize2,
  Copy,
  Share2,
  Phone,
  Briefcase,
  MapPin,
  GraduationCap,
  FileText,
  Eye,
} from "lucide-react";

export default function JewelryProfilePage(props: any) {
  const { targetUserId } = props;
  const router = useRouter();
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const isOwnProfile = !targetUserId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get privacy settings for other users' profiles
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    const loadPrivacySettings = async () => {
      if (!isOwnProfile && targetUserId && typeof window !== "undefined") {
        // Get privacy settings for the profile owner from API
        const ownerSettings = await getPrivacySettingsByUserId(targetUserId);
        setPrivacySettings(ownerSettings);
      } else if (isOwnProfile) {
        // For own profile, use current user's settings from API
        const currentSettings = await getPrivacySettings();
        setPrivacySettings(currentSettings);
      }
    };

    loadPrivacySettings();
  }, [isOwnProfile, targetUserId]);

  // Detect current template - always "jewelry" for this page
  const currentTemplate: ProfileTemplate = "jewelry";

  const ownProfileData = useUserProfileData();
  const otherProfileData = useUserProfileDataByUserId(targetUserId || "");
  const profileData = isOwnProfile ? ownProfileData : otherProfileData;

  const {
    profile,
    address,
    educations,
    experiences,
    portfolioItems,
    jobPreference,
    isLoading,
    setProfile,
    profileImageUrl,
    coverImageUrl,
    setProfileImageUrl,
    setCoverImageUrl,
  } = profileData;

  const displayName = useDisplayName(profile);
  const educationItems = useEducationItems(educations);
  const experienceItems = useExperienceItems(experiences);

  // Get aboutMe from localStorage
  const [aboutMe, setAboutMe] = useState<string>("");
  const [, setLinkCopied] = useState(false);
  // ...

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAboutMe = localStorage.getItem("user_about_me");
      if (savedAboutMe) {
        setAboutMe(savedAboutMe);
      }
    }
  }, []);

  const imageUploadHook = useImageUpload(
    profile,
    setProfile,
    setProfileImageUrl,
    setCoverImageUrl,
  );

  const {
    cropModalOpen,
    cropImageSrc,
    cropType,
    setCropModalOpen,
    handleProfileImageSelect: ownHandleProfileImageSelect,
    handleCropComplete,
  } = imageUploadHook;

  // CV generation - only enabled for own profile
  const cvGenerationHook = useCVGeneration(
    profile,
    address,
    educations,
    experiences,
    jobPreference,
    aboutMe
  );
  const {
    handleDownloadCV: ownHandleDownloadCV,
  } = cvGenerationHook;

  const handleDownloadCV = isOwnProfile ? ownHandleDownloadCV : undefined;

  // Generate profile link
  const profileLink = profile?.user_id
    ? getProfileLink(profile.user_id)
    : `FyNex.com/profile/${displayName.replace(/\s+/g, "-").toLowerCase()}`;

  // Ensure profileLink is a full URL
  const getFullProfileLink = () => {
    if (profileLink.startsWith("http://") || profileLink.startsWith("https://")) {
      return profileLink;
    }
    if (profileLink.startsWith("/")) {
      return typeof window !== "undefined" ? `${window.location.origin}${profileLink}` : profileLink;
    }
    return `https://${profileLink}`;
  };

  const fullProfileLink = getFullProfileLink();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullProfileLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "โปรไฟล์ของฉัน",
          text: "ดูโปรไฟล์ของฉันบน FYNEX",
          url: fullProfileLink,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to share:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleProfileImageClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isOwnProfile && ownHandleProfileImageSelect) {
      ownHandleProfileImageSelect(event);
    }
  };



  // Calculate Stats
  const totalExperienceYears = experiences.reduce((acc, exp) => {
    const start = new Date(exp.start_date).getFullYear();
    const end = exp.end_date ? new Date(exp.end_date).getFullYear() : new Date().getFullYear();
    return acc + (end - start);
  }, 0);

  // Filter portfolio items based on privacy settings
  const filteredPortfolioItems = React.useMemo(() => {
    if (isOwnProfile || !privacySettings) return portfolioItems;
    return privacySettings.showPortfolios ? portfolioItems : [];
  }, [portfolioItems, isOwnProfile, privacySettings]);


  const portfolioCount = filteredPortfolioItems.length;
  const highestEducation = educationItems.length > 0 ? educationItems[0].degree : "Not specified";
  const industry = jobPreference?.industry || "ยังไม่ระบุ";
  const jobType = jobPreference?.work_time || "-";
  const location = address?.province || "Bangkok"; // Fallback or specific field if available

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#F5E6D3] via-[#F4E4C1] to-[#F0D9A8] text-[#4A4A4A] font-sans selection:bg-[#D4A373] selection:text-white">
      {isOwnProfile && <GlassSidebar />}

      <div className={`${isOwnProfile ? 'pl-[100px] lg:pl-[120px]' : ''} transition-all duration-300`}>
        <main className="px-6 pb-6">

          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-10 py-16 lg:flex-row">
              {/* Left Column (Main Content) */}
              <main className="flex-1">
                <div className="flex flex-col gap-4">
                  {activeTab === "profile" && (
                    <>
                      {/* Top Highlights Row */}
                      <div className="flex flex-col md:flex-row gap-3">
                        {/* Highlight 1 */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[20px] p-2 pr-4 flex items-center gap-3 shadow-sm border border-white/30">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0 ml-1">
                            {profileImageUrl ? (
                              <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-[10px]">IMG</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-[#2D2D2D] truncate">{displayName}</h3>
                            <p className="text-[10px] text-gray-500 truncate">{jobPreference?.position || "Job Seeker"}</p>
                          </div>

                        </div>

                        {/* Highlight 2 */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[20px] p-2 pr-4 flex items-center gap-3 shadow-sm border border-white/30">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E0E0E0] shrink-0 ml-1 flex items-center justify-center">
                            <Briefcase size={18} className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-[#2D2D2D] truncate">{experienceItems[0]?.position || "Open to work"}</h3>
                            <p className="text-[10px] text-gray-500 truncate">{experienceItems[0]?.company || "Ready for new opportunities"}</p>
                          </div>

                        </div>

                        {/* Highlight 3 */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[20px] p-2 pr-4 flex items-center gap-3 shadow-sm border border-white/30">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E0E0E0] shrink-0 ml-1 flex items-center justify-center">
                            <GraduationCap size={18} className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-[#2D2D2D] truncate">{highestEducation}</h3>
                            <p className="text-[10px] text-gray-500 truncate">{educationItems[0]?.school || "Education History"}</p>
                          </div>

                        </div>
                      </div>

                      {/* Business Summary (User Stats) Grid */}
                      <div className="bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#2D2D2D] rounded-full flex items-center justify-center text-white">
                              <FileText size={12} />
                            </div>
                            <h2 className="text-base font-bold text-[#2D2D2D]">Profile Summary</h2>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Card 1: Experience (Yellow) */}
                          <div className="bg-[#F5E6CA] rounded-[16px] p-3 relative group hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-8 h-8 bg-[#EAD6B0] rounded-full flex items-center justify-center text-[#8A6D3B]">
                                <Briefcase size={16} />
                              </div>
                            </div>
                            <h3 className="text-[#8A6D3B] text-[10px] font-medium mb-1">Total Experience</h3>
                            <p className="text-[#5C4623] text-xl font-bold mb-0.5">{totalExperienceYears} Years</p>
                          </div>

                          {/* Card 2: Portfolio (Blue) */}
                          <div className="bg-[#CDE4F7] rounded-[16px] p-3 relative group hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-8 h-8 bg-[#B0D0EA] rounded-full flex items-center justify-center text-[#3B6D8A]">
                                <FileText size={16} />
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                                <Maximize2 size={10} className="text-[#3B6D8A]" />
                              </button>
                            </div>
                            <h3 className="text-[#3B6D8A] text-[10px] font-medium mb-1">Portfolio Items</h3>
                            <p className="text-[#23465C] text-xl font-bold mb-0.5">{portfolioCount}</p>
                          </div>

                          {/* Card 3: Education (Purple) */}
                          <div className="bg-[#DBCDF7] rounded-[16px] p-3 relative group hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-8 h-8 bg-[#C4B0EA] rounded-full flex items-center justify-center text-[#5C3B8A]">
                                <GraduationCap size={16} />
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                                <Maximize2 size={10} className="text-[#5C3B8A]" />
                              </button>
                            </div>
                            <h3 className="text-[#5C3B8A] text-[10px] font-medium mb-1">Education</h3>
                            <p className="text-[#32235C] text-base font-bold mb-0.5 truncate" title={highestEducation}>{highestEducation}</p>
                          </div>

                          {/* Card 4: Industry (Pink) */}
                          <div className="bg-[#F7CDCD] rounded-[16px] p-3 relative group hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-8 h-8 bg-[#EAB0B0] rounded-full flex items-center justify-center text-[#8A3B3B]">
                                <Briefcase size={16} />
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                                <Maximize2 size={10} className="text-[#8A3B3B]" />
                              </button>
                            </div>
                            <h3 className="text-[#8A3B3B] text-[10px] font-medium mb-1">อุตสาหกรรมที่สนใจ</h3>
                            <p className="text-[#5C2323] text-base font-bold mb-0.5 truncate">{industry}</p>
                          </div>

                          {/* Card 5: Job Type (Pink/Purple) */}
                          <div className="bg-[#F7CDF7] rounded-[16px] p-3 relative group hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-8 h-8 bg-[#EAB0EA] rounded-full flex items-center justify-center text-[#8A3B8A]">
                                <Briefcase size={16} />
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                                <Maximize2 size={10} className="text-[#8A3B8A]" />
                              </button>
                            </div>
                            <h3 className="text-[#8A3B8A] text-[10px] font-medium mb-1">Job Type</h3>
                            <p className="text-[#5C235C] text-base font-bold mb-0.5 truncate">{jobType}</p>
                          </div>

                          {/* Card 6: Location (Red/Pink) */}
                          <div className="bg-[#F7CDDF] rounded-[16px] p-3 relative group hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-8 h-8 bg-[#EAB0C4] rounded-full flex items-center justify-center text-[#8A3B5C]">
                                <MapPin size={16} />
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                                <Maximize2 size={10} className="text-[#8A3B5C]" />
                              </button>
                            </div>
                            <h3 className="text-[#8A3B5C] text-[10px] font-medium mb-1">Location</h3>
                            <p className="text-[#5C233B] text-base font-bold mb-0.5 truncate">{location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Profile Completeness (Sales Variance) */}
                        {/* Education History (Was Profile Completeness) */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-[#2D2D2D] rounded-full flex items-center justify-center text-white">
                                <GraduationCap size={12} />
                              </div>
                              <h2 className="text-base font-bold text-[#2D2D2D]">Education History</h2>
                            </div>
                            {isOwnProfile && (
                              <button
                                onClick={() => router.push("/onboarding")}
                                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                title="เพิ่มข้อมูลการศึกษา"
                              >
                                <Plus size={12} className="text-gray-500" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {educationItems.map((edu, index) => (
                              <div key={index} className="flex items-center gap-2 p-2.5 bg-white/30 backdrop-blur-sm rounded-lg border border-white/20">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                  {/* Placeholder for school logo */}
                                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-500">
                                    {edu.school.charAt(0)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-[#2D2D2D] truncate">{edu.school}</h4>
                                  <p className="text-[10px] text-gray-500 truncate">{edu.degree} • {edu.period}</p>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${index === 0 ? 'bg-[#CDE4F7] text-[#3B6D8A]' :
                                  'bg-[#F7CDCD] text-[#8A3B3B]'
                                  }`}>
                                  {index === 0 ? 'Latest' : 'Previous'}
                                </span>
                              </div>
                            ))}

                            {educationItems.length === 0 && (
                              <div className="text-center py-6 text-gray-400 text-sm">
                                No education history available
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Work History (Valuable Customer) */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-[#2D2D2D] rounded-full flex items-center justify-center text-white">
                                <Briefcase size={12} />
                              </div>
                              <h2 className="text-base font-bold text-[#2D2D2D]">Work History</h2>
                            </div>
                            {isOwnProfile && (
                              <button
                                onClick={() => router.push("/onboarding")}
                                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                title="เพิ่มข้อมูลประสบการณ์"
                              >
                                <Plus size={12} className="text-gray-500" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {experienceItems.slice(0, 3).map((exp, index) => (
                              <div key={index} className="flex items-center gap-2 p-2.5 bg-white/30 backdrop-blur-sm rounded-lg border border-white/20">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                  {/* Placeholder for company logo */}
                                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-500">
                                    {exp.company.charAt(0)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-bold text-[#2D2D2D] truncate">{exp.position}</h4>
                                  <p className="text-[10px] text-gray-500 truncate">{exp.company} • {exp.period}</p>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${index === 0 ? 'bg-[#CDE4F7] text-[#3B6D8A]' :
                                  index === 1 ? 'bg-[#F7CDCD] text-[#8A3B3B]' :
                                    'bg-[#F7CDF7] text-[#8A3B8A]'
                                  }`}>
                                  {index === 0 ? 'Current' : 'Past'}
                                </span>
                              </div>
                            ))}

                            {experienceItems.length === 0 && (
                              <div className="text-center py-6 text-gray-400 text-sm">
                                No work history available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "works" && (
                    <div className="bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                      <h2 className="text-base font-bold text-[#2D2D2D] mb-4">My works</h2>
                      {filteredPortfolioItems.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          {!isOwnProfile && privacySettings && !privacySettings.showPortfolios
                            ? "ผลงานนี้ถูกซ่อนไว้"
                            : "ยังไม่มีผลงาน กรุณาเพิ่มผลงานจากแท็บ My works ในหน้าโปรไฟล์หลัก"}
                        </p>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {filteredPortfolioItems.map((work) => (
                            <div
                              key={work.id}
                              className="group overflow-hidden rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md shadow-sm"
                            >
                              <div
                                className="relative h-64 w-full bg-slate-200 transition duration-500 group-hover:scale-105"
                                style={{
                                  backgroundImage: work.image_url ? `url("${work.image_url}")` : "linear-gradient(135deg,#fef3c7,#e0e7ff)",
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                              >
                                <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white">
                                  <Maximize2 size={16} className="text-[#2D2D2D]" />
                                </button>
                              </div>
                              <div className="p-4">
                                <p className="text-base font-semibold text-[#2D2D2D]">
                                  {work.title}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "friends" && (
                    <div className="bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                      <h2 className="text-base font-bold text-[#2D2D2D] mb-4">Friends</h2>
                      <p className="text-sm text-gray-500">
                        เพื่อนของคุณกำลังรอการเชื่อมต่อ
                      </p>
                    </div>
                  )}

                  {activeTab === "gallery" && (
                    <div className="bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                      <h2 className="text-base font-bold text-[#2D2D2D] mb-4">Gallery</h2>
                      <p className="text-sm text-gray-500">
                        แกลเลอรีกำลังอยู่ระหว่างการออกแบบ
                      </p>
                    </div>
                  )}
                </div>
              </main>

              {/* Right Sidebar - Profile Card and Detailed Information */}
              <div className="w-full md:w-[280px] flex flex-col gap-4 shrink-0 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
                {/* Profile Card */}
                <div className="bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                  {isOwnProfile && (
                    <div className="flex justify-end gap-1.5 mb-4">
                      <button
                        onClick={handleCopyLink}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        title="คัดลอกลิงก์โปรไฟล์"
                      >
                        <Copy size={12} className="text-gray-500" />
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        title="แชร์โปรไฟล์"
                      >
                        <Share2 size={12} className="text-gray-500" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col items-center mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3 relative group">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <span className="text-3xl">?</span>
                        </div>
                      )}
                      {isOwnProfile && (
                        <div
                          className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={handleProfileImageClick}
                        >
                          <Edit2 size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    {isOwnProfile && (
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    )}

                    <h2 className="text-lg font-bold text-[#2D2D2D] mb-1 text-center">{displayName}</h2>
                    <p className="text-xs text-gray-500 text-center px-3">{jobPreference?.position || "High-End Client Coordinator In Jewelry Enthusiast"}</p>
                  </div>

                </div>

                {/* Tab Switcher */}
                <TabSwitcher
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  worksCount={portfolioCount}
                />

                {/* Detailed Information */}
                <div className="bg-white/40 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-white/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#2D2D2D] rounded-full flex items-center justify-center text-white">
                        <FileText size={12} />
                      </div>
                      <h2 className="text-base font-bold text-[#2D2D2D]">Detailed Information</h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-500">
                          <span className="text-[10px] font-bold">FN</span>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">First Name</p>
                          <p className="text-xs font-bold text-[#2D2D2D]">{displayName.split(' ')[0]}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-500">
                          <span className="text-[10px] font-bold">LN</span>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Last Name</p>
                          <p className="text-xs font-bold text-[#2D2D2D]">{displayName.split(' ').slice(1).join(' ') || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-500">
                          <Mail size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Email</p>
                          <p className="text-xs font-bold text-[#2D2D2D] truncate max-w-[120px]" title={profile?.email || ""}>{profile?.email || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-500">
                          <Phone size={12} />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Phone Number</p>
                          <p className="text-xs font-bold text-[#2D2D2D]">{profile?.phone || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-500">
                          <Share2 size={12} />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Source</p>
                          <div className="flex gap-1.5 mt-1">
                            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold">X</div>
                            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold">in</div>
                            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold">ig</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center text-gray-500">
                          <Eye size={12} />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Last Connected</p>
                          <p className="text-xs font-bold text-[#2D2D2D]">05/15/2025 at 7:16 pm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Profile Settings Only */}
              <aside className="hidden w-full max-w-[280px] flex-none lg:block">
                <ProfileRightSidebar
                  profileLink={profileLink}
                  profileLanguage="ไทย"
                  profile={profile}
                  address={address}
                  educations={educations}
                  experiences={experiences}
                  aboutMe={aboutMe}
                  profileImageUrl={profileImageUrl}
                  coverImageUrl={coverImageUrl}
                  {...(handleDownloadCV && { onDownloadCV: handleDownloadCV })}
                  {...(isOwnProfile && { onSelectTemplate: () => setTemplateSelectorOpen(true) })}
                  isOwnProfile={isOwnProfile}
                />
              </aside>
            </div>
          )}
        </main>
      </div>

      {isOwnProfile && (
        <ProfileTemplateSelector
          open={templateSelectorOpen}
          onClose={() => setTemplateSelectorOpen(false)}
          currentTemplate={currentTemplate}
        />
      )}
      {isOwnProfile && (
        <ImageCropModal
          open={cropModalOpen}
          imageSrc={cropImageSrc}
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
          aspectRatio={cropType === "profile" ? 1 : 16 / 9}
          cropShape={cropType === "profile" ? "round" : "rect"}
          title={cropType === "profile" ? "Crop Profile Image" : "Crop Cover Image"}
        />
      )}
    </div>
  );
}
