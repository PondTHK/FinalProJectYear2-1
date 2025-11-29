"use client";

import type { ChangeEvent } from "react";
import { Loader2 } from "lucide-react";

type CoverSectionProps = {
  coverImageUrl: string | null;
  displayName: string;
  roleTitle: string;
  onChangeCover?: ((event: ChangeEvent<HTMLInputElement>) => void) | undefined;
  isUploadingCover: boolean;
};

export default function CoverSection({
  coverImageUrl,
  displayName,
  roleTitle,
  onChangeCover,
  isUploadingCover,
}: CoverSectionProps) {
  const fallback =
    "linear-gradient(135deg, #dfe7ff 0%, #f9e8ff 45%, #fef6da 100%)";

  return (
    <div className="mb-10 h-56 overflow-hidden rounded-[28px] border border-slate-100 bg-slate-100">
      <div
        className="relative h-full w-full"
        style={{
          backgroundImage: coverImageUrl ? `url("${coverImageUrl}")` : fallback,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/5 to-transparent" />
        <div className="absolute bottom-4 left-6 space-y-1 text-white drop-shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.4em]">
            Portfolio
          </p>
          <p className="text-lg font-semibold">{displayName}</p>
          <p className="text-sm opacity-80">{roleTitle}</p>
        </div>
        <div className="absolute right-4 top-4">
          <input
            type="file"
            id="cover-upload"
            className="hidden"
            accept="image/*"
            onChange={onChangeCover ?? (() => {})}
          />
          <label
            htmlFor="cover-upload"
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-md backdrop-blur hover:bg-white"
          >
            {isUploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isUploadingCover ? "กำลังอัปโหลด..." : "เปลี่ยนรูป Cover"}
          </label>
        </div>
      </div>
    </div>
  );
}
