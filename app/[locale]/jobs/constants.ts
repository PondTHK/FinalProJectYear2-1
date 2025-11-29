export const NAV_ITEMS = [
  { id: "jobs", label: "Jobs" },

  { id: "saved", label: "Saved" },
  { id: "near_me", label: "งานใกล้ฉัน" },
  { id: "ai-matching", label: "AI Matching" },
] as const;

export type NavSection = (typeof NAV_ITEMS)[number]["id"];

export const isNavSection = (val: string | null): val is NavSection =>
  NAV_ITEMS.some((item) => item.id === val);
