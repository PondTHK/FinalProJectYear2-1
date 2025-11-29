"use client";

import React, {
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Drawer,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    Search,
    SlidersHorizontal,
    Bookmark,
    Building2,
    MapPin,
    ShieldCheck,
    Lock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    User,
    Sparkles,
} from "lucide-react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { TranslatedSection } from "@/app/[locale]/jobs/components/TranslatedSection";
import { useTranslations } from "next-intl";

import type {
    JobCardData,
    JobLevel,
    JobType,
    SortOption,
    WorkMode,
} from "@/app/lib/jobs";
import { SAMPLE_JOBS } from "@/app/lib/jobs";

import { NavSection, isNavSection } from "./constants";
import { EmptyState } from "./components/EmptyState";
import { SectionPlaceholder } from "./components/SectionPlaceholder";
import { StatPill } from "./components/StatPill";
import { pillSX } from "./pillStyles";
import { getApplicants } from "./utils";
import { companyAPI, aiAPI, userAPI, userJobMatchAPI, userAIScoreAPI, jobApplicationAPI, type CompanyPostResponse, type AIJobMatchResult, type UserJobMatchPayload, type JobApplicationResponse } from "@/app/lib/api";
import { adsAPI, type Ad } from "@/app/lib/adsAPI";
import AdCard from "@/app/Components/AdCard";
import { Snackbar, Alert as MuiAlert } from "@mui/material";
import JobsNearMe from "./components/JobsNearMe";
import { JobsNavLinks } from "./components/JobsNavLinks";

// Fallback component for Suspense
function JobsPageFallback() {
    const t = useTranslations("Jobs.client");
    return <Box className="p-8 text-center">{t("loading")}</Box>;
}

const AiLoaderWrapper = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    gap: "2rem",
    ".ai-orb": {
        position: "relative",
        width: "120px",
        height: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    ".orb-core": {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)",
        zIndex: 10,
        animation: "pulse-core 2s ease-in-out infinite",
    },
    ".orb-ring": {
        position: "absolute",
        borderRadius: "50%",
        border: "2px solid rgba(99, 102, 241, 0.3)",
        boxSizing: "border-box",
    },
    ".ring-1": {
        width: "100%",
        height: "100%",
        borderTopColor: "#a855f7",
        animation: "spin 3s linear infinite",
    },
    ".ring-2": {
        width: "85%",
        height: "85%",
        borderBottomColor: "#6366f1",
        animation: "spin-reverse 4s linear infinite",
    },
    ".ring-3": {
        width: "130%",
        height: "130%",
        border: "1px dashed rgba(168, 85, 247, 0.2)",
        animation: "spin 8s linear infinite",
    },
    ".loading-text": {
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "1.1rem",
        fontWeight: 500,
        color: "#475569",
        textAlign: "center",
        minHeight: "1.5em",
        animation: "fade-in-up 0.5s ease-out",
    },
    "@keyframes pulse-core": {
        "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)" },
        "50%": { transform: "scale(1.1)", boxShadow: "0 0 50px rgba(99, 102, 241, 0.8)" },
    },
    "@keyframes spin": {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
    },
    "@keyframes spin-reverse": {
        "0%": { transform: "rotate(360deg)" },
        "100%": { transform: "rotate(0deg)" },
    },
    "@keyframes fade-in-up": {
        "0%": { opacity: 0, transform: "translateY(10px)" },
        "100%": { opacity: 1, transform: "translateY(0)" },
    },
}));

const AiMatchingLoader = () => {
    const t = useTranslations("Jobs.client");
    const [messageIndex, setMessageIndex] = useState(0);

    const messages = [
        t("aiLoader.0"),
        t("aiLoader.1"),
        t("aiLoader.2"),
        t("aiLoader.3"),
        t("aiLoader.4")
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <AiLoaderWrapper>
            <div className="ai-orb">
                <div className="orb-ring ring-3" />
                <div className="orb-ring ring-1" />
                <div className="orb-ring ring-2" />
                <div className="orb-core" />
            </div>
            <div className="loading-text">
                {messages[messageIndex]}
            </div>
        </AiLoaderWrapper>
    );
};


interface JobsClientProps {
    isLoggedIn: boolean;
}

export default function JobsClient({ isLoggedIn }: JobsClientProps): React.ReactElement {
    return (
        <Suspense fallback={<JobsPageFallback />}>
            <JobsPageContent isLoggedIn={isLoggedIn} />
        </Suspense>
    );
}

