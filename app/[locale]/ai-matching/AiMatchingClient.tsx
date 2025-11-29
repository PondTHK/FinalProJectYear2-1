"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Container,
    Typography,
    Card,
    CardContent,
    Chip,
    IconButton,
    Tabs,
    Tab,
    Divider,
    Alert,
    AlertTitle,
    Snackbar,
} from "@mui/material";
import {
    Sparkles,
    Building2,
    CheckCircle,
    User,
    Bookmark,
    MessageSquare,
    Briefcase,
    MapPin,
    Clock,
    Eye,
    Zap,
    Trophy,
    Target,
    RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { userAPI, aiAPI, companyAPI, userJobMatchAPI, userAIScoreAPI, type AIJobMatchResult, type CompanyPostResponse, type AIScoreResponse } from "@/app/lib/api";
import { AiLoadingIndicator } from "@/app/[locale]/jobs/components/AiLoadingIndicator";
import { JobsNavLinks } from "../jobs/components/JobsNavLinks";
import { NavSection } from "@/app/[locale]/jobs/constants";
import { useTranslations } from "next-intl";

interface EnrichedMatchResult extends AIJobMatchResult {
    job_details: CompanyPostResponse;
}

interface AiMatchingClientProps {
    isLoggedIn: boolean;
}

// Profile completion check result
interface ProfileCheckResult {
    canMatch: boolean;
    missingItems: string[];
}

export default function AiMatchingClient({ isLoggedIn }: AiMatchingClientProps) {
    const t = useTranslations("Jobs.aiMatchingPage");
    const router = useRouter();
    const [step, setStep] = useState<"intro" | "loading" | "result">("intro");
    const [results, setResults] = useState<EnrichedMatchResult[]>([]);
    const [selectedJob, setSelectedJob] = useState<EnrichedMatchResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Apply & Save State
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
    const [savingJob, setSavingJob] = useState(false);

    const getDaysAgo = (dateString: string) => {
        if (!dateString) return 0;
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Profile check state - default to false until data is loaded
    const [profileCheck, setProfileCheck] = useState<ProfileCheckResult>({ canMatch: false, missingItems: [] });
    const [dataLoaded, setDataLoaded] = useState(false);

    // Check profile completion on mount
    useEffect(() => {
        if (!isLoggedIn) return;

        const checkProfileCompletion = async () => {
            try {
                const [profileRes, educationsRes, experiencesRes, jobPrefRes] = await Promise.all([
                    userAPI.getProfile(),
                    userAPI.getEducations(),
                    userAPI.getExperiences(),
                    userAPI.getJobPreference(),
                ]);

                const profile = profileRes.ok ? profileRes.data : null;
                const educations = educationsRes.ok && educationsRes.data ? educationsRes.data : [];
                const experiences = experiencesRes.ok && experiencesRes.data ? experiencesRes.data : [];
                const jobPref = jobPrefRes.ok ? jobPrefRes.data : null;

                const missingItems: string[] = [];

                // Check name
                const hasName = (profile?.first_name_th && profile?.last_name_th) ||
                    (profile?.first_name_en && profile?.last_name_en);
                if (!hasName) missingItems.push('ชื่อ-นามสกุล');

                // Check education or experience
                const hasEducationOrExperience = educations.length > 0 || experiences.length > 0;
                if (!hasEducationOrExperience) missingItems.push('ประวัติการศึกษาหรือประสบการณ์ทำงาน');

                // Check job preference
                const hasJobPreference = !!(jobPref?.position && jobPref.position.trim() !== '');
                if (!hasJobPreference) missingItems.push('ตำแหน่งที่สนใจ');

                const canMatch = !!(hasName && hasEducationOrExperience && hasJobPreference);

                setProfileCheck({ canMatch, missingItems });
                setDataLoaded(true);

                // Check for existing matches if profile is complete enough (or just check anyway)
                if (canMatch) {
                    try {
                        const matchesRes = await userJobMatchAPI.getJobMatches();
                        if (matchesRes.ok && matchesRes.data && matchesRes.data.length > 0) {
                            // Found saved matches, now we need job details
                            const jobsResponse = await companyAPI.getAllPosts();
                            const jobsData = jobsResponse.ok && jobsResponse.data ? jobsResponse.data : [];
                            const activeJobs = jobsData.filter((j) => j.status === 'active');

                            const savedMatches = matchesRes.data;

                            const enrichedResults: EnrichedMatchResult[] = savedMatches
                                .map(match => {
                                    const job = activeJobs.find(j => j.id === match.job_id);
                                    if (!job) return null;
                                    return {
                                        job_id: match.job_id,
                                        match_score: match.match_score,
                                        reason: match.analysis || "No analysis available",
                                        location_status: "Unknown", // Default or need to recalculate if needed
                                        job_details: job
                                    };
                                })
                                .filter((item): item is EnrichedMatchResult => item !== null)
                                .sort((a, b) => b.match_score - a.match_score); // Sort by score descending

                            if (enrichedResults.length > 0) {
                                setResults(enrichedResults);
                                setSelectedJob(enrichedResults[0]);
                                setStep("result");
                            }
                        }
                    } catch (matchErr) {
                        console.error("Error fetching saved matches:", matchErr);
                    }
                }

            } catch (err) {
                console.error("Error checking profile:", err);
                setDataLoaded(true);
            }
        };

        checkProfileCompletion();
    }, [isLoggedIn]);

    // Load applied jobs from localStorage
    useEffect(() => {
        if (typeof window !== "undefined" && isLoggedIn) {
            const saved = localStorage.getItem("applied_jobs");
            if (saved) {
                try {
                    const applied = JSON.parse(saved) as string[];
                    setAppliedJobs(new Set(applied));
                } catch (e) {
                    console.error("Failed to load applied jobs", e);
                }
            }
        }
    }, [isLoggedIn]);

    // Load saved jobs from API
    useEffect(() => {
        const fetchSavedJobs = async () => {
            if (!isLoggedIn) return;
            try {
                const response = await userAPI.getSavedJobs();
                if (response.ok && response.data) {
                    const savedPostIds = new Set(response.data.map((sj) => sj.post_id));
                    setSavedJobs(savedPostIds);
                }
            } catch (error) {
                console.error("Failed to load saved jobs", error);
            }
        };
        fetchSavedJobs();
    }, [isLoggedIn]);

    const handleApply = async () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }

        if (!selectedJob?.job_details.id) return;

        const jobId = selectedJob.job_details.id;

        if (appliedJobs.has(jobId)) {
            setNotificationMessage(`คุณได้สมัครงานที่ ${selectedJob.job_details.company_id} ไปแล้ว`);
            setNotificationOpen(true);
            return;
        }

        try {
            const response = await userAPI.applyJob(jobId);

            if (response.ok) {
                // Add to applied jobs list
                const newAppliedJobs = new Set(appliedJobs);
                newAppliedJobs.add(jobId);
                setAppliedJobs(newAppliedJobs);

                // Save to localStorage as backup/cache
                if (typeof window !== "undefined") {
                    localStorage.setItem("applied_jobs", JSON.stringify(Array.from(newAppliedJobs)));
                }

                setNotificationMessage(`สมัครงานตำแหน่ง ${selectedJob.job_details.title} เรียบร้อยแล้ว`);
                setNotificationOpen(true);

                // Redirect after delay
                setTimeout(() => {
                    router.push(`/companies/${selectedJob.job_details.company_id}`);
                }, 1500);
            } else {
                throw new Error(response.data?.message || "Failed to apply");
            }
        } catch (error) {
            console.error("Error applying for job:", error);
            setNotificationMessage("เกิดข้อผิดพลาดในการสมัครงาน กรุณาลองใหม่อีกครั้ง");
            setNotificationOpen(true);
        }
    };

    const handleSaveJob = async () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }

        if (!selectedJob?.job_details.id) return;

        const jobId = selectedJob.job_details.id;
        const isSaved = savedJobs.has(jobId);
        setSavingJob(true);

        try {
            if (isSaved) {
                const response = await userAPI.unsaveJob(jobId);
                if (response.ok) {
                    const newSavedJobs = new Set(savedJobs);
                    newSavedJobs.delete(jobId);
                    setSavedJobs(newSavedJobs);
                    setNotificationMessage(`ยกเลิกการบันทึกงานแล้ว`);
                    setNotificationOpen(true);
                }
            } else {
                const response = await userAPI.saveJob(jobId);
                if (response.ok) {
                    const newSavedJobs = new Set(savedJobs);
                    newSavedJobs.add(jobId);
                    setSavedJobs(newSavedJobs);
                    setNotificationMessage(`บันทึกงานแล้ว`);
                    setNotificationOpen(true);
                }
            }
        } catch (error) {
            console.error("Save job error", error);
            setNotificationMessage("เกิดข้อผิดพลาดในการบันทึกงาน");
            setNotificationOpen(true);
        } finally {
            setSavingJob(false);
        }
    };

    const handleSectionChange = (section: NavSection) => {
        if (section === "ai-matching") return;
        router.push(`/jobs?section=${section}`);
    };

    const handleRunAiMatch = async () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }

        // Wait for data to be loaded first
        if (!dataLoaded) {
            return;
        }

        // Check if profile is complete
        if (!profileCheck.canMatch) {
            // Alert is already shown, just return
            return;
        }

        setError(null);
        setStep("loading");

        try {
            // Fetch user data including skills
            const [profileRes, addressRes, educationsRes, experienceRes, jobPrefRes, skillsRes] = await Promise.all([
                userAPI.getProfile(),
                userAPI.getAddress(),
                userAPI.getEducations(),
                userAPI.getExperiences(),
                userAPI.getJobPreference(),
                userAPI.getSkills(),
            ]);

            // Fetch jobs using companyAPI
            const jobsResponse = await companyAPI.getAllPosts();
            const jobsData = jobsResponse.ok && jobsResponse.data ? jobsResponse.data : [];
            const activeJobs = jobsData.filter((j) => j.status === 'active');

            const profile = profileRes.ok ? profileRes.data : null;
            const address = addressRes.ok ? addressRes.data : null;
            const educationsList = educationsRes.ok && educationsRes.data ? educationsRes.data : [];
            const experienceList = experienceRes.ok && experienceRes.data ? experienceRes.data : [];
            const jobPref = jobPrefRes.ok ? jobPrefRes.data : null;
            const userSkills = skillsRes.ok && skillsRes.data?.skills ? skillsRes.data.skills : [];

            // Try to get AI Score data from backend (if user has done AI analysis)
            let aiScoreData: AIScoreResponse | null = null;
            try {
                const aiScoreRes = await userAIScoreAPI.getScore();
                if (aiScoreRes.ok && aiScoreRes.data) {
                    aiScoreData = aiScoreRes.data as unknown as AIScoreResponse;
                }
            } catch (e) {
                console.log("No AI Score data found");
            }

            const userProfilePayload = {
                name: profile
                    ? `${profile.first_name_en || profile.first_name_th || ""} ${profile.last_name_en || profile.last_name_th || ""}`.trim()
                    : "",
                phone: profile?.phone || "",
                email: profile?.email || "",
                address: address
                    ? [address.subdistrict, address.district, address.province, address.postal_code]
                        .filter(Boolean)
                        .join(", ")
                    : "",
                education: educationsList
                    .map((edu) => `${edu.degree} - ${edu.major} @ ${edu.school}`)
                    .join(" | "),
                experience: experienceList
                    .map((exp) => `${exp.position} @ ${exp.company}`)
                    .join(" | "),
                // User's skills from database
                skills: userSkills,
                job_preferences: jobPref ? {
                    industry: jobPref.industry,
                    position: jobPref.position,
                    work_time: jobPref.work_time
                } : null,
                // Include AI Score data if available
                ai_score: aiScoreData ? {
                    score: aiScoreData.score,
                    level: aiScoreData.level,
                    recommended_position: aiScoreData.recommended_position,
                    recommended_skills: aiScoreData.recommended_skills,
                    analysis: aiScoreData.analysis,
                } : null
            };

            const jobPostsPayload = activeJobs.map((job) => ({
                id: job.id,
                title: job.title,
                company: job.company_id,
                company_id: job.company_id,
                location: job.location,
                description: job.description,
                salary_range: job.salary_range,
                tags: job.tags,
            }));

            const matchResponse = await aiAPI.matchJobs({
                user_profile: userProfilePayload as any,
                job_posts: jobPostsPayload as any,
            });

            // Enrich results with job details and filter out missing jobs
            const enrichedResults: EnrichedMatchResult[] = (matchResponse.matches || [])
                .map(match => {
                    const job = activeJobs.find(j => j.id === match.job_id);
                    if (!job) return null;
                    return {
                        ...match,
                        job_details: job
                    };
                })
                .filter((item): item is EnrichedMatchResult => item !== null)
                .sort((a, b) => b.match_score - a.match_score); // Sort by score descending

            setResults(enrichedResults);
            if (enrichedResults.length > 0) {
                setSelectedJob(enrichedResults[0]);

                // Save matches to database
                try {
                    const matchesToSave = enrichedResults.map(match => ({
                        job_id: match.job_id,
                        match_score: Math.round(match.match_score),
                        analysis: match.reason
                    }));

                    await userJobMatchAPI.saveJobMatches(matchesToSave);
                    console.log("Matches saved successfully");
                } catch (saveError) {
                    console.error("Failed to save matches:", saveError);
                    // Don't block the UI if saving fails, but maybe log it
                }
            }
            setStep("result");

        } catch (error) {
            console.error("AI Match error", error);
            setError("ไม่สามารถจับคู่งานได้ กรุณาลองใหม่อีกครั้ง");
            setStep("intro");
        }
    };

    return (
        <Box className="min-h-screen bg-[#F6F7F9] relative overflow-x-hidden">
            {/* Navigation */}
            <Box className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <Container maxWidth="lg">
                    <JobsNavLinks
                        section="ai-matching"
                        onSectionChange={handleSectionChange}
                        isLoggedIn={isLoggedIn}
                    />
                </Container>
            </Box>

            <Container maxWidth="lg" className="py-12">
                {step === "intro" && (
                    <Box className="flex flex-col items-center justify-center min-h-[70vh] max-w-5xl mx-auto px-4">


                        {/* Headline */}
                        <Typography variant="h2" fontWeight={800} className="text-center mb-4 text-slate-900 leading-tight" dangerouslySetInnerHTML={{ __html: t.raw("headline") }} />

                        {/* Subheadline */}
                        <Typography variant="body1" className="text-center text-slate-500 max-w-2xl mb-12 text-lg leading-relaxed">
                            {t("subheadline")}
                        </Typography>

                        {/* Feature Cards */}
                        <div className="grid md:grid-cols-3 gap-6 w-full mb-12">
                            {[
                                {
                                    icon: <Target className="text-blue-500" size={24} />,
                                    bg: "bg-blue-50",
                                    title: t("features.precision.title"),
                                    desc: t("features.precision.desc")
                                },
                                {
                                    icon: <Zap className="text-indigo-500" size={24} />,
                                    bg: "bg-indigo-50",
                                    title: t("features.instant.title"),
                                    desc: t("features.instant.desc")
                                },
                                {
                                    icon: <Trophy className="text-purple-500" size={24} />,
                                    bg: "bg-purple-50",
                                    title: t("features.growth.title"),
                                    desc: t("features.growth.desc")
                                }
                            ].map((feature, idx) => (
                                <Card key={idx} elevation={0} className="border border-slate-100 hover:shadow-lg transition-shadow duration-300">
                                    <CardContent className="p-6 flex flex-col items-start text-left h-full">
                                        <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-4`}>
                                            {feature.icon}
                                        </div>
                                        <Typography variant="h6" fontWeight={700} className="mb-2 text-slate-800">
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" className="text-slate-500">
                                            {feature.desc}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Profile Incomplete Alert - Show when data loaded and profile incomplete */}
                        {dataLoaded && !profileCheck.canMatch && (
                            <Alert
                                severity="warning"
                                sx={{
                                    mb: 4,
                                    width: '100%',
                                    maxWidth: 600,
                                    borderRadius: 3,
                                    '& .MuiAlert-icon': { alignItems: 'center' }
                                }}
                            >
                                <AlertTitle sx={{ fontWeight: 700 }}>
                                    {t("alert.title")}
                                </AlertTitle>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {t("alert.missing")}
                                </Typography>
                                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                    {profileCheck.missingItems.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </Box>
                                <Button
                                    size="small"
                                    href="/onboarding"
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    {t("alert.button")}
                                </Button>
                            </Alert>
                        )}

                        {error && (
                            <Typography color="error" className="bg-red-50 p-3 rounded-lg border border-red-200 mb-6">
                                {t("error")}
                            </Typography>
                        )}

                        {/* CTA Button */}
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleRunAiMatch}
                            disabled={!isLoggedIn ? false : (!dataLoaded || !profileCheck.canMatch)}
                            startIcon={<Sparkles size={18} />}
                            sx={{
                                borderRadius: 999,
                                px: 5,
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                bgcolor: (!isLoggedIn || (dataLoaded && profileCheck.canMatch)) ? '#0f172a' : '#9ca3af',
                                color: 'white',
                                boxShadow: (!isLoggedIn || (dataLoaded && profileCheck.canMatch))
                                    ? '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
                                    : 'none',
                                '&:hover': {
                                    bgcolor: (!isLoggedIn || (dataLoaded && profileCheck.canMatch)) ? '#1e293b' : '#9ca3af',
                                    transform: (!isLoggedIn || (dataLoaded && profileCheck.canMatch)) ? 'translateY(-2px)' : 'none',
                                    boxShadow: (!isLoggedIn || (dataLoaded && profileCheck.canMatch))
                                        ? '0 15px 30px -5px rgba(15, 23, 42, 0.4)'
                                        : 'none',
                                },
                                '&.Mui-disabled': {
                                    bgcolor: '#9ca3af',
                                    color: 'rgba(255,255,255,0.7)',
                                },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {!dataLoaded && isLoggedIn ? t("cta.checking") :
                                (dataLoaded && !profileCheck.canMatch && isLoggedIn) ? t("cta.incomplete") :
                                    t("cta.start")}
                        </Button>
                    </Box>
                )}

                {step === "loading" && (
                    <Box className="flex flex-col items-center justify-center min-h-[60vh]">
                        <AiLoadingIndicator />
                    </Box>
                )}

                {step === "result" && (
                    <Box className="grid md:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                        {/* LEFT SIDEBAR - JOB LIST */}
                        <Box className="md:col-span-5 lg:col-span-4 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <Typography variant="h6" fontWeight="bold">
                                    {t("results.matchesFound", { count: results.length })}
                                </Typography>
                                <Button
                                    variant="text"
                                    size="small"
                                    startIcon={<RefreshCw size={16} />}
                                    onClick={handleRunAiMatch}
                                    sx={{
                                        textTransform: 'none',
                                        color: 'text.secondary',
                                        '&:hover': { color: 'primary.main', bgcolor: 'primary.50' }
                                    }}
                                >
                                    {t("results.rematch")}
                                </Button>
                            </div>

                            {results.map((match: EnrichedMatchResult, index: number) => {
                                const isSelected = selectedJob?.job_id === match.job_id;
                                return (
                                    <Card
                                        key={index}
                                        elevation={0}
                                        onClick={() => setSelectedJob(match)}
                                        sx={{
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            border: '1px solid',
                                            borderColor: isSelected ? 'transparent' : 'rgba(0,0,0,0.08)',
                                            background: isSelected
                                                ? '#f8fafc' // Light gray for selected
                                                : 'white',
                                            color: 'inherit',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${isSelected ? 'bg-white border border-gray-200' : 'bg-gray-50 text-gray-600'}`}>
                                                    <Building2 size={24} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Typography variant="subtitle1" fontWeight="bold" className="truncate">
                                                        {match.job_details.title}
                                                    </Typography>
                                                    <Typography variant="body2" className={`truncate ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
                                                        {match.job_details.company_id}
                                                    </Typography>

                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Sparkles size={14} className={isSelected ? 'text-yellow-300' : 'text-purple-500'} />
                                                        <Typography variant="caption" fontWeight="bold" className="text-purple-600">
                                                            {t("results.matchScore", { score: Math.round(match.match_score) })}
                                                        </Typography>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <div className={`text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600`}>
                                                            {match.job_details.salary_range || 'Negotiable'}
                                                        </div>
                                                        <div className={`text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600`}>
                                                            {match.job_details.location}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>

                        {/* RIGHT PANEL - JOB DETAILS */}
                        <Box className="md:col-span-7 lg:col-span-8 h-full overflow-y-auto custom-scrollbar rounded-3xl bg-white border border-gray-200 shadow-sm">
                            {selectedJob ? (
                                <>
                                    {/* Header Section */}
                                    <Box sx={{
                                        bgcolor: 'white',
                                        color: 'text.primary',
                                        p: 4,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }}>
                                        <Box className="relative z-10 flex flex-col md:flex-row gap-6">
                                            <Box className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                <Building2 size={40} className="text-indigo-600" />
                                            </Box>

                                            <Box className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Typography variant="h4" fontWeight="bold" className="mb-1">
                                                            {selectedJob.job_details.title}
                                                        </Typography>
                                                        <div className="flex items-center gap-2 text-gray-500 mb-4">
                                                            <Typography variant="h6">
                                                                {selectedJob.job_details.company_id}
                                                            </Typography>
                                                            <CheckCircle size={18} className="text-blue-200" />
                                                        </div>
                                                    </div>
                                                    <IconButton sx={{ color: 'text.secondary', bgcolor: 'action.hover' }}>
                                                        <Bookmark size={20} />
                                                    </IconButton>
                                                </div>

                                                <div className="flex flex-wrap gap-3 mb-6">
                                                    <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg border border-yellow-100">
                                                        <Sparkles size={16} className="text-yellow-600" />
                                                        <span className="font-bold">{t("results.similarity", { score: Math.round(selectedJob.match_score) })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
                                                        <MessageSquare size={16} />
                                                        <span className="text-sm">{selectedJob.reason}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="contained"
                                                        size="large"
                                                        onClick={handleApply}
                                                        disabled={appliedJobs.has(selectedJob.job_details.id)}
                                                        sx={{
                                                            bgcolor: appliedJobs.has(selectedJob.job_details.id) ? '#9ca3af' : '#4f46e5',
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            px: 4,
                                                            borderRadius: 2,
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                            '&:hover': { bgcolor: appliedJobs.has(selectedJob.job_details.id) ? '#9ca3af' : '#4338ca' }
                                                        }}
                                                    >
                                                        {appliedJobs.has(selectedJob.job_details.id) ? t("results.applied") : t("results.apply")}
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="large"
                                                        onClick={handleSaveJob}
                                                        disabled={savingJob}
                                                        startIcon={savedJobs.has(selectedJob.job_details.id) ? <CheckCircle size={18} /> : <Bookmark size={18} />}
                                                        sx={{
                                                            bgcolor: savedJobs.has(selectedJob.job_details.id) ? '#dcfce7' : '#10b981',
                                                            color: savedJobs.has(selectedJob.job_details.id) ? '#166534' : 'white',
                                                            fontWeight: 'bold',
                                                            px: 4,
                                                            borderRadius: 2,
                                                            '&:hover': {
                                                                bgcolor: savedJobs.has(selectedJob.job_details.id) ? '#bbf7d0' : '#059669'
                                                            }
                                                        }}
                                                    >
                                                        {savedJobs.has(selectedJob.job_details.id) ? t("results.saved") : t("results.save")}
                                                    </Button>
                                                </div>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 3 }} />

                                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex gap-2 flex-wrap">
                                                {selectedJob.job_details.tags && selectedJob.job_details.tags.length > 0 ? (
                                                    selectedJob.job_details.tags.map((tag) => (
                                                        <Chip
                                                            key={tag}
                                                            label={tag}
                                                            icon={<Sparkles size={14} className="text-white" />}
                                                            sx={{
                                                                bgcolor: 'white',
                                                                color: 'text.primary',
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                                '& .MuiChip-icon': { color: 'primary.main' }
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Chip
                                                        label="General"
                                                        sx={{
                                                            bgcolor: 'white',
                                                            color: 'text.primary',
                                                            border: '1px solid',
                                                            borderColor: 'divider'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Eye size={16} /> 1438
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User size={16} /> 15
                                                </div>
                                            </div>
                                        </div>

                                        {/* Decorative circles removed for cleaner look */}
                                    </Box>

                                    {/* Content Tabs */}
                                    <Box className="border-b border-gray-200 px-4">
                                        <Tabs value={0} textColor="primary" indicatorColor="primary">
                                            <Tab label={t("results.jobDetails")} sx={{ textTransform: 'none', fontSize: '1rem' }} />
                                            <Tab label={t("results.companyInfo")} sx={{ textTransform: 'none', fontSize: '1rem' }} />
                                        </Tabs>
                                    </Box>

                                    {/* Details Content */}
                                    <Box className="p-6 space-y-8">
                                        {/* Key Stats */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <Typography variant="h5" fontWeight="bold" className="mb-4 text-gray-800">
                                                    {selectedJob.job_details.salary_range || 'Negotiable'}
                                                </Typography>
                                                <div className="flex flex-wrap gap-4 text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase size={18} />
                                                        <span>{selectedJob.job_details.job_type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={18} />
                                                        <span>{selectedJob.job_details.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-start text-gray-400 text-sm">
                                                <Clock size={16} className="mr-1" /> {t("results.posted", { days: getDaysAgo(selectedJob.job_details.created_at) })}
                                            </div>
                                        </div>

                                        <Divider />

                                        {/* Description */}
                                        <div>
                                            <Typography variant="h6" fontWeight="bold" className="mb-3">
                                                {t("results.jobDetails")}
                                            </Typography>
                                            <Typography variant="body1" className="text-gray-600 leading-relaxed whitespace-pre-line">
                                                {selectedJob.job_details.description || "No description provided."}
                                            </Typography>
                                        </div>

                                        {/* Responsibilities (Mock data if not in API) */}
                                        <div>
                                            <Typography variant="h6" fontWeight="bold" className="mb-3">
                                                {t("results.responsibilities")}
                                            </Typography>
                                            {selectedJob.job_details.responsibilities ? (
                                                <ul className="list-disc list-inside space-y-2 text-gray-600">
                                                    {selectedJob.job_details.responsibilities.split('\n').map((item, idx) => (
                                                        <li key={idx}>{item.replace(/^[•-]\s*/, '')}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <Typography variant="body2" className="text-gray-500 italic">
                                                    No specific responsibilities listed.
                                                </Typography>
                                            )}
                                        </div>
                                    </Box>
                                </>
                            ) : (
                                <Box className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                                    <div className="bg-gray-100 p-6 rounded-full mb-4">
                                        <Sparkles size={48} className="text-gray-300" />
                                    </div>
                                    <Typography variant="h6">{t("results.selectJob")}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Container>

            <Snackbar
                open={notificationOpen}
                autoHideDuration={3000}
                onClose={() => setNotificationOpen(false)}
                message={notificationMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                ContentProps={{
                    sx: {
                        bgcolor: '#1e293b',
                        color: 'white',
                        borderRadius: 2,
                        fontWeight: 500
                    }
                }}
            />
        </Box>
    );
}
