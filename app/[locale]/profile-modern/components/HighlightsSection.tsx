"use client";

import type { ExperienceItem } from "@/app/Components/profile/utils/profileUtils";
import type { UserJobPreferenceResponse } from "@/app/lib/api";

type HighlightsSectionProps = {
  currentExperience?: ExperienceItem;
  location: string;
  jobPreference: UserJobPreferenceResponse | null;
};

export default function HighlightsSection({
  currentExperience,
  location,
  jobPreference,
}: HighlightsSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl bg-[#f1ffe1] p-6 shadow-[inset_0_0_0_1px_rgba(164,208,94,0.4)]">
        <p className="text-sm text-[#6b6a4c]">Currently working with…</p>
        <div className="mt-4">
          <p className="text-lg font-semibold text-[#384c28]">
            {currentExperience?.company ?? "ยังไม่มีข้อมูลประสบการณ์"}
          </p>
          <p className="text-sm text-[#6b6a4c]">
            {currentExperience
              ? `${currentExperience.position} · ${currentExperience.period}`
              : "กรุณาเพิ่มประสบการณ์ใน onboarding"}
          </p>
        </div>
      </div>
      <div className="rounded-3xl bg-[#f8f3ff] p-6">
        <p className="text-sm text-[#8c8bb0]">Location & availability</p>
        <p className="mt-3 text-lg font-semibold text-[#2d2b45]">{location}</p>
        <p className="mt-2 text-sm text-[#8c8bb0]">
          รูปแบบงานที่สนใจ: {jobPreference?.work_time ?? "ยังไม่ระบุ"}
        </p>
      </div>
    </div>
  );
}

