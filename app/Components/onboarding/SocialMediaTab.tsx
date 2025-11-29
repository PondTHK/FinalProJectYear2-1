"use client";

import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,

} from "@mui/material";
import { useTranslations } from "next-intl";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import SocialConnectButton from "./SocialConnectButton";

export default function SocialMediaTab() {
    const t = useTranslations("Onboarding.socialMedia");
    return (
        <Box>
            <Accordion
                defaultExpanded
                sx={{
                    border: "1px solid rgba(143, 167, 255, 0.25)",
                    borderRadius: 2,
                    boxShadow: "none",
                    bgcolor: "#fcfdff",
                    "&.Mui-expanded": {
                        boxShadow: "0 8px 24px rgba(73, 92, 136, 0.1)",
                    },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon />}
                    sx={{ px: 2, "& .MuiAccordionSummary-content": { gap: 1.5 } }}
                >
                    <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#222752" }}>
                        {t("title")}
                    </Typography>
                    <Typography sx={{ color: "#757fa9" }}>
                        {t("subtitle")}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                        <Typography color="text.secondary" align="center" sx={{ maxWidth: 600, mb: 4, fontSize: 16 }}>
                            {t("description")}
                        </Typography>

                        <SocialConnectButton />

                        {/* <Paper elevation={0} sx={{ mt: 6, p: 3, bgcolor: '#f0f9ff', borderRadius: 3, maxWidth: 600, width: '100%', border: '1px solid #bae6fd' }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="#0284c7" sx={{ mb: 2 }}>
                                ประโยชน์ของการเชื่อมต่อ:
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                    <ListItemText
                                        primary="วิเคราะห์จุดแข็งทางบุคลิกภาพ (Soft Skills)"
                                        primaryTypographyProps={{ fontWeight: 500, color: '#334155' }}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                    <ListItemText
                                        primary="แสดงให้เห็นถึงทัศนคติเชิงบวกและการทำงานร่วมกับผู้อื่น"
                                        primaryTypographyProps={{ fontWeight: 500, color: '#334155' }}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                                    <ListItemText
                                        primary="เพิ่มโอกาสในการได้งานที่ตรงกับวัฒนธรรมองค์กร"
                                        primaryTypographyProps={{ fontWeight: 500, color: '#334155' }}
                                    />
                                </ListItem>
                            </List>
                        </Paper> */}
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
