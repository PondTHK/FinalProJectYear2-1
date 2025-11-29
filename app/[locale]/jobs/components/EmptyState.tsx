"use client";

import React from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { pillSX } from '../pillStyles';

export function EmptyState({ resetAll }: { resetAll: () => void }) {
  const t = useTranslations("Jobs.emptyState");

  return (
    <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
      <Box
        sx={{
          mx: "auto",
          height: 72,
          width: 72,
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg, rgba(59,130,246,.14), rgba(139,92,246,.14))",
          border: "1px solid rgba(0,0,0,.08)",
          boxShadow:
            "0 10px 24px rgba(0,0,0,.06), inset 0 0 0 6px rgba(255,255,255,.6)",
        }}
      >
        <Sparkles size={24} />
      </Box>

      <Typography variant="h6" fontWeight={800} sx={{ mt: 2 }}>
        {t("title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {t("description")}
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2, flexWrap: "wrap" }}>
        <Chip size="small" label={t("searchChip")} sx={pillSX("neutral")} />
        <Chip size="small" label={t("clickChip")} sx={pillSX("violet")} />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          disableElevation
          onClick={() => {
            const el = document.getElementById("jobs-search") as HTMLInputElement | null;
            el?.focus();
          }}
        >
          {t("startTyping")}
        </Button>
        <Button variant="outlined" onClick={resetAll}>
          {t("clearFilters")}
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 3,
          mx: "auto",
          maxWidth: 520,
          borderRadius: 3,
          px: 2,
          py: 1.5,
          background: "rgba(0,0,0,.035)",
          border: "1px dashed rgba(0,0,0,.1)",
        }}
      >
        <Typography variant="caption" color="text.secondary" dangerouslySetInnerHTML={{ __html: t.raw("tip") }} />
      </Box>
    </Box>
  );
}
