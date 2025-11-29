"use client";

import { Download, Loader2 } from "lucide-react";

type QuickActionsProps = {
  onDownloadCV: () => void;
  isGenerating: boolean;
  exportDisabled: boolean;
};

export default function QuickActionsSection({
  onDownloadCV,
  isGenerating,
  exportDisabled,
}: QuickActionsProps) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="button"
        onClick={onDownloadCV}
        disabled={exportDisabled || isGenerating}
        className="inline-flex items-center gap-2 rounded-2xl bg-[#6f58d7] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#5a46c4] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isGenerating ? "กำลังสร้าง PDF..." : "Export to PDF"}
      </button>
    </div>
  );
}

