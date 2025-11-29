"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronDown } from "lucide-react";

import { pillSX } from "../pillStyles";

const FAQ_ITEMS = [
  {
    id: "overview",
    question: "Smart Persona คืออะไร?",
    answer:
      "Smart Persona เป็นระบบ career OS ที่รวมงาน บริษัท และ connection เข้าไว้หน้าจอเดียว พร้อมสรุป insight ที่ได้จาก AI เพื่อให้คุณตัดสินใจได้เร็วขึ้น.",
  },
  {
    id: "matching",
    question: "AI match งานยังไงให้ตรงกับฉัน?",
    answer:
      "เราประมวลผลโปรไฟล์ สกิล และ goal ที่คุณตั้งไว้ แล้วเปรียบเทียบกับ requirement ของบริษัท + ข้อมูลตลาดปัจจุบัน ก่อนแนะนำงานที่มีคะแนน match สูงสุด พร้อมเหตุผลประกอบ.",
  },
  {
    id: "privacy",
    question: "ข้อมูลโปรไฟล์ปลอดภัยไหม?",
    answer:
      "ข้อมูลทั้งหมดถูกเข้ารหัสทั้งขณะส่งและขณะเก็บ เราไม่แชร์ข้อมูลกับบริษัทใดหากคุณไม่กด Apply และสามารถลบข้อมูลเองได้ทุกเมื่อจากหน้า Settings.",
  },
  {
    id: "workflow",
    question: "ต้องสลับหน้าหลายรอบไหมเวลาทำงาน?",
    answer:
      "ไม่ต้องเลย หน้าจอ Jobs, Companies, People และ FAQ ใช้ state ร่วมกัน คุณจึงติดตาม pipeline, บันทึกโน้ต และคุยกับทีม Smart Persona ได้โดยไม่ออกจาก flow หลัก.",
  },
] as const;

export function FAQSection({ onBackToJobs }: { onBackToJobs: () => void }) {
  const [expanded, setExpanded] = useState<string>(FAQ_ITEMS[0]?.id ?? "");

  return (
    <Container maxWidth="lg" className="!px-5 md:!px-8 py-14">
      <Card
        variant="outlined"
        sx={{
          borderRadius: 5,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.96), rgba(245,247,255,.92))",
          borderColor: "var(--ring)",
          boxShadow: "0 18px 44px rgba(15,23,42,.12)",
        }}
      >
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={1} alignItems="flex-start">
              <Chip size="small" label="Smart Persona support" sx={pillSX("neutral")} />
              <Typography variant="h5" fontWeight={800}>
                FAQ – ทุกอย่างเกี่ยวกับ Smart Persona
              </Typography>
              <Typography color="text.secondary">
                ตอบคำถามยอดฮิตตั้งแต่การแมตช์งานด้วย AI ไปจนถึงความปลอดภัยของข้อมูล
                และวิธีใช้งานหลายแท็บโดยไม่ออกจากหน้า Jobs
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {FAQ_ITEMS.map((item) => (
                <Accordion
                  key={item.id}
                  expanded={expanded === item.id}
                  onChange={() =>
                    setExpanded((prev) => (prev === item.id ? "" : item.id))
                  }
                  disableGutters
                  square
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,.08)",
                    background: "rgba(255,255,255,.9)",
                    boxShadow: "0 8px 26px rgba(15,23,42,.08)",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={16} />}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      "& .MuiAccordionSummary-content": { alignItems: "center", gap: 12 },
                    }}
                  >
                    <Typography fontWeight={700}>{item.question}</Typography>
                  </AccordionSummary>
                  <Divider sx={{ mx: 2.5 }} />
                  <AccordionDetails sx={{ px: 2.5, pt: 1.5, pb: 2.5 }}>
                    <Typography color="text.secondary">{item.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button variant="contained" disableElevation onClick={onBackToJobs}>
                กลับไปดูงาน
              </Button>
              <Button variant="outlined" onClick={onBackToJobs}>
                เปิด Jobs tab
              </Button>
              <Button variant="text" sx={{ textTransform: "none" }}>
                คุยกับ Smart Persona Team
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
