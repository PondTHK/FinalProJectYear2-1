"use client";

import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      กำลังโหลดข้อมูลโปรไฟล์
    </div>
  );
}

