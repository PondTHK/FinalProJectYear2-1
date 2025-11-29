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
    { id: "works", label: worksCount > 0 ? `My works (${worksCount})` : "My works" },
    // { id: "friends", label: "Friends" },
    // { id: "gallery", label: "Gallery" },
  ];

  return (
    <div className="bg-[#F9F9F9] rounded-xl p-0.5 flex gap-1 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
            activeTab === tab.id
              ? "bg-white text-[#2D2D2D] shadow-sm"
              : "text-gray-500 hover:text-[#2D2D2D]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