function JobsPageContent({ isLoggedIn }: { isLoggedIn: boolean }): React.ReactElement {
    const root = useRef<HTMLDivElement | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tClient = useTranslations("Jobs.client");

    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState<JobType | "All">("All");
    const [level, setLevel] = useState<JobLevel | "All">("All");
    const [mode, setMode] = useState<WorkMode | "All">("All");
    const [sort, setSort] = useState<SortOption>("recent");
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState<"desc" | "company">("desc");
    const [openFilters, setOpenFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<JobCardData[]>([]);
    const [ads, setAds] = useState<Ad[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsError, setJobsError] = useState<string | null>(null);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
    const [applicationsMap, setApplicationsMap] = useState<Map<string, JobApplicationResponse>>(new Map());
    const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
    const [savingJob, setSavingJob] = useState(false);
    const AI_MATCH_CACHE_KEY = "ai_match_cache";

    const [aiMatchOpen, setAiMatchOpen] = useState(false);
    const [aiMatchStep, setAiMatchStep] = useState<"input" | "loading" | "result">("input");
    const [aiMatchResults, setAiMatchResults] = useState<AIJobMatchResult[]>([]);
    const [aiMatchError, setAiMatchError] = useState<string | null>(null);
    const [aiDetailJob, setAiDetailJob] = useState<{ job: JobCardData; reason: string } | null>(null);

    // Login Alert State
    const [showLoginAlert, setShowLoginAlert] = useState(false);
    const [aiPreferences, setAiPreferences] = useState({
        desiredPosition: "",
        desiredSalary: "",
    });

    // Profile check state for AI Matching
    const [profileCanMatch, setProfileCanMatch] = useState(true);
    const [profileMissingItems, setProfileMissingItems] = useState<string[]>([]);
    const [showProfileAlert, setShowProfileAlert] = useState(false);

    const section = useMemo<NavSection>(() => {
        const param = searchParams.get("section");
        return isNavSection(param) ? param : "jobs";
    }, [searchParams]);

    // เข้ามาครั้งแรก "ไม่เลือกบริษัทใดๆ"
    const [selected, setSelected] = useState<JobCardData | null>(null);
    const handleSelectJob = useCallback((job: JobCardData, nextTab: "desc" | "company" = "desc") => {
        setSelected(job);
        setTab(nextTab);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const cached = localStorage.getItem(AI_MATCH_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed.matches) && parsed.matches.length > 0) {
                    setAiMatchResults(parsed.matches);
                    setAiMatchStep("result");
                }
            }
        } catch (error) {
            console.warn("Failed to load AI match cache", error);
        }
    }, []);

    // Load applied jobs from API on mount
    useEffect(() => {
        const fetchApplications = async () => {
            if (!isLoggedIn) return;
            try {
                const response = await jobApplicationAPI.getMyApplications();
                if (response.ok && response.data) {
                    const applied = new Set<string>();
                    const appMap = new Map<string, JobApplicationResponse>();

                    response.data.forEach(app => {
                        applied.add(app.job_id);
                        appMap.set(app.job_id, app);
                    });

                    setAppliedJobs(applied);
                    setApplicationsMap(appMap);
                }
            } catch (error) {
                console.error("Failed to load applications", error);
            }
        };

        fetchApplications();
    }, [isLoggedIn]);

    // Load saved jobs from API on mount
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

    // Handle apply button click
    const handleApply = async () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }

        if (!selected?.company_id || !selected?.post_id) {
            return;
        }

        // Check if already applied (use post_id for unique identification)
        const jobKey = selected.post_id;
        if (appliedJobs.has(jobKey)) {
            setNotificationMessage(`คุณได้สมัครงานที่ ${selected.company} ไปแล้ว`);
            setNotificationOpen(true);
            return;
        }

        try {
            const response = await jobApplicationAPI.applyForJob(selected.post_id);
            if (response.ok) {
                // Update local state
                const newAppliedJobs = new Set(appliedJobs);
                newAppliedJobs.add(jobKey);
                setAppliedJobs(newAppliedJobs);

                // Refresh applications to get the new status
                const appsRes = await jobApplicationAPI.getMyApplications();
                if (appsRes.ok && appsRes.data) {
                    const appMap = new Map<string, JobApplicationResponse>();
                    appsRes.data.forEach(app => appMap.set(app.job_id, app));
                    setApplicationsMap(appMap);
                }

                // Show notification
                setNotificationMessage(`สมัครงานที่ ${selected.company} สำเร็จ!`);
                setNotificationOpen(true);

                // Redirect to company profile page after a short delay
                setTimeout(() => {
                    router.push(`/companies/${selected.company_id}`);
                }, 1500);
            } else {
                throw new Error(response.data?.message || "Failed to apply");
            }
        } catch (error) {
            console.error("Apply error:", error);
            setNotificationMessage("เกิดข้อผิดพลาดในการสมัครงาน กรุณาลองใหม่อีกครั้ง");
            setNotificationOpen(true);
        }
    };



    // Check profile completion when AI Match dialog opens
    useEffect(() => {
        if (!aiMatchOpen || !isLoggedIn) return;

        const checkProfile = async () => {
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

                const missing: string[] = [];

                const hasName = (profile?.first_name_th && profile?.last_name_th) ||
                    (profile?.first_name_en && profile?.last_name_en);
                if (!hasName) missing.push('ชื่อ-นามสกุล');

                const hasEducationOrExperience = educations.length > 0 || experiences.length > 0;
                if (!hasEducationOrExperience) missing.push('ประวัติการศึกษาหรือประสบการณ์ทำงาน');

                const hasJobPreference = !!(jobPref?.position && jobPref.position.trim() !== '');
                if (!hasJobPreference) missing.push('ตำแหน่งที่สนใจ');

                setProfileCanMatch(!!(hasName && hasEducationOrExperience && hasJobPreference));
                setProfileMissingItems(missing);
            } catch (err) {
                console.error("Error checking profile:", err);
            }
        };

        checkProfile();
    }, [aiMatchOpen, isLoggedIn]);

    const closeAiMatchDialog = () => {
        setAiMatchOpen(false);
        setAiMatchStep("input");
        setAiMatchError(null);
        setAiDetailJob(null);
        setShowProfileAlert(false);
    };

    const handleSelectFromMatch = (job: JobCardData, reason: string, nextTab: "desc" | "company" = "desc") => {
        (job as any).aiMatchReason = reason;
        handleSelectJob(job, nextTab);
        closeAiMatchDialog();
    };

    const handleClearAiMatch = () => {
        setAiMatchResults([]);
        setAiDetailJob(null);
        setAiMatchStep("input");
        if (typeof window !== "undefined") {
            localStorage.removeItem(AI_MATCH_CACHE_KEY);
        }
    };

    const handleRunAiMatch = async () => {
        // Check if profile is complete
        if (!profileCanMatch) {
            setShowProfileAlert(true);
            return;
        }

        setAiMatchError(null);
        setShowProfileAlert(false);
        setAiMatchStep("loading");

        try {
            const [profileRes, addressRes, educationsRes, experienceRes, jobPrefRes, skillsRes] = await Promise.all([
                userAPI.getProfile(),
                userAPI.getAddress(),
                userAPI.getEducations(),
                userAPI.getExperiences(),
                userAPI.getJobPreference(),
                userAPI.getSkills(),
            ]);

            const profile = profileRes.ok ? profileRes.data : null;
            const address = addressRes.ok ? addressRes.data : null;
            const educationsList = educationsRes.ok && educationsRes.data ? educationsRes.data : [];
            const experienceList = experienceRes.ok && experienceRes.data ? experienceRes.data : [];
            const jobPref = jobPrefRes.ok ? jobPrefRes.data : null;
            const userSkills = skillsRes.ok && skillsRes.data?.skills ? skillsRes.data.skills : [];

            // Try to get AI Score data from backend
            let aiScoreData = null;
            try {
                const aiScoreRes = await userAIScoreAPI.getScore();
                if (aiScoreRes.ok && aiScoreRes.data) {
                    aiScoreData = aiScoreRes.data;
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
                desired_position: aiPreferences.desiredPosition,
                desired_salary: aiPreferences.desiredSalary,
                // Include AI Score data if available
                ai_score: aiScoreData ? {
                    score: aiScoreData.score,
                    level: aiScoreData.level,
                    recommended_position: aiScoreData.recommended_position,
                    analysis: aiScoreData.analysis,
                } : null
            };

            const jobPostsPayload = jobs.map((job) => ({
                id: job.post_id || String(job.id),
                title: job.role,
                company: job.company,
                company_id: job.company_id,
                location: job.location,
                description: job.description.join("\n"),
                salary_range: job.rate,
                tags: job.tags,
            }));

            const matchResponse = await aiAPI.matchJobs({
                user_profile: userProfilePayload as any,
                job_posts: jobPostsPayload as any,
            });

            setAiMatchResults(matchResponse.matches || []);
            setAiMatchStep("result");
            setAiDetailJob(null);
            if (typeof window !== "undefined") {
                localStorage.setItem(
                    AI_MATCH_CACHE_KEY,
                    JSON.stringify({ matches: matchResponse.matches || [] })
                );
            }

            // Save matches to database
            console.log("Saving matches...", matchResponse.matches);
            if (matchResponse.matches && matchResponse.matches.length > 0) {
                try {
                    // Log job IDs to debug
                    matchResponse.matches.forEach(m => console.log(`Match Job ID: ${m.job_id}, Valid UUID: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.job_id)}`));

                    const matchesToSave: UserJobMatchPayload[] = matchResponse.matches.map(m => ({
                        job_id: m.job_id,
                        match_score: m.match_score,
                        analysis: m.reason
                    }));

                    console.log("Payload to save:", matchesToSave);
                    const res = await userJobMatchAPI.saveJobMatches(matchesToSave);
                    console.log("Save result:", res);
                } catch (saveError) {
                    console.error("Failed to save job matches", saveError);
                }
            }
        } catch (error) {
            console.error("AI Match error", error);
            setAiMatchError("ไม่สามารถจับคู่งานได้ กรุณาลองใหม่อีกครั้ง");
            setAiMatchStep("input");
        }
    };

    // Check if job is already applied
    const isJobApplied = (job: JobCardData): boolean => {
        if (!job.post_id) return false;
        return appliedJobs.has(job.post_id);
    };

    // Check if job is saved
    const isJobSaved = (job: JobCardData): boolean => {
        if (!job.post_id) return false;
        return savedJobs.has(job.post_id);
    };

    // Handle save/unsave job
    const handleSaveJob = async () => {
        if (!isLoggedIn) {
            router.push("/auth");
            return;
        }

        if (!selected?.post_id) {
            return;
        }

        const isSaved = savedJobs.has(selected.post_id);
        setSavingJob(true);

        try {
            if (isSaved) {
                // Unsave
                const response = await userAPI.unsaveJob(selected.post_id);
                if (response.ok) {
                    const newSavedJobs = new Set(savedJobs);
                    newSavedJobs.delete(selected.post_id);
                    setSavedJobs(newSavedJobs);
                    setNotificationMessage(`ยกเลิกการบันทึกงานที่ ${selected.company} แล้ว`);
                    setNotificationOpen(true);
                } else {
                    throw new Error("Failed to unsave job");
                }
            } else {
                // Save
                const response = await userAPI.saveJob(selected.post_id);
                if (response.ok) {
                    const newSavedJobs = new Set(savedJobs);
                    newSavedJobs.add(selected.post_id);
                    setSavedJobs(newSavedJobs);
                    setNotificationMessage(`บันทึกงานที่ ${selected.company} แล้ว`);
                    setNotificationOpen(true);
                } else {
                    throw new Error("Failed to save job");
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

    // Transform API response to JobCardData format
    const transformPostToJobCard = useCallback((post: CompanyPostResponse, index: number, companyName?: string): JobCardData => {
        // Parse description - if it's a string, split by newlines or use as single item
        const description = post.description
            ? post.description.split('\n').filter((line) => line.trim())
            : [];

        // Map job_type to JobType (handle variations)
        const jobTypeMap: Record<string, JobType> = {
            'Full-Time': 'Full-Time',
            'Part-Time': 'Part-Time',
            'Contract': 'Contract',
            'FullTime': 'Full-Time',
            'PartTime': 'Part-Time',
        };
        const type = (jobTypeMap[post.job_type] || 'Full-Time') as JobType;

        // Extract work mode from location or use default
        // Try to detect from location string
        let onsite: WorkMode = 'Onsite';
        const locationLower = post.location.toLowerCase();
        if (locationLower.includes('remote')) {
            onsite = 'Remote';
        } else if (locationLower.includes('hybrid')) {
            onsite = 'Hybrid';
        }

        // Parse salary range for sorting
        const salarySort = post.salary_range
            ? parseFloat(post.salary_range.replace(/[^0-9.]/g, '')) || 0
            : undefined;

        // Calculate relative time from created_at
        const getRelativeTime = (dateString: string): string => {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        };

        // Default level - inferred from title
        let level: JobLevel = 'Mid';
        const lowerTitle = post.title.toLowerCase();
        if (lowerTitle.includes('senior') || lowerTitle.includes('lead') || lowerTitle.includes('manager') || lowerTitle.includes('head') || lowerTitle.includes('principal')) {
            level = 'Senior';
        } else if (lowerTitle.includes('junior') || lowerTitle.includes('intern') || lowerTitle.includes('trainee') || lowerTitle.includes('entry')) {
            level = 'Junior';
        } else if (lowerTitle.includes('expert') || lowerTitle.includes('specialist') || lowerTitle.includes('director') || lowerTitle.includes('vp') || lowerTitle.includes('chief')) {
            level = 'Expert';
        }

        // Use company_id as company name for now (can be enhanced to fetch company name)
        const company = companyName || `Company ${post.company_id.slice(0, 8)}`;

        return {
            id: index + 1, // Keep as number for compatibility, but use post.id for application tracking
            company,
            company_id: post.company_id, // Store company_id for linking to company profile
            post_id: post.id, // Store actual post ID (UUID) for application tracking
            role: post.title,
            location: post.location,
            onsite,
            rate: post.salary_range || 'Negotiable',
            ...(salarySort !== undefined && { salarySort }),
            type,
            applicants: '0 /50', // Default - can be enhanced with actual applicant count
            level,
            time: getRelativeTime(post.created_at),
            sortIndex: index,
            tags: post.tags || [],
            description: description.length > 0 ? description : ['No description provided.'],
            ...(post.responsibilities && { responsibilities: post.responsibilities }),
            ...(post.qualifications && { qualifications: post.qualifications }),
            ...(post.benefits && { benefits: post.benefits }),
            responsibilities: post.responsibilities ?? "",
            qualifications: post.qualifications ?? "",
            benefits: post.benefits ?? "",
        };
    }, []);

    // Fetch jobs from API
    // Fetch jobs and ads from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setJobsLoading(true);
                setJobsError(null);

                // Fetch ads
                try {
                    const adsRes = await adsAPI.getAds();
                    if (adsRes.ok && adsRes.data) {
                        setAds(adsRes.data.filter(ad => ad.status === 'Active'));
                    }
                } catch (e) {
                    console.error('Failed to fetch ads', e);
                }

                const response = await companyAPI.getAllPosts();

                if (response.ok && response.data) {
                    // Filter only active posts
                    const activePosts = response.data.filter((post) => post.status === 'active');

                    // Fetch company names
                    const companyIds = Array.from(new Set(activePosts.map(p => p.company_id)));
                    const companyMap = new Map<string, string>();

                    await Promise.all(companyIds.map(async (id) => {
                        try {
                            const res = await companyAPI.getCompanyById(id);
                            if (res.ok && res.data) {
                                const name = res.data.company_name || "Unknown Company";
                                companyMap.set(id, name);
                            }
                        } catch (e) {
                            console.error(`Failed to fetch company ${id}`, e);
                        }
                    }));

                    const transformedJobs = activePosts.map((post, index) =>
                        transformPostToJobCard(post, index, companyMap.get(post.company_id))
                    );
                    setJobs(transformedJobs);
                } else {
                    // Fallback to sample jobs if API fails
                    console.warn('Failed to fetch jobs, using sample data:', response.status);
                    setJobs(SAMPLE_JOBS);
                }
            } catch (error) {
                console.error('Error fetching jobs:', error);
                setJobsError('Failed to load jobs');
                // Fallback to sample jobs
                setJobs(SAMPLE_JOBS);
            } finally {
                setJobsLoading(false);
            }
        };

        fetchData();
    }, [transformPostToJobCard]);

    useEffect(() => {
        if (section !== "jobs") {
            setOpenFilters(false);
        }
    }, [section]);

    const paramsString = useMemo(() => searchParams.toString(), [searchParams]);
    const handleSectionChange = useCallback(
        (next: NavSection) => {
            if (next === "ai-matching") {
                router.push("/ai-matching");
                return;
            }
            if (next === section) return;
            const params = new URLSearchParams(paramsString);
            if (next === "jobs") {
                params.delete("section");
            } else {
                params.set("section", next);
            }
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [paramsString, pathname, router, section]
    );

    const resetAll = () => {
        setType("All");
        setLevel("All");
        setMode("All");
        setLocation("");
        setQuery("");
        setSort("recent");
        setPage(1);
        setSelected(null);
    };

    // GSAP เฉพาะ client
    useEffect(() => {
        let ctx: any | undefined;
        let mounted = true;
        (async () => {
            if (typeof window === "undefined" || !root.current) return;
            const { gsap } = await import("gsap");
            const { ScrollTrigger } = await import("gsap/ScrollTrigger");
            gsap.registerPlugin(ScrollTrigger);
            if (!mounted || !root.current) return;

            const els = Array.from(
                root.current.querySelectorAll<HTMLElement>("[data-reveal]")
            );
            ctx = gsap.context(() => {
                els.forEach((el, i) => {
                    gsap.from(el, {
                        y: 22,
                        opacity: 0,
                        duration: 0.6,
                        delay: i * 0.05,
                        ease: "power2.out",
                        scrollTrigger: { trigger: el, start: "top 90%" },
                    });
                });
            }, root);
        })();
        return () => {
            mounted = false;
            if (ctx) ctx.revert();
        };
    }, []);

    // filter & sort
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let arr = jobs.filter((j) => {
            const hitsQ =
                !q ||
                [j.role, j.company, j.tags?.join(" ") ?? ""]
                    .join(" ")
                    .toLowerCase()
                    .includes(q);
            const hitsLoc =
                !location || j.location.toLowerCase().includes(location.toLowerCase());
            const hitsType = type === "All" || j.type === type;
            const hitsLevel = level === "All" || j.level === level;
            const hitsMode = mode === "All" || j.onsite === mode;
            return hitsQ && hitsLoc && hitsType && hitsLevel && hitsMode;
        });

        arr = [...arr].sort((a, b) => {
            if (sort === "recent") return a.sortIndex - b.sortIndex;
            if (sort === "salary") return (b.salarySort ?? 0) - (a.salarySort ?? 0);
            if (sort === "applicants") return getApplicants(b) - getApplicants(a);
            return 0;
        });

        return arr;
    }, [jobs, query, location, type, level, mode, sort]);

    // ถ้ารายการที่เลือกเดิมไม่อยู่ในผลกรองแล้ว ให้ยกเลิก selection
    useEffect(() => {
        if (selected && !filtered.some((j) => j.id === selected.id)) {
            setSelected(null);
        }
    }, [filtered, selected]);

    // pagination
    const PAGE_SIZE = 6;
    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    useEffect(() => {
        if (page > maxPage) setPage(1);
    }, [maxPage, page]);

    // micro skeleton
    useEffect(() => {
        setLoading(true);
        const t = setTimeout(() => setLoading(false), 200);
        return () => clearTimeout(t);
    }, [query, location, type, level, mode, sort, page]);

    return (
        <Box
            ref={root}
            className="min-h-screen bg-[#F6F7F9] relative overflow-x-hidden"
            sx={{ "--ring": "rgba(0,0,0,0.08)" } as any}
        >
            {/* NAV — glass + gradient + active pill */}
            <Box
                className="sticky top-0 z-40 border-b"
                sx={{
                    borderColor: "rgba(0,0,0,.08)",
                    backdropFilter: "saturate(140%) blur(10px)",
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.78))",
                }}
            >
                <Container maxWidth="lg" className="!px-5 md:!px-8">
                    <Box className="flex items-center justify-center py-3">
                        <JobsNavLinks
                            section={section}
                            onSectionChange={handleSectionChange}
                            isLoggedIn={isLoggedIn}
                        />
                    </Box>
                </Container>
            </Box>

            {section === "near_me" ? (
                <JobsNearMe />
            ) : section === "jobs" ? (
                <>
                    {/* HERO */}
                    <Container maxWidth="lg" className="!px-5 md:!px-8">


                        {/* Search row */}
                        <Box data-reveal className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <Box className="md:col-span-4 flex items-center gap-3 rounded-full bg-black text-white px-4 py-3 shadow-[0_6px_30px_rgba(0,0,0,0.12)]">
                                <span className="text-sm font-medium">{tClient("searchResult")}</span>
                                <span className="ml-auto text-xs bg-white/20 rounded-full px-3 py-1">
                                    {tClient("jobsFound", { count: filtered.length })}
                                </span>
                            </Box>

                            <Box className="md:col-span-6">
                                <TextField
                                    id="jobs-search"
                                    fullWidth
                                    placeholder={tClient("searchPlaceholder")}
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 4,
                                            background: "white",
                                        },
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search size={16} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            {/* <Box className="md:col-span-2 flex items-center justify-end gap-2 flex-wrap">

                                <Button
                                    variant="outlined"
                                    onClick={() => setOpenFilters(true)}
                                    startIcon={<SlidersHorizontal size={16} />}
                                    sx={{ borderRadius: 999 }}
                                >
                                    {tClient("filters")}
                                </Button>
                            </Box> */}
                        </Box>

                        {/* Quick chips */}
                        {/* <Stack direction="row" spacing={1} className="mt-4 flex-wrap">
                            {[
                                {
                                    label: "Part-Time",
                                    on: type === "Part-Time",
                                    onClick: () => {
                                        setType(type === "Part-Time" ? "All" : "Part-Time");
                                        setPage(1);
                                    },
                                },
                                {
                                    label: "Remote",
                                    on: mode === "Remote",
                                    onClick: () => {
                                        setMode(mode === "Remote" ? "All" : "Remote");
                                        setPage(1);
                                    },
                                },
                                {
                                    label: "Expert",
                                    on: level === "Expert",
                                    onClick: () => {
                                        setLevel(level === "Expert" ? "All" : "Expert");
                                        setPage(1);
                                    },
                                },
                                {
                                    label: "Senior",
                                    on: level === "Senior",
                                    onClick: () => {
                                        setLevel(level === "Senior" ? "All" : "Senior");
                                        setPage(1);
                                    },
                                },
                                {
                                    label: "Contract",
                                    on: type === "Contract",
                                    onClick: () => {
                                        setType(type === "Contract" ? "All" : "Contract");
                                        setPage(1);
                                    },
                                },
                            ].map((c) => (
                                <Chip
                                    key={c.label}
                                    label={c.label}
                                    onClick={c.onClick}
                                    variant={c.on ? "filled" : "outlined"}
                                    sx={{
                                        borderRadius: 999,
                                        ...(c.on
                                            ? { bgcolor: "black", color: "white", borderColor: "black" }
                                            : {}),
                                    }}
                                />
                            ))}
                        </Stack> */}

                        {/* Sort + filters */}
                        {/* Sort + filters */}
                        <Box className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3" data-reveal>
                            <FormControl fullWidth>
                                <InputLabel id="sortby">{tClient("sortBy")}</InputLabel>
                                <Select
                                    labelId="sortby"
                                    label={tClient("sortBy")}
                                    value={sort}
                                    onChange={(e: SelectChangeEvent) =>
                                        setSort(e.target.value as SortOption)
                                    }
                                    sx={{ borderRadius: 3, background: "white" }}
                                >
                                    <MenuItem value="recent">{tClient("mostRecent")}</MenuItem>
                                    <MenuItem value="salary">{tClient("highestSalary")}</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                placeholder={tClient("filterLocation")}
                                value={location}
                                onChange={(e) => {
                                    setLocation(e.target.value);
                                    setPage(1);
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": { borderRadius: 3, background: "white" },
                                }}
                            />

                            <FormControl fullWidth>
                                <InputLabel id="type">{tClient("type")}</InputLabel>
                                <Select
                                    labelId="type"
                                    label={tClient("type")}
                                    value={type}
                                    onChange={(e: SelectChangeEvent) =>
                                        setType(e.target.value as JobType | "All")
                                    }
                                    sx={{ borderRadius: 3, background: "white" }}
                                >
                                    {["All", "Full-Time", "Part-Time", "Contract"].map((o) => (
                                        <MenuItem key={o} value={o}>
                                            {o}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Container>

                    {/* BODY */}
                    <Container
                        maxWidth="lg"
                        className="!px-5 md:!px-8 !py-6 grid md:grid-cols-2 gap-6"
                    >
                        {/* LIST */}
                        <Box data-reveal className="space-y-4">
                            {jobsError && (
                                <Typography color="error" variant="body2">
                                    {jobsError}
                                </Typography>
                            )}
                            {jobsLoading || loading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <Card
                                        key={i}
                                        variant="outlined"
                                        className="animate-pulse"
                                        sx={{
                                            borderRadius: 4,
                                            backdropFilter: "blur(6px)",
                                            boxShadow: "0 10px 30px rgba(0,0,0,.09)",
                                        }}
                                    >
                                        <CardContent>
                                            <Box className="h-6 w-40 bg-black/10 rounded mb-2" />
                                            <Box className="h-4 w-64 bg-black/10 rounded" />
                                            <Box className="mt-3 h-4 w-56 bg-black/10 rounded" />
                                        </CardContent>
                                    </Card>
                                ))
                                : pageItems.length
                                    ? pageItems.map((job, index) => (
                                        <React.Fragment key={job.id}>
                                            {/* Inject Ad every 4 items */}
                                            {index > 0 && index % 4 === 0 && ads.length > 0 && (
                                                <Box sx={{ mb: 2 }}>
                                                    <AdCard
                                                        title={ads[(index / 4 - 1) % ads.length].title}
                                                        sponsorName={ads[(index / 4 - 1) % ads.length].sponsor_name || ''}
                                                        sponsorTag={ads[(index / 4 - 1) % ads.length].sponsor_tag || 'Sponsored'}
                                                        profileImageUrl={ads[(index / 4 - 1) % ads.length].profile_image_url || ''}
                                                        details={ads[(index / 4 - 1) % ads.length].details || ''}
                                                        linkUrl={ads[(index / 4 - 1) % ads.length].link_url || ''}
                                                    />
                                                </Box>
                                            )}
                                            <Card
                                                variant="outlined"
                                                onClick={() => handleSelectJob(job)}
                                                sx={{
                                                    borderRadius: 4,
                                                    background: "rgba(255,255,255,0.92)",
                                                    borderColor:
                                                        selected?.id === job.id ? "black" : "var(--ring)",
                                                    transition:
                                                        "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                                                    boxShadow:
                                                        "0 10px 30px rgba(0,0,0,.09), 0 4px 10px rgba(0,0,0,.05)",
                                                    "&:hover": {
                                                        transform: "translateY(-2px)",
                                                        boxShadow:
                                                            "0 18px 36px rgba(0,0,0,.12), 0 6px 14px rgba(0,0,0,.07)",
                                                        borderColor: "rgba(0,0,0,.25)",
                                                    },
                                                    mb: 2, // Add margin bottom for spacing
                                                }}
                                            >
                                                <CardContent>
                                                    <Stack direction="row" spacing={2} alignItems="flex-start">
                                                        <Box className="h-10 w-10 rounded-xl bg-black/5 grid place-items-center">
                                                            <Building2 size={16} className="text-black/60" />
                                                        </Box>
                                                        <Box className="min-w-0 flex-1">
                                                            {job.company_id ? (
                                                                <NextLink href={`/companies/${job.company_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                                    <Typography
                                                                        fontWeight={700}
                                                                        sx={{
                                                                            cursor: 'pointer',
                                                                            '&:hover': { textDecoration: 'underline' }
                                                                        }}
                                                                    >
                                                                        {job.company}
                                                                    </Typography>
                                                                </NextLink>
                                                            ) : (
                                                                <Typography fontWeight={700}>{job.company}</Typography>
                                                            )}
                                                            <Typography variant="body2" color="text.secondary">
                                                                {job.role} · {job.location} – {job.onsite}
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} className="mt-2 flex-wrap">
                                                                <Chip size="small" label={job.rate} sx={pillSX("neutral")} />
                                                                <Chip size="small" label={job.type} sx={pillSX("blue")} />
                                                                <Chip size="small" label={job.level} sx={pillSX("violet")} />
                                                            </Stack>
                                                        </Box>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            className="whitespace-nowrap"
                                                        >
                                                            {job.time}
                                                        </Typography>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </React.Fragment>
                                    ))
                                    : (
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 4,
                                                boxShadow: "0 10px 30px rgba(0,0,0,.09), 0 4px 10px rgba(0,0,0,.05)",
                                            }}
                                        >
                                            <CardContent>
                                                <Typography align="center" color="text.secondary">
                                                    {tClient("noResults")}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    )}

                            {/* Pagination */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                    {filtered.length > 0 ? (
                                        <>
                                            {tClient("showing")} <b>{Math.min(filtered.length, (page - 1) * 6 + 1)}</b>–
                                            <b>{Math.min(page * 6, filtered.length)}</b> {tClient("of")}{" "}
                                            <b>{filtered.length}</b>
                                        </>
                                    ) : (
                                        <>{tClient("showing")} 0 {tClient("of")} 0</>
                                    )}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        startIcon={<ChevronLeft />}
                                    >
                                        {tClient("prev")}
                                    </Button>
                                    <Typography variant="body2">
                                        {Math.min(page, maxPage)} / {maxPage}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                                        disabled={page === maxPage}
                                        endIcon={<ChevronRight />}
                                    >
                                        {tClient("next")}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* DETAIL */}
                        <Card
                            data-reveal
                            variant="outlined"
                            sx={{
                                borderRadius: 5,
                                background:
                                    "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86))",
                                borderColor: "var(--ring)",
                                boxShadow:
                                    "0 16px 40px rgba(0,0,0,.08), 0 6px 14px rgba(0,0,0,.04)",
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            <CardContent>
                                {selected ? (
                                    <>
                                        <Stack direction="row" spacing={2} alignItems="flex-start">
                                            <Box className="h-12 w-12 rounded-xl bg-black/5 grid place-items-center">
                                                <Building2 size={18} className="text-black/60" />
                                            </Box>
                                            <Box className="min-w-0 flex-1">
                                                <Typography fontWeight={800}>{selected.company}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {selected.role} · {selected.location} – {selected.onsite}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant={isJobSaved(selected) ? "contained" : "outlined"}
                                                size="small"
                                                startIcon={<Bookmark />}
                                                onClick={handleSaveJob}
                                                disabled={savingJob || !isLoggedIn}
                                            >
                                                {isJobSaved(selected) ? tClient("saved") : tClient("save")}
                                            </Button>
                                        </Stack>

                                        <Box className="grid grid-cols-2 gap-2 mt-3">
                                            <StatPill
                                                label={tClient("salaryRange")}
                                                value={isLoggedIn ? selected.rate : tClient("loginToView")}
                                                color={isLoggedIn ? "neutral" : "neutral"}
                                            />
                                            <StatPill label={tClient("jobType")} value={selected.type} color="blue" />
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Box
                                                sx={{
                                                    display: "inline-flex",
                                                    borderRadius: 999,
                                                    bgcolor: "rgba(0,0,0,.06)",
                                                    p: 0.5,
                                                }}
                                            >
                                                <Tabs
                                                    value={tab}
                                                    onChange={(_, v) => setTab(v)}
                                                    sx={{
                                                        width: "auto",
                                                        minHeight: 36,
                                                        height: 36,
                                                        ".MuiTabs-flexContainer": {
                                                            display: "inline-flex",
                                                            gap: 8,
                                                        },
                                                        ".MuiTabs-indicator": { display: "none" },
                                                    }}
                                                >
                                                    {[
                                                        { val: "desc", label: tClient("description") },
                                                        { val: "company", label: tClient("company") },
                                                    ].map(({ val, label }) => (
                                                        <Tab
                                                            key={val}
                                                            value={val}
                                                            label={label}
                                                            disableRipple
                                                            sx={{
                                                                textTransform: "none",
                                                                borderRadius: 999,
                                                                minHeight: 36,
                                                                minWidth: 0,
                                                                px: 2.75,
                                                                py: 0,
                                                                m: 0,
                                                                ...(tab === val
                                                                    ? { bgcolor: "black", color: "white" }
                                                                    : { color: "text.secondary" }),
                                                            }}
                                                        />
                                                    ))}
                                                </Tabs>
                                            </Box>
                                        </Box>

                                        {tab === "desc" ? (
                                            <Stack spacing={1.2} className="mt-3">
                                                {/* Job Description */}
                                                <TranslatedSection
                                                    title={tClient("sections.desc")}
                                                    content={selected.description}
                                                />

                                                {/* Responsibilities */}
                                                <TranslatedSection
                                                    title={tClient("sections.resp")}
                                                    content={selected.responsibilities}
                                                />

                                                {/* Qualifications */}
                                                <TranslatedSection
                                                    title={tClient("sections.qual")}
                                                    content={selected.qualifications}
                                                />

                                                {/* Benefits */}
                                                <TranslatedSection
                                                    title={tClient("sections.benefits")}
                                                    content={selected.benefits}
                                                />

                                                {/* Tags */}
                                                {selected.tags && selected.tags.length > 0 && (
                                                    <Stack direction="row" spacing={1} className="pt-1 flex-wrap" sx={{ mt: 2 }}>
                                                        {selected.tags.map((t) => (
                                                            <Chip key={t} size="small" label={t} />
                                                        ))}
                                                    </Stack>
                                                )}
                                            </Stack>
                                        ) : (
                                            <Stack spacing={1.2} className="mt-3">
                                                <Typography variant="body2" className="flex items-center gap-1.5">
                                                    <ShieldCheck size={16} /> {tClient("verifiedCompany")}
                                                </Typography>
                                                <Typography variant="body2" className="flex items-center gap-1.5">
                                                    <MapPin size={16} /> {selected.location}
                                                </Typography>
                                                <Typography variant="body2">
                                                    {selected.company} is a digital product studio focusing on
                                                    design systems and delightful interfaces.
                                                </Typography>
                                                {selected.company_id && (
                                                    <Box className="mt-3">
                                                        <NextLink href={`/companies/${selected.company_id}`} passHref>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ textTransform: "none" }}
                                                            >
                                                                {tClient("viewCompanyProfile")}
                                                            </Button>
                                                        </NextLink>
                                                    </Box>
                                                )}
                                            </Stack>
                                        )}

                                        {isLoggedIn ? (
                                            <Box className="mt-4 space-y-3">
                                                <Box className="rounded-xl bg-green-50 p-3 border border-green-200 text-green-800 text-sm flex items-start gap-2">
                                                    <CheckCircle size={16} className="mt-0.5" />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="bold">{tClient("salaryRange")}</Typography>
                                                        {selected.rate || "Negotiable"}
                                                    </Box>
                                                </Box>
                                                <Box className="rounded-xl bg-blue-50 p-3 border border-blue-200 text-blue-800 text-sm flex items-start gap-2">
                                                    <User size={16} className="mt-0.5" />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="bold">{tClient("contactPerson")}</Typography>
                                                        {selected.contactPerson || `${selected.company} HR Team`}
                                                    </Box>
                                                </Box>
                                                <Box className="rounded-xl bg-purple-50 p-3 border border-purple-200 text-purple-800 text-sm flex items-start gap-2">
                                                    <Sparkles size={16} className="mt-0.5" />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="bold">{tClient("aiMatchReason")}</Typography>
                                                        {selected.aiMatchReason || (selected.tags && selected.tags.length > 0 ? `Matches your interest in ${selected.tags.slice(0, 3).join(", ")}` : "Your profile matches this job description.")}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Box className="mt-4 rounded-xl bg-black/[.04] p-3 border border-black/10 text-black/70 text-sm flex items-start gap-2">
                                                <Lock size={16} className="mt-0.5" />
                                                {tClient("guestMessage")}
                                            </Box>
                                        )}

                                        {showLoginAlert && (
                                            <MuiAlert
                                                severity="warning"
                                                onClose={() => setShowLoginAlert(false)}
                                                sx={{ mt: 3, mb: 1, borderRadius: 3 }}
                                                action={
                                                    <Button color="inherit" size="small" onClick={() => router.push("/auth")}>
                                                        {tClient("loginButton")}
                                                    </Button>
                                                }
                                            >
                                                {tClient("loginAlert")}
                                            </MuiAlert>
                                        )}

                                        <Stack direction="row" spacing={1.2} className="mt-3">
                                            {(() => {
                                                const app = selected?.post_id ? applicationsMap.get(selected.post_id) : undefined;
                                                const isRejected = app?.status === 'rejected';
                                                let canReapply = false;
                                                let cooldownMsg = "";

                                                if (isRejected && app?.updated_at) {
                                                    const rejectedTime = new Date(app.updated_at).getTime();
                                                    const now = new Date().getTime();
                                                    const diffHours = (now - rejectedTime) / (1000 * 60 * 60);

                                                    if (diffHours >= 24) {
                                                        canReapply = true;
                                                    } else {
                                                        const remainingHours = Math.ceil(24 - diffHours);
                                                        cooldownMsg = `จะสมัครได้อีกใน ${remainingHours} ชม.`;
                                                    }
                                                }

                                                return (
                                                    <Button
                                                        variant="contained"
                                                        disableElevation
                                                        onClick={() => {
                                                            if (!isLoggedIn) {
                                                                setShowLoginAlert(true);
                                                            } else {
                                                                handleApply();
                                                            }
                                                        }}
                                                        disabled={selected ? (isJobApplied(selected) && !canReapply) : false}
                                                        color={isRejected ? (canReapply ? "primary" : "error") : "primary"}
                                                    >
                                                        {selected && isJobApplied(selected)
                                                            ? (isRejected
                                                                ? (canReapply ? "สมัครใหม่" : `ถูกปฏิเสธ (${cooldownMsg})`)
                                                                : tClient("applied"))
                                                            : tClient("apply")}
                                                    </Button>
                                                );
                                            })()}
                                            <Button
                                                variant={selected && isJobSaved(selected) ? "contained" : "outlined"}
                                                onClick={handleSaveJob}
                                                disabled={savingJob || !isLoggedIn || !selected?.post_id}
                                            >
                                                {selected && isJobSaved(selected) ? tClient("saved") : tClient("save")}
                                            </Button>
                                        </Stack>
                                    </>
                                ) : (
                                    <EmptyState resetAll={resetAll} />
                                )}
                            </CardContent>
                        </Card>
                    </Container>

                    {/* DRAWER */}
                    <Drawer
                        anchor="bottom"
                        open={openFilters}
                        onClose={() => setOpenFilters(false)}
                    >
                        <Box className="p-4 md:p-6 max-w-[980px] mx-auto w-full">
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography fontWeight={800}>{tClient("filters")}</Typography>
                                <IconButton onClick={() => setOpenFilters(false)}>
                                    <SlidersHorizontal size={18} />
                                </IconButton>
                            </Stack>

                            <Box className="mt-4 grid md:grid-cols-1 gap-3">
                                <FormControl fullWidth>
                                    <InputLabel id="ft-type">{tClient("type")}</InputLabel>
                                    <Select
                                        labelId="ft-type"
                                        label={tClient("type")}
                                        value={type}
                                        onChange={(e: SelectChangeEvent) => setType(e.target.value as JobType | "All")}
                                        sx={{ borderRadius: 3, background: "white" }}
                                    >
                                        {["All", "Full-Time", "Part-Time", "Contract"].map((o) => (
                                            <MenuItem key={o} value={o}>
                                                {o}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box className="mt-6">
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={() => setOpenFilters(false)}
                                    sx={{ borderRadius: 999, py: 1.5 }}
                                >
                                    {tClient("showResults")}
                                </Button>
                            </Box>
                        </Box>
                    </Drawer>

                    {/* AI Match Dialog */}
                    <Dialog
                        open={aiMatchOpen}
                        onClose={closeAiMatchDialog}
                        fullWidth
                        maxWidth="sm"
                    >
                        {aiMatchStep === "input" && (
                            <>
                                <DialogTitle>{tClient("aiDialog.title")}</DialogTitle>
                                <DialogContent>
                                    <Typography variant="body2" color="text.secondary">
                                        {tClient("aiDialog.desc")}
                                    </Typography>
                                    <Stack spacing={2} sx={{ mt: 2 }}>
                                        {/* Profile Incomplete Alert */}
                                        {showProfileAlert && !profileCanMatch && (
                                            <MuiAlert
                                                severity="warning"
                                                onClose={() => setShowProfileAlert(false)}
                                            >
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                                    กรุณากรอกข้อมูลให้ครบถ้วนก่อนเริ่มการจับคู่
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    ข้อมูลที่ยังไม่ได้กรอก:
                                                </Typography>
                                                <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.875rem' }}>
                                                    {profileMissingItems.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </Box>
                                                <Button
                                                    size="small"
                                                    href="/onboarding"
                                                    sx={{ mt: 1, textTransform: 'none', fontWeight: 600, p: 0 }}
                                                >
                                                    ไปกรอกข้อมูล →
                                                </Button>
                                            </MuiAlert>
                                        )}
                                        <TextField
                                            label={tClient("aiDialog.desiredPosition")}
                                            placeholder={tClient("aiDialog.desiredPositionPlaceholder")}
                                            fullWidth
                                            value={aiPreferences.desiredPosition}
                                            onChange={(e) =>
                                                setAiPreferences((prev) => ({
                                                    ...prev,
                                                    desiredPosition: e.target.value,
                                                }))
                                            }
                                        />
                                        <TextField
                                            label={tClient("aiDialog.expectedSalary")}
                                            placeholder={tClient("aiDialog.expectedSalaryPlaceholder")}
                                            fullWidth
                                            value={aiPreferences.desiredSalary}
                                            onChange={(e) =>
                                                setAiPreferences((prev) => ({
                                                    ...prev,
                                                    desiredSalary: e.target.value,
                                                }))
                                            }
                                        />
                                        {aiMatchError && (
                                            <MuiAlert severity="error">{aiMatchError}</MuiAlert>
                                        )}
                                    </Stack>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={closeAiMatchDialog}>{tClient("aiDialog.cancel")}</Button>
                                    <Button variant="contained" onClick={handleRunAiMatch}>
                                        {tClient("aiDialog.startMatch")}
                                    </Button>
                                </DialogActions>
                            </>
                        )}

                        {aiMatchStep === "loading" && (
                            <DialogContent sx={{ py: 6, textAlign: "center" }}>
                                <AiMatchingLoader />
                            </DialogContent>
                        )}

                        {aiMatchStep === "result" && (
                            <>
                                <DialogTitle>
                                    {aiDetailJob ? (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <IconButton size="small" onClick={() => setAiDetailJob(null)}>
                                                <ChevronLeft size={18} />
                                            </IconButton>
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                {tClient("aiDialog.selectedJobTitle")}
                                            </Typography>
                                        </Stack>
                                    ) : (
                                        tClient("aiDialog.matchResultTitle")
                                    )}
                                </DialogTitle>
                                <DialogContent dividers>
                                    {aiDetailJob ? (
                                        <Box>
                                            <Typography variant="h6" fontWeight={800}>
                                                {aiDetailJob.job.role}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {aiDetailJob.job.company} • {aiDetailJob.job.location}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                                                <Chip size="small" label={aiDetailJob.job.rate} />
                                                <Chip size="small" label={aiDetailJob.job.type} />
                                                <Chip size="small" label={aiDetailJob.job.level} />
                                            </Stack>
                                            <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                                {tClient("aiDialog.recommendedReason")}
                                            </Typography>
                                            <Typography variant="body2">{aiDetailJob.reason}</Typography>
                                            <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                                {tClient("aiDialog.jobDetails")}
                                            </Typography>
                                            <Stack spacing={0.5}>
                                                {aiDetailJob.job.description.map((desc, idx) => (
                                                    <Typography key={idx} variant="body2">
                                                        • {desc}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => handleSelectFromMatch(aiDetailJob.job, aiDetailJob.reason, "desc")}
                                                >
                                                    {tClient("aiDialog.openDetails")}
                                                </Button>
                                                {aiDetailJob.job.company_id && (
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => handleSelectFromMatch(aiDetailJob.job, aiDetailJob.reason, "company")}
                                                    >
                                                        {tClient("aiDialog.viewCompany")}
                                                    </Button>
                                                )}
                                            </Stack>
                                        </Box>
                                    ) : aiMatchResults.length === 0 ? (
                                        <Typography align="center" color="text.secondary">
                                            {tClient("aiDialog.noMatch")}
                                        </Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            {aiMatchResults.map((match) => {
                                                const job = jobs.find((j) => j.post_id === match.job_id || String(j.id) === match.job_id);
                                                if (!job) return null;

                                                const statusLabel =
                                                    match.location_status === "Close"
                                                        ? "ใกล้คุณ"
                                                        : match.location_status === "Far"
                                                            ? "ต่างพื้นที่"
                                                            : "ระยะทางไม่ทราบ";

                                                const statusColor =
                                                    match.location_status === "Close"
                                                        ? "success"
                                                        : match.location_status === "Far"
                                                            ? "warning"
                                                            : "default";

                                                return (
                                                    <Card key={`${match.job_id}-${match.match_score}`} variant="outlined" sx={{ borderRadius: 3 }}>
                                                        <CardContent>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                <Box>
                                                                    <Typography fontWeight={700}>{job.role}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {job.company} • {job.location}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant="h6" color="primary">
                                                                    {match.match_score}%
                                                                </Typography>
                                                            </Stack>
                                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                                {match.reason}
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                                                                <Chip size="small" label={statusLabel} color={statusColor as any} variant="outlined" />
                                                                {job.rate && <Chip size="small" label={job.rate} />}
                                                            </Stack>
                                                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    onClick={() => setAiDetailJob({ job, reason: match.reason })}
                                                                >
                                                                    {tClient("aiDialog.viewDetails")}
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="text"
                                                                    onClick={() => handleSelectFromMatch(job, match.reason, "desc")}
                                                                >
                                                                    {tClient("aiDialog.openDetails")}
                                                                </Button>
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </DialogContent>
                                <DialogActions>
                                    {aiMatchResults.length > 0 && (
                                        <>
                                            <Button onClick={handleClearAiMatch} color="inherit">
                                                {tClient("aiDialog.clear")}
                                            </Button>
                                            <Button onClick={handleRunAiMatch}>{tClient("aiDialog.matchAgain")}</Button>
                                        </>
                                    )}
                                    <Button onClick={closeAiMatchDialog}>{tClient("aiDialog.close")}</Button>
                                </DialogActions>
                            </>
                        )}
                    </Dialog>



                    {/* Notification Snackbar */}
                    <Snackbar
                        open={notificationOpen}
                        autoHideDuration={3000}
                        onClose={() => setNotificationOpen(false)}
                        anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    >
                        <MuiAlert
                            onClose={() => setNotificationOpen(false)}
                            severity="success"
                            sx={{ width: "100%" }}
                        >
                            {notificationMessage}
                        </MuiAlert>
                    </Snackbar>
                </>
            ) : (
                <Container maxWidth="lg" className="!px-5 md:!px-8 !py-10">
                    <SectionPlaceholder
                        section={section}
                        onBackToJobs={() => handleSectionChange("jobs")}
                        isLoggedIn={isLoggedIn}
                    />
                </Container>
            )
            }
        </Box >
    );
}
