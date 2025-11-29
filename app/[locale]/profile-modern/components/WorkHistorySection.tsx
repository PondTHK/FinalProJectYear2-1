"use client";

import type { ExperienceItem } from "@/app/Components/profile/utils/profileUtils";

type WorkHistorySectionProps = {
  experienceItems: ExperienceItem[];
};

export default function WorkHistorySection({ experienceItems }: WorkHistorySectionProps) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#2d2b45]">Work history</h2>
      </div>
      {experienceItems.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          ยังไม่มีข้อมูลประสบการณ์ กรุณาเพิ่มในขั้นตอน onboarding
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {experienceItems.map((job) => (
            <div
              key={job.key}
              className="rounded-3xl border border-[#f0ebff] bg-white p-5 shadow-[0_12px_30px_rgba(98,68,184,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#b9b6d4]">{job.company}</p>
                  <p className="mt-2 text-lg font-semibold text-[#2d2b45]">{job.position}</p>
                  <p className="mt-1 text-sm text-slate-500">{job.description}</p>
                </div>
                <span className="text-sm font-medium text-[#7a78a1]">{job.period}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

