"use client";

import React from "react";
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    Chip,
    Divider,
    Avatar,
    Stack,
    Button,
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Download as DownloadIcon,
} from "@mui/icons-material";


interface ApplicantProfileViewProps {
    data: any; // Using any for now to match the aggregated response structure
}

const ApplicantProfileView: React.FC<ApplicantProfileViewProps> = ({ data }) => {
    const { profile, educations, experiences, skills, job_preference } = data;

    const fullName = profile
        ? `${profile.first_name_th || ""} ${profile.last_name_th || ""}`.trim() ||
        `${profile.first_name_en || ""} ${profile.last_name_en || ""}`.trim() ||
        "ผู้สมัคร"
        : "ผู้สมัคร";

    const roleTitle = job_preference?.job_titles?.[0] || "ผู้หางาน";

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f3f4f6", py: 4 }}>
            <Container maxWidth="lg">
                <Grid container spacing={3}>
                    {/* Header / Profile Card */}
                    <Grid size={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                alignItems: "center",
                                gap: 4,
                                background: "white",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                            }}
                        >
                            <Avatar
                                src={profile?.profile_image_url}
                                sx={{ width: 120, height: 120, border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            />
                            <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
                                <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
                                    {fullName}
                                </Typography>
                                <Typography variant="h6" color="primary.main" gutterBottom>
                                    {roleTitle}
                                </Typography>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2}
                                    justifyContent={{ xs: "center", md: "flex-start" }}
                                    sx={{ mt: 2, color: "text.secondary" }}
                                >
                                    {profile?.email && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <EmailIcon fontSize="small" /> {profile.email}
                                        </Box>
                                    )}
                                    {profile?.phone && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PhoneIcon fontSize="small" /> {profile.phone}
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                            <Box>
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    sx={{ borderRadius: 2, textTransform: "none" }}
                                    disabled // Placeholder for now
                                >
                                    Download Resume
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Left Column: About, Skills, Contact */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3}>
                            {/* Contact Info */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    ข้อมูลติดต่อ
                                </Typography>
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    {profile?.email && (
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: "primary.light", width: 32, height: 32 }}>
                                                <EmailIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">อีเมล</Typography>
                                                <Typography variant="body2">{profile.email}</Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    {profile?.phone && (
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: "success.light", width: 32, height: 32 }}>
                                                <PhoneIcon sx={{ fontSize: 18, color: "success.main" }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">เบอร์โทรศัพท์</Typography>
                                                <Typography variant="body2">{profile.phone}</Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    {/* Add Address if available in aggregated data (currently not in struct but can be added) */}
                                </Stack>
                            </Paper>

                            {/* Skills */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    ทักษะ
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                                    {skills?.map((skill: string, index: number) => (
                                        <Chip key={index} label={skill} size="small" sx={{ borderRadius: 1 }} />
                                    ))}
                                    {(!skills || skills.length === 0) && (
                                        <Typography variant="body2" color="text.secondary">ไม่ระบุ</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Right Column: Experience, Education, Portfolio */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3}>
                            {/* Experience */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: "warning.light" }}>
                                        <WorkIcon sx={{ color: "warning.main" }} />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold">
                                        ประสบการณ์ทำงาน
                                    </Typography>
                                </Box>
                                <Stack spacing={3}>
                                    {experiences?.map((exp: any, index: number) => (
                                        <Box key={exp.id}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {exp.position}
                                            </Typography>
                                            <Typography variant="body2" color="primary.main" fontWeight="medium">
                                                {exp.company_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                {new Date(exp.start_date).toLocaleDateString("th-TH", { month: "short", year: "numeric" })} -{" "}
                                                {exp.end_date
                                                    ? new Date(exp.end_date).toLocaleDateString("th-TH", { month: "short", year: "numeric" })
                                                    : "ปัจจุบัน"}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {exp.description}
                                            </Typography>
                                            {index < experiences.length - 1 && <Divider sx={{ mt: 3 }} />}
                                        </Box>
                                    ))}
                                    {(!experiences || experiences.length === 0) && (
                                        <Typography variant="body2" color="text.secondary">ไม่ระบุประสบการณ์</Typography>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Education */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: "info.light" }}>
                                        <SchoolIcon sx={{ color: "info.main" }} />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold">
                                        การศึกษา
                                    </Typography>
                                </Box>
                                <Stack spacing={3}>
                                    {educations?.map((edu: any, index: number) => (
                                        <Box key={edu.id}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {edu.institution}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {edu.degree} • {edu.field_of_study}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(edu.start_date).toLocaleDateString("th-TH", { year: "numeric" })} -{" "}
                                                {edu.end_date
                                                    ? new Date(edu.end_date).toLocaleDateString("th-TH", { year: "numeric" })
                                                    : "ปัจจุบัน"}
                                            </Typography>
                                            {index < educations.length - 1 && <Divider sx={{ mt: 3 }} />}
                                        </Box>
                                    ))}
                                    {(!educations || educations.length === 0) && (
                                        <Typography variant="body2" color="text.secondary">ไม่ระบุการศึกษา</Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default ApplicantProfileView;
