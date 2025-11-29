export type PillTone = "neutral" | "blue" | "violet";

const palette: Record<PillTone, { bg: string; bd: string }> = {
  neutral: { bg: "rgba(0,0,0,.05)", bd: "rgba(0,0,0,.08)" },
  blue: { bg: "rgba(59,130,246,.10)", bd: "rgba(59,130,246,.25)" },
  violet: { bg: "rgba(139,92,246,.12)", bd: "rgba(139,92,246,.25)" },
};

export const pillSX = (tone: PillTone) => {
  const token = palette[tone];
  return { background: token.bg, borderColor: token.bd, borderRadius: 999 } as const;
};
