"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Chip,
    Stack,
    CircularProgress,
    Divider,
    Paper,
    Tabs,
    Tab,
    Avatar,
    Card,
    CardContent,
} from "@mui/material";
import {
    School as SchoolIcon,
    Work as WorkIcon,
    EmojiEvents as SkillIcon,
    LocationOn as LocationIcon,
    ContactMail as ContactIcon,
    Language as WebsiteIcon,
    Description as PortfolioIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Cake as CakeIcon,
    Wc as GenderIcon,
} from "@mui/icons-material";
import {
    userAPI,
    adminAPI,
    type UserProfileResponse,
    type UserEducationResponse,
    type UserExperienceResponse,
    type UserJobPreferenceResponse,
    type UserAddressResponse,
    type UserPortfolioResponse,
} from "../../../../app/lib/api";

interface UserDetailViewProps {
    userId: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`user-tabpanel-${index}`}
            aria-labelledby={`user-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 4 }}>{children}</Box>}
        </div>
    );
}

export default function UserDetailView({ userId }: UserDetailViewProps) {
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [educations, setEducations] = useState<UserEducationResponse[]>([]);
    const [experiences, setExperiences] = useState<UserExperienceResponse[]>([]);
    const [jobPreferences, setJobPreferences] = useState<UserJobPreferenceResponse[]>([]);
    const [address, setAddress] = useState<UserAddressResponse | null>(null);
    const [portfolios, setPortfolios] = useState<UserPortfolioResponse[]>([]);
    const [skills, setSkills] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [
                    profileRes,
                    educationsRes,
                    experiencesRes,
                    addressRes,
                    portfoliosRes,
                    skillsRes
                ] = await Promise.all([
                    userAPI.getProfileByUserId(userId),
                    userAPI.getEducationsByUserId(userId),
                    userAPI.getExperiencesByUserId(userId),
                    userAPI.getAddressByUserId(userId),
                    userAPI.getPortfoliosByUserId(userId),
                    adminAPI.getSkillsByUserId(userId),
                ]);
                const jobPrefRes = await userAPI.getJobPreferenceByUserId(userId as string);
                if (jobPrefRes.ok) setJobPreferences(jobPrefRes.data);

                if (profileRes.ok && profileRes.data) setProfile(profileRes.data);
                if (educationsRes.ok && educationsRes.data) setEducations(educationsRes.data);
                if (experiencesRes.ok && experiencesRes.data) setExperiences(experiencesRes.data);
                if (addressRes.ok && addressRes.data) setAddress(addressRes.data);
                if (portfoliosRes.ok && portfoliosRes.data) setPortfolios(portfoliosRes.data);
                if (skillsRes.ok && skillsRes.data && skillsRes.data.skills) setSkills(skillsRes.data.skills);

            } catch (error) {
                console.error("Failed to fetch user details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    const fullName = profile?.first_name_th && profile?.last_name_th
        ? `${profile.first_name_th} ${profile.last_name_th}`
        : profile?.first_name_en && profile?.last_name_en
            ? `${profile.first_name_en} ${profile.last_name_en}`
            : "ไม่ระบุชื่อ";

    return (
        <Box sx={{ width: "100%" }}>
            {/* Profile Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 5,
                    mb: 4,
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                    boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative circles */}
                <Box sx={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)" }} />
                <Box sx={{ position: "absolute", bottom: -30, left: 50, width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)" }} />

                <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="center" position="relative">
                    <Avatar
                        src={profile?.profile_image_url || undefined}
                        sx={{
                            width: 140,
                            height: 140,
                            bgcolor: "rgba(255,255,255,0.2)",
                            fontSize: "3rem",
                            border: "4px solid white",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                        }}
                    >
                        {fullName.charAt(0)}
                    </Avatar>
                    <Box flex={1} textAlign={{ xs: "center", md: "left" }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5, textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                            {fullName}
                        </Typography>
                        {profile?.first_name_en && profile?.last_name_en && (profile.first_name_th || profile.last_name_th) && (
                            <Typography variant="h5" sx={{ opacity: 0.9, mb: 1, fontWeight: "medium" }}>
                                {profile.first_name_en} {profile.last_name_en}
                            </Typography>
                        )}
                        <Typography variant="h6" sx={{ opacity: 0.9, mb: 2, fontWeight: "medium" }}>
                            {profile?.title || "ไม่ระบุตำแหน่ง"}
                        </Typography>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={3}
                            justifyContent={{ xs: "center", md: "flex-start" }}
                            sx={{ opacity: 0.9 }}
                        >
                            {profile?.email && (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <EmailIcon fontSize="small" />
                                    <Typography variant="body1">{profile.email}</Typography>
                                </Box>
                            )}
                            {profile?.phone && (
                                <Box display="flex" alignItems="center" gap={1}>
                                    <PhoneIcon fontSize="small" />
                                    <Typography variant="body1">{profile.phone}</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="user details tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        "& .MuiTab-root": {
                            textTransform: "none",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            minHeight: 56,
                        }
                    }}
                >
                    <Tab label="ข้อมูลส่วนตัว" icon={<PersonIcon />} iconPosition="start" />
                    <Tab label="การศึกษา & ประสบการณ์" icon={<WorkIcon />} iconPosition="start" />
                    <Tab label="ทักษะ & ผลงาน" icon={<SkillIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            {/* Personal Info Tab */}
            <CustomTabPanel value={tabValue} index={0}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", height: "100%" }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: "#eff6ff", color: "#3b82f6" }}>
                                        <ContactIcon />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold">
                                        ข้อมูลติดต่อ
                                    </Typography>
                                </Box>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">อีเมล</Typography>
                                        <Typography variant="body1" fontWeight="medium">{profile?.email || "-"}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">เบอร์โทรศัพท์</Typography>
                                        <Typography variant="body1" fontWeight="medium">{profile?.phone || "-"}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">วันเกิด</Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">เพศ</Typography>
                                        <Typography variant="body1" fontWeight="medium">{profile?.gender || "-"}</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={4} height="100%">
                            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                                        <Avatar sx={{ bgcolor: "#fef2f2", color: "#ef4444" }}>
                                            <LocationIcon />
                                        </Avatar>
                                        <Typography variant="h6" fontWeight="bold">
                                            ที่อยู่
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" color="text.secondary" lineHeight={1.6}>
                                        {[
                                            address?.address_detail,
                                            address?.subdistrict,
                                            address?.district,
                                            address?.province,
                                            address?.postal_code
                                        ].filter(Boolean).join(" ") || "ไม่ระบุที่อยู่"}
                                    </Typography>
                                </CardContent>
                            </Card>

                            {jobPreferences.length > 0 && (
                                <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", flexGrow: 1 }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                                            <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}>
                                                <WorkIcon />
                                            </Avatar>
                                            <Typography variant="h6" fontWeight="bold">
                                                ความสนใจงาน ({jobPreferences.length})
                                            </Typography>
                                        </Box>

                                        {jobPreferences.length > 0 ? (
                                            <Stack spacing={3}>
                                                {jobPreferences.map((pref, index) => (
                                                    <Box key={pref.id || index}>
                                                        {index > 0 && <Divider sx={{ mb: 3 }} />}
                                                        <Grid container spacing={3}>
                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>ตำแหน่ง</Typography>
                                                                <Typography variant="body1" fontWeight="bold">{pref.position}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>อุตสาหกรรม</Typography>
                                                                <Typography variant="body1">{pref.industry || "-"}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>รูปแบบงาน</Typography>
                                                                <Typography variant="body1">{pref.work_time || "-"}</Typography>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                                ไม่มีข้อมูลความสนใจงาน
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </CustomTabPanel>

            {/* Education & Experience Tab */}
            <CustomTabPanel value={tabValue} index={1}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", height: "100%" }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={4}>
                                    <Avatar sx={{ bgcolor: "#fff7ed", color: "#f97316", width: 48, height: 48 }}>
                                        <WorkIcon />
                                    </Avatar>
                                    <Typography variant="h5" fontWeight="bold">
                                        ประสบการณ์ทำงาน
                                    </Typography>
                                </Box>
                                {experiences.length > 0 ? (
                                    <Stack spacing={4}>
                                        {experiences.map((exp, index) => (
                                            <Box key={index} sx={{ position: "relative", pl: 3, borderLeft: "2px solid #e5e7eb" }}>
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        left: -9,
                                                        top: 0,
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: "50%",
                                                        bgcolor: "#f97316",
                                                        border: "3px solid white",
                                                        boxShadow: "0 0 0 2px #ffedd5",
                                                    }}
                                                />
                                                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                                    {exp.position}
                                                </Typography>
                                                <Typography variant="subtitle1" color="primary.main" fontWeight="medium" gutterBottom>
                                                    {exp.company}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "inline-block", mb: 2, bgcolor: "#f3f4f6", px: 1.5, py: 0.5, borderRadius: 1 }}>
                                                    {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : "ปัจจุบัน"}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                                    {exp.description}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                        ไม่มีข้อมูลประสบการณ์ทำงาน
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", height: "100%" }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={4}>
                                    <Avatar sx={{ bgcolor: "#ecfdf5", color: "#10b981", width: 48, height: 48 }}>
                                        <SchoolIcon />
                                    </Avatar>
                                    <Typography variant="h5" fontWeight="bold">
                                        การศึกษา
                                    </Typography>
                                </Box>
                                {educations.length > 0 ? (
                                    <Stack spacing={4}>
                                        {educations.map((edu, index) => (
                                            <Box key={index} sx={{ position: "relative", pl: 3, borderLeft: "2px solid #e5e7eb" }}>
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        left: -9,
                                                        top: 0,
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: "50%",
                                                        bgcolor: "#10b981",
                                                        border: "3px solid white",
                                                        boxShadow: "0 0 0 2px #d1fae5",
                                                    }}
                                                />
                                                <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                                    {edu.school}
                                                </Typography>
                                                <Typography variant="subtitle1" color="text.primary" fontWeight="medium" gutterBottom>
                                                    {edu.degree} {edu.major && `• ${edu.major}`}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "inline-block", mb: 2, bgcolor: "#f3f4f6", px: 1.5, py: 0.5, borderRadius: 1 }}>
                                                    {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : "ปัจจุบัน"}
                                                </Typography>
                                                {edu.description && (
                                                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                                        {edu.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                        ไม่มีข้อมูลการศึกษา
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </CustomTabPanel>

            {/* Skills & Portfolio Tab */}
            <CustomTabPanel value={tabValue} index={2}>
                <Grid container spacing={4}>
                    <Grid size={12}>
                        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar sx={{ bgcolor: "#fffbeb", color: "#f59e0b" }}>
                                        <SkillIcon />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="bold">
                                        ทักษะ (Skills)
                                    </Typography>
                                </Box>
                                {skills.length > 0 ? (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
                                        {skills.map((skill, index) => (
                                            <Chip
                                                key={index}
                                                label={skill}
                                                sx={{
                                                    borderRadius: 2,
                                                    bgcolor: "#f0f9ff",
                                                    color: "#0369a1",
                                                    fontWeight: "medium",
                                                    border: "1px solid #e0f2fe",
                                                    fontSize: "0.95rem",
                                                    py: 0.5
                                                }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary">ไม่มีข้อมูลทักษะ</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={12}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                            <PortfolioIcon color="info" /> ผลงาน (Portfolios)
                        </Typography>
                        {portfolios.length > 0 ? (
                            <Grid container spacing={3}>
                                {portfolios.map((portfolio, index) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", height: "100%", display: "flex", flexDirection: "column" }}>
                                            {portfolio.image_url && (
                                                <Box
                                                    component="img"
                                                    src={portfolio.image_url}
                                                    alt={portfolio.title}
                                                    sx={{
                                                        width: "100%",
                                                        height: 200,
                                                        objectFit: "cover",
                                                        bgcolor: "grey.100"
                                                    }}
                                                />
                                            )}
                                            <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                                    {portfolio.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" paragraph sx={{
                                                    flexGrow: 1,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    lineHeight: 1.6
                                                }}>
                                                    {portfolio.description}
                                                </Typography>
                                                {portfolio.link && (
                                                    <Box mt={2}>
                                                        <Chip
                                                            icon={<WebsiteIcon fontSize="small" />}
                                                            label="ดูผลงาน"
                                                            component="a"
                                                            href={portfolio.link}
                                                            target="_blank"
                                                            clickable
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ cursor: "pointer" }}
                                                        />
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                                <CardContent sx={{ p: 4, textAlign: "center" }}>
                                    <Typography color="text.secondary">
                                        ไม่มีข้อมูลผลงาน
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </CustomTabPanel>
        </Box>
    );
}
