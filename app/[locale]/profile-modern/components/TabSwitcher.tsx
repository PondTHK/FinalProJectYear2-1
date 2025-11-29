"use client";

import type { ProfileTab } from "@/app/[locale]/profile-modern/types";

type TabSwitcherProps = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  worksCount: number;
};

export default function TabSwitcher({ activeTab, onChange, worksCount }: TabSwitcherProps) {
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "works", label: worksCount ? `My works (${worksCount})` : "My works" },

  ];

  return (
    <div className="mt-8 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-1 text-sm font-medium text-slate-500">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-2xl px-4 py-2 transition ${
            activeTab === tab.id ? "bg-white text-slate-900 shadow" : "hover:text-slate-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

