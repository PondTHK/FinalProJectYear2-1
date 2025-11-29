"use client";

import { useState } from "react";
import { X, Check, Palette } from "lucide-react";
import { useRouter } from "next/navigation";

export type ProfileTemplate = "classic" | "modern" | "jewelry";

interface ProfileTemplateOption {
  id: ProfileTemplate;
  name: string;
  description: string;
  preview: string;
  route: string;
}

const templates: ProfileTemplateOption[] = [
  {
    id: "classic",
    name: "Classic Profile",
    description: "สไตล์คลาสสิก ใช้งานง่าย เหมาะสำหรับการใช้งานทั่วไป",
    preview: "classic",
    route: "/profile",
  },
  {
    id: "modern",
    name: "Modern Profile",
    description: "สไตล์โมเดิร์น สวยงาม เหมาะสำหรับการแสดงผลแบบมืออาชีพ",
    preview: "modern",
    route: "/profile-modern",
  },
  {
    id: "jewelry",
    name: "Jewelry Dashboard",
    description: "สไตล์ Jewelry CRM Dashboard แบบ Neumorphic สวยงาม เหมาะสำหรับธุรกิจอัญมณี",
    preview: "jewelry",
    route: "/profile-jewelry",
  },
];

interface ProfileTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  currentTemplate: ProfileTemplate;
}

