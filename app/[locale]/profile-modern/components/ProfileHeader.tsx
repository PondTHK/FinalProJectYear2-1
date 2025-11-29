/* eslint-disable @next/next/no-img-element */
"use client";

import type { ChangeEvent, ReactNode } from "react";
import { Loader2, MapPin, Mail, Phone } from "lucide-react";

type ProfileHeaderProps = {
  displayName: string;
  roleTitle: string;
  profileImageUrl: string | null;
  location: string;
  phone: string;
  email: string;
  onChangeProfile?: ((event: ChangeEvent<HTMLInputElement>) => void) | undefined;
  isUploadingProfile: boolean;
};

export default function ProfileHeader({
  displayName,
  roleTitle,
  profileImageUrl,
  location,
  phone,
  email,
  onChangeProfile,
  isUploadingProfile,
}: ProfileHeaderProps) {
  const contactChips = [
    phone && { icon: <Phone className="h-4 w-4" />, label: phone },
    email && { icon: <Mail className="h-4 w-4" />, label: email },
    location && { icon: <MapPin className="h-4 w-4" />, label: location },
  ].filter(Boolean) as { icon: ReactNode; label: string }[];

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center">
      <div className="flex flex-1 items-center gap-5">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-[6px] border-white shadow-[0_10px_30px_rgba(139,108,193,0.4)]">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xl font-semibold text-slate-500">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 translate-y-1/3">
            <input
              type="file"
              id="profile-upload"
              className="hidden"
              accept="image/*"
              onChange={onChangeProfile ?? (() => {})}
            />
            <label
              htmlFor="profile-upload"
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6f58d7] shadow"
            >
              {isUploadingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {isUploadingProfile ? "อัปโหลด..." : "เปลี่ยนรูป"}
            </label>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-[#7a78a1]">{roleTitle}</p>
          <h1 className="text-3xl font-semibold text-[#26263f]">{displayName}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-[#7a78a1]">
            <MapPin className="h-4 w-4 text-[#b18de4]" />
            {location}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[#8a85b6]">
        {contactChips.length ? (
          contactChips.map((chip) => (
            <ContactChip key={chip.label} icon={chip.icon} label={chip.label} />
          ))
        ) : (
          <p className="text-sm text-slate-400">ยังไม่ระบุข้อมูลการติดต่อ</p>
        )}
      </div>
    </div>
  );
}

function ContactChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl border border-[#ede7ff] bg-white px-4 py-2 text-sm font-medium text-[#4c4b63] shadow-sm">
      {icon}
      {label}
    </span>
  );
}
