"use client";

import type { EducationItem } from "@/app/Components/profile/utils/profileUtils";

type EducationSectionProps = {
  educationItems: EducationItem[];
};

export default function EducationSection({ educationItems }: EducationSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[#2d2b45]">Education</h2>
      {educationItems.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          ยังไม่มีข้อมูลการศึกษา กรุณาเพิ่มใน onboarding
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {educationItems.map((edu) => (
            <div
              key={edu.key}
              className="rounded-3xl border border-[#f0ebff] bg-[#fbfaff] p-5 text-[#4b4671] shadow-[0_15px_40px_rgba(105,58,180,0.08)]"
            >
              <p className="text-lg font-semibold text-[#2d2b45]">{edu.school}</p>
              <p className="mt-1 text-sm text-[#8c8bb0]">{edu.degree}</p>
              <p className="mt-1 text-sm font-medium text-[#6f58d7]">{edu.period}</p>
              <p className="mt-2 text-sm text-slate-500">{edu.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