export default function ProfileTemplateSelector({
  open,
  onClose,
  currentTemplate,
}: ProfileTemplateSelectorProps) {
  const router = useRouter();
  const selectedTemplate = currentTemplate;
  const [previewTemplate, setPreviewTemplate] = useState<ProfileTemplate | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePreview = (templateId: ProfileTemplate) => {
    setPreviewTemplate(templateId);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleSelectTemplate = async (templateId: ProfileTemplate) => {
    if (templateId === currentTemplate) {
      onClose();
      return;
    }

    setIsTransitioning(true);
    
    try {
      // Save selected template to database
      const { userAPI } = await import("@/app/lib/api");
      const response = await userAPI.getProfile();
      if (response.ok && response.data) {
        // Update profile with new template
        const updatePayload = {
          ...response.data,
          template: templateId,
        };
        
        console.log("💾 Saving template:", templateId, "Current profile:", response.data);
        console.log("💾 Update payload:", updatePayload);
        
        const updateResponse = await userAPI.upsertProfile(updatePayload);
        
        if (updateResponse.ok && updateResponse.data) {
          console.log("✅ Template saved successfully! Response:", updateResponse.data);
          console.log("✅ Template in response:", updateResponse.data.template);
          
          // Verify by fetching again after a short delay
          setTimeout(async () => {
            const verifyResponse = await userAPI.getProfile();
            if (verifyResponse.ok && verifyResponse.data) {
              console.log("✅ Verified template in database:", verifyResponse.data.template);
            }
          }, 500);
        } else {
          console.error("❌ Failed to save template - response not ok:", updateResponse);
        }
      } else {
        console.error("❌ Failed to get current profile:", response);
      }
      
      // Also save to localStorage for backward compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("profile_template", templateId);
      }
    } catch (error) {
      console.error("Failed to save template to database:", error);
      // Still save to localStorage as fallback
      if (typeof window !== "undefined") {
        localStorage.setItem("profile_template", templateId);
      }
    }

    // Close modal first for smooth transition
    onClose();

    // Smooth transition with delay for visual feedback
    setTimeout(() => {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        // Add fade-out effect
        if (typeof document !== "undefined") {
          document.body.style.transition = "opacity 0.3s ease-out";
          document.body.style.opacity = "0";
        }
        
        setTimeout(() => {
          router.push(template.route);
          // Reset opacity after navigation
          if (typeof document !== "undefined") {
            setTimeout(() => {
              document.body.style.opacity = "1";
              document.body.style.transition = "";
            }, 100);
          }
        }, 300);
      }
    }, 200);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        style={{
          animation: open ? "fadeIn 0.2s ease-out" : "none",
        }}
      />

      {/* Main Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl transition-all"
          style={{
            animation: open ? "slideUp 0.3s ease-out" : "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#6f58d7]/10 p-2">
                <Palette className="h-5 w-5 text-[#6f58d7]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">เลือก Template โปรไฟล์</h2>
                <p className="text-sm text-slate-500">เลือกสไตล์ที่เหมาะกับคุณ</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Template Grid */}
          <div className="grid gap-6 p-6 md:grid-cols-2">
            {templates.map((template) => {
              const isSelected = selectedTemplate === template.id;
              const isCurrent = currentTemplate === template.id;

              return (
                <div
                  key={template.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-[#6f58d7] bg-[#6f58d7]/5 shadow-lg"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {/* Preview Image */}
                  <div
                    className="relative h-48 w-full cursor-pointer overflow-hidden bg-slate-100 transition-transform hover:scale-[1.02]"
                    onClick={() => handlePreview(template.id)}
                  >
                    {template.id === "classic" ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#ec4899]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="mb-2 text-2xl font-bold">Classic</div>
                            <div className="text-xs opacity-90">Glass morphism design</div>
                          </div>
                        </div>
                      </div>
                    ) : template.id === "modern" ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#f3e9ff] via-[#e8d6ff] to-[#fef6da]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="mb-2 text-2xl font-bold text-[#6f58d7]">Modern</div>
                            <div className="text-xs text-slate-600">Clean & minimal design</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#F5F1EB] via-[#FFE5D9] to-[#D4E4F7]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="mb-2 text-2xl font-bold text-[#8B5A3C]">Jewelry</div>
                            <div className="text-xs text-slate-600">Neumorphic CRM Dashboard</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm">
                      คลิกเพื่อดู Preview
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                      {isCurrent && (
                        <span className="rounded-full bg-[#10b981]/10 px-2 py-1 text-xs font-medium text-[#10b981]">
                          กำลังใช้
                        </span>
                      )}
                    </div>
                    <p className="mb-4 text-sm text-slate-600">{template.description}</p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreview(template.id)}
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        ดู Preview
                      </button>
                      <button
                        onClick={() => handleSelectTemplate(template.id)}
                        disabled={isCurrent || isTransitioning}
                        className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                          isSelected
                            ? "bg-[#6f58d7] hover:bg-[#5a46c4]"
                            : "bg-slate-600 hover:bg-slate-700"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {isCurrent ? "กำลังใช้" : isSelected ? "เลือก" : "เลือกใช้"}
                      </button>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute right-4 top-4 rounded-full bg-[#6f58d7] p-1.5 text-white shadow-lg">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={templates.find((t) => t.id === previewTemplate)!}
          onClose={handleClosePreview}
          onSelect={() => handleSelectTemplate(previewTemplate)}
          isCurrent={currentTemplate === previewTemplate}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

function ClassicProfilePreview() {
  return (
    <div className="w-full bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#ec4899] p-4">
      <div className="rounded-2xl bg-white/20 backdrop-blur-xl p-4 text-white">
        {/* Cover Image */}
        <div className="mb-4 h-32 w-full rounded-xl bg-white/30" />
        
        {/* Profile Avatar - Centered */}
        <div className="mb-3 flex justify-center -mt-12">
          <div className="h-20 w-20 rounded-full border-4 border-white/50 bg-white/40" />
        </div>
        
        {/* Name and Title */}
        <div className="mb-4 text-center">
          <div className="mb-2 h-5 w-40 mx-auto rounded bg-white/40" />
          <div className="mb-3 h-3 w-28 mx-auto rounded bg-white/30" />
        </div>
        
        {/* Stats Section */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg bg-white/20 p-2 text-center">
              <div className="mb-1 h-4 w-full rounded bg-white/30" />
              <div className="h-2 w-2/3 mx-auto rounded bg-white/20" />
            </div>
          ))}
        </div>
        
        {/* Tabs */}
        <div className="mb-4 flex justify-center gap-1 border-b border-white/20 pb-2">
          {["Profile", "Works", "Friends", "Gallery"].map((tab) => (
            <div key={tab} className="h-5 w-12 rounded bg-white/20" />
          ))}
        </div>
        
        {/* Content Sections */}
        <div className="space-y-3">
          <div className="rounded-lg bg-white/20 p-3">
            <div className="mb-2 h-3 w-20 rounded bg-white/30" />
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded bg-white/20" />
              <div className="h-2 w-5/6 rounded bg-white/20" />
              <div className="h-2 w-4/6 rounded bg-white/20" />
            </div>
          </div>
          <div className="rounded-lg bg-white/20 p-3">
            <div className="mb-2 h-3 w-28 rounded bg-white/30" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 w-14 rounded-full bg-white/30" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernProfilePreview() {
  return (
    <div className="w-full bg-white p-4">
      <div className="rounded-[36px] border border-slate-100 bg-white p-4 shadow-lg">
        {/* Cover Section */}
        <div className="mb-4 h-32 w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f3e9ff] via-[#e8d6ff] to-[#fef6da]" />
        
        {/* Profile Header */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full border-[3px] border-white bg-slate-200 shadow-lg" />
          <div className="flex-1">
            <div className="mb-1.5 h-4 w-36 rounded bg-slate-200" />
            <div className="mb-1.5 h-3 w-28 rounded bg-slate-100" />
            <div className="h-2.5 w-20 rounded bg-slate-100" />
          </div>
        </div>
        
        {/* Contact Chips */}
        <div className="mb-4 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        
        {/* Tab Switcher */}
        <div className="mb-4 flex gap-1 rounded-2xl bg-slate-50 p-1">
          {["Profile", "Works"].map((tab) => (
            <div key={tab} className="h-7 flex-1 rounded-2xl bg-white shadow" />
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="mb-4 flex justify-end">
          <div className="h-9 w-28 rounded-2xl bg-[#6f58d7]" />
        </div>
        
        {/* Divider */}
        <div className="mb-4 h-px bg-slate-200" />
        
        {/* Content Sections */}
        <div className="space-y-4">
          {/* Intro Section */}
          <div>
            <div className="mb-2 h-3.5 w-28 rounded bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded bg-slate-100" />
              <div className="h-2.5 w-5/6 rounded bg-slate-100" />
              <div className="h-2.5 w-4/6 rounded bg-slate-100" />
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-slate-200" />
          
          {/* Skills Section */}
          <div>
            <div className="mb-2 h-3.5 w-20 rounded bg-slate-200" />
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-6 w-16 rounded-full bg-slate-100" />
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-slate-200" />
          
          {/* Highlights Section */}
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="mb-1.5 h-3.5 w-16 rounded bg-slate-200" />
                <div className="h-2.5 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function JewelryProfilePreview() {
  return (
    <div className="w-full bg-[#F5F1EB] p-4">
      <div className="flex gap-3">
        {/* Left Section - 70% */}
        <div className="flex-[0.7] flex flex-col gap-3">
          {/* Top Row - User Avatars */}
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-[20px] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/50">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 border-2 border-white shadow-lg"></div>
              ))}
            </div>
          </div>

          {/* Middle Grid - 2x2 Cards */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* Top Left - Pastel Peach */}
            <div className="bg-gradient-to-br from-[#FFE5D9] to-[#FFD4C4] rounded-[20px] p-3 shadow-[0_8px_32px_rgba(255,180,162,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60">
              <div className="mb-2 h-3 w-16 rounded bg-white/50"></div>
              <div className="mb-1 h-5 w-20 rounded bg-white/40"></div>
              <div className="h-2 w-24 rounded bg-white/30"></div>
            </div>

            {/* Top Right - Pastel Blue */}
            <div className="bg-gradient-to-br from-[#D4E4F7] to-[#B8D4F0] rounded-[20px] p-3 shadow-[0_8px_32px_rgba(180,212,240,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60">
              <div className="mb-2 h-3 w-16 rounded bg-white/50"></div>
              <div className="mb-1 h-5 w-20 rounded bg-white/40"></div>
              <div className="h-2 w-24 rounded bg-white/30"></div>
            </div>

            {/* Bottom Left - Pastel Orange/Salmon */}
            <div className="bg-gradient-to-br from-[#FFD9CC] to-[#FFC4B0] rounded-[20px] p-3 shadow-[0_8px_32px_rgba(255,196,176,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60">
              <div className="mb-2 h-3 w-16 rounded bg-white/50"></div>
              <div className="mb-1 h-5 w-20 rounded bg-white/40"></div>
              <div className="h-2 w-24 rounded bg-white/30"></div>
            </div>

            {/* Bottom Right - Pastel Purple */}
            <div className="bg-gradient-to-br from-[#E8D5F2] to-[#D9C4E8] rounded-[20px] p-3 shadow-[0_8px_32px_rgba(217,196,232,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/60">
              <div className="mb-2 h-3 w-16 rounded bg-white/50"></div>
              <div className="mb-1 h-5 w-20 rounded bg-white/40"></div>
              <div className="h-2 w-24 rounded bg-white/30"></div>
            </div>
          </div>

          {/* Bottom Section - Progress Bars */}
          <div className="bg-white/60 backdrop-blur-sm rounded-[20px] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/50">
            <div className="mb-2 h-3 w-24 rounded bg-slate-200"></div>
            <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 w-1/2 rounded-full bg-yellow-400"></div>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 w-3/5 rounded-full bg-blue-400"></div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - 30% */}
        <div className="flex-[0.3] bg-white/60 backdrop-blur-sm rounded-[20px] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] border border-white/50 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 mb-3 shadow-lg border-4 border-white"></div>
          <div className="mb-3 h-3 w-20 rounded bg-slate-200"></div>
          <div className="w-full space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-full rounded-xl bg-white/50"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewModal({
  template,
  onClose,
  onSelect,
  isCurrent,
}: {
  template: ProfileTemplateOption;
  onClose: () => void;
  onSelect: () => void;
  isCurrent: boolean;
}) {
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
      style={{
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        className="relative w-full max-w-6xl rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{template.name}</h3>
            <p className="text-sm text-slate-500">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 shadow-inner">
            {template.id === "classic" ? (
              <ClassicProfilePreview />
            ) : template.id === "modern" ? (
              <ModernProfilePreview />
            ) : (
              <JewelryProfilePreview />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ปิด
          </button>
          <button
            onClick={onSelect}
            disabled={isCurrent}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition ${
              isCurrent
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#6f58d7] hover:bg-[#5a46c4]"
            }`}
          >
            {isCurrent ? "กำลังใช้อยู่" : "เลือกใช้ Template นี้"}
          </button>
        </div>
      </div>
    </div>
  );
}
