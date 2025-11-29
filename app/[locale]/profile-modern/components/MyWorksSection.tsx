"use client";

import { ArrowUpRight } from "lucide-react";
import type { UserPortfolioResponse } from "@/app/lib/api";

type MyWorksSectionProps = {
  portfolioItems: UserPortfolioResponse[];
};

export default function MyWorksSection({ portfolioItems }: MyWorksSectionProps) {
  if (portfolioItems.length === 0) {
    return (
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#2d2b45]">My works</h2>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          ยังไม่มีผลงาน กรุณาเพิ่มผลงานจากแท็บ My works ในหน้าโปรไฟล์หลัก
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#2d2b45]">My works</h2>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {portfolioItems.map((work) => (
          <div
            key={work.id}
            className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_15px_40px_rgba(15,23,42,0.08)]"
          >
            <div
              className="h-40 w-full bg-slate-200 transition duration-500 group-hover:scale-105"
              style={{
                backgroundImage: work.image_url ? `url("${work.image_url}")` : "linear-gradient(135deg,#fef3c7,#e0e7ff)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {work.description ? "Case study" : "Portfolio"}
              </p>
              <p className="mt-3 text-lg font-semibold text-[#2d2b45]">
                {work.title}
              </p>
              {work.description && (
                <p className="mt-2 text-sm text-[#6b6a8b]">{work.description}</p>
              )}
              {work.link && (
                <a
                  href={work.link.startsWith("http") ? work.link : `https://${work.link}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6f58d7]"
                  target="_blank"
                  rel="noreferrer"
                >
                  View project
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

