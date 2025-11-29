import React from "react";
import { Box, Typography } from "@mui/material";

export type StatPillColor = "neutral" | "blue" | "amber" | "violet";

const palette: Record<StatPillColor, { bg: string; bd: string; text: string }> = {
  neutral: { bg: "#F5F6F8", bd: "rgba(0,0,0,.08)", text: "#111" },
  blue: { bg: "rgba(59,130,246,.10)", bd: "rgba(59,130,246,.25)", text: "#111" },
  amber: { bg: "rgba(245,158,11,.14)", bd: "rgba(245,158,11,.25)", text: "#111" },
  violet: { bg: "rgba(139,92,246,.12)", bd: "rgba(139,92,246,.25)", text: "#111" },
};

interface StatPillProps {
  label: string;
  value: string;
  color: StatPillColor;
}

export function StatPill({ label, value, color }: StatPillProps) {
  const token = palette[color];

  return (
    <Box sx={{ borderRadius: 3, background: token.bg, border: `1px solid ${token.bd}`, px: 2.5, py: 1.5 }}>
      <Typography variant="caption" color="text.secondary" className="uppercase tracking-wider">
        {label}
      </Typography>
      <Typography fontWeight={700} sx={{ color: token.text }}>
        {value}
      </Typography>
    </Box>
  );
}
