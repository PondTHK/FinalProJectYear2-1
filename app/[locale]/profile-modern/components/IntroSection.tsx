"use client";

type IntroSectionProps = {
  aboutSummary: string;
  jobPreferenceTitle: string;
  experienceYears: number;
};

export default function IntroSection({
  aboutSummary,
  jobPreferenceTitle,
  experienceYears,
}: IntroSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="rounded-3xl bg-[#ebe2ff] p-6 shadow-inner shadow-white/30">
        <p className="text-sm font-medium text-[#6f58d7]">ตำแหน่งที่สนใจ</p>
        <p className="mt-1 text-xl font-semibold text-[#433879]">{jobPreferenceTitle}</p>
        <p className="mt-4 text-base leading-relaxed text-[#4b4671]">
          {aboutSummary || "ยังไม่มีข้อมูลจากการกรอก onboarding"}
        </p>
      </div>
      <div className="rounded-3xl bg-[#f9f6ff] p-6 text-[#4b4671] shadow-inner shadow-white/70">
        <p className="text-sm font-medium text-[#8c8bb0]">ประสบการณ์โดยรวม</p>
        <p className="mt-3 text-3xl font-semibold text-[#2a2844]">
          {experienceYears ? `${experienceYears}+ ปี` : "กำลังเริ่มต้น"}
        </p>
        <p className="mt-2 text-sm text-[#8c8bb0]">
          ข้อมูลคำนวณจากประสบการณ์ที่กรอกใน onboarding
        </p>
      </div>
    </div>
  );
}

