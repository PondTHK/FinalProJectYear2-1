
import React from "react";
import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography } from "@mui/material";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { NavSection } from "../constants";
import { pillSX } from "../pillStyles";
import { SavedJobsSection } from "./SavedJobsSection";

interface SectionPlaceholderProps {
  section: NavSection;
  onBackToJobs: () => void;
  isLoggedIn: boolean;
}



export function SectionPlaceholder({ section, onBackToJobs, isLoggedIn }: SectionPlaceholderProps) {
  const t = useTranslations("Jobs.placeholder");
  const tNav = useTranslations("Jobs.nav");

  if (section === "jobs") return null;
  if (section === "saved") {
    return <SavedJobsSection isLoggedIn={isLoggedIn} onBackToJobs={onBackToJobs} />;
  }

  // Map section to translation keys
  const sectionKeyMap: Record<string, string> = {
    companies: "companies",
    near_me: "nearMe",
    "ai-matching": "aiMatching"
  };

  const sectionKey = sectionKeyMap[section] || section;
  // Use the section ID to get the translated label from Jobs.nav
  // For 'near_me' the key is 'nearMe', for 'ai-matching' it is 'aiMatching'
  const navKey = sectionKeyMap[section] || section;
  const label = tNav(navKey);

  return (
    <Container
      maxWidth="lg"
      className="!px-5 md:!px-8 py-16 grid place-items-center text-center"
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 680,
          borderRadius: 5,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.9))",
          borderColor: "var(--ring)",
          boxShadow: "0 16px 40px rgba(0,0,0,.08), 0 6px 14px rgba(0,0,0,.04)",
        }}
      >
        <CardContent>
          <Stack spacing={2} alignItems="center">
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
              <Sparkles size={28} />
            </Box>
            <Chip size="small" label={`${label} ${t("preview")}`} sx={pillSX("neutral")} />
            <Typography variant="h5" fontWeight={800}>
              {t(`${sectionKey}.title`)}
            </Typography>
            <Typography color="text.secondary">{t(`${sectionKey}.body`)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t(`${sectionKey}.helper`)}
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              sx={{ width: "100%", justifyContent: "center" }}
            >
              <Button variant="contained" disableElevation onClick={onBackToJobs}>
                {t("backToJobs")}
              </Button>
              <Button variant="outlined" onClick={onBackToJobs}>
                {t("openJobsTab")}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
