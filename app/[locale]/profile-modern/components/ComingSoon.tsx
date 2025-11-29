"use client";

type ComingSoonProps = {
  copy: string;
};

export default function ComingSoon({ copy }: ComingSoonProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
      <p className="text-base font-medium text-slate-500">{copy}</p>
      <p className="mt-2 text-sm text-slate-400">ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้</p>
    </div>
  );
}

