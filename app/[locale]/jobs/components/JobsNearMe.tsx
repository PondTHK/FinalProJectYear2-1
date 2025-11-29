"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    Typography,
    Chip,
    Drawer,
    IconButton,
    useTheme,
    useMediaQuery,
    Slider,
    Badge,
    Popover,
    Snackbar,
    Alert
} from "@mui/material";
import {
    MapPin,
    Navigation,
    Building2,
    Briefcase,
    DollarSign,
    X,
    CheckCircle2,
    SlidersHorizontal,
    RotateCcw,
    Sparkles,
    TrendingUp
} from "lucide-react";
import Script from "next/script";
import { pillSX } from '../pillStyles';
import { userAPI, userAIScoreAPI } from "@/app/lib/api";
import { useTranslations } from "next-intl";

// AI Score interface (from API)
interface AIScoreData {
    score: number;
    level: string | null;
    recommended_position: string;
    recommended_skills?: string[];
    analysis: string;
}

// User Profile Data for matching
interface UserMatchData {
    aiScore: AIScoreData | null;
    skills: string[];
    jobPreference: {
        industry: string;
        position: string;
    } | null;
}

// Filter Types
interface FilterState {
    jobTypes: string[];
    salaryRanges: string[];
}

declare global {
    interface Window {
        longdo: any;
    }
}

export default function JobsNearMe() {
    const t = useTranslations("Jobs.nearMe");

    // Filter Options - Moved inside component to use translations
    const JOB_TYPE_OPTIONS = useMemo(() => [
        { value: "Full-time", label: t("jobTypes.Full-time") },
        { value: "Part-time", label: t("jobTypes.Part-time") },
        { value: "Contract", label: t("jobTypes.Contract") },
        { value: "Freelance", label: t("jobTypes.Freelance") },
        { value: "Internship", label: t("jobTypes.Internship") },
    ], [t]);

    const SALARY_RANGE_OPTIONS = useMemo(() => [
        { value: "0-15000", label: t("salaryRanges.range1"), min: 0, max: 15000 },
        { value: "15000-25000", label: t("salaryRanges.range2"), min: 15000, max: 25000 },
        { value: "25000-40000", label: t("salaryRanges.range3"), min: 25000, max: 40000 },
        { value: "40000-60000", label: t("salaryRanges.range4"), min: 40000, max: 60000 },
        { value: "60000+", label: t("salaryRanges.range5"), min: 60000, max: Infinity },
    ], [t]);

    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [permissionDialogOpen, setPermissionDialogOpen] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [maxDistance, setMaxDistance] = useState<number>(50);

    // Filter states
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        jobTypes: [],
        salaryRanges: [],
    });
    const [showRecommended, setShowRecommended] = useState(false);
    const [userMatchData, setUserMatchData] = useState<UserMatchData>({
        aiScore: null,
        skills: [],
        jobPreference: null,
    });

    // Notification state
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState<"success" | "error">("success");

    const filterOpen = Boolean(filterAnchorEl);
    const hasUserData = userMatchData.aiScore !== null || userMatchData.jobPreference !== null;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        return filters.jobTypes.length + filters.salaryRanges.length + (showRecommended ? 1 : 0);
    }, [filters, showRecommended]);

    // Fetch user data for matching (from API)
    useEffect(() => {
        const fetchUserData = async () => {
            let aiScore: AIScoreData | null = null;
            let skills: string[] = [];
            let jobPreference: { industry: string; position: string } | null = null;

            try {
                const [aiScoreRes, skillsRes, jobPrefRes] = await Promise.all([
                    userAIScoreAPI.getScore(),
                    userAPI.getSkills(),
                    userAPI.getJobPreference(),
                ]);

                // 1. Get AI Score from backend
                if (aiScoreRes.ok && aiScoreRes.data) {
                    aiScore = {
                        score: aiScoreRes.data.score,
                        level: aiScoreRes.data.level,
                        recommended_position: aiScoreRes.data.recommended_position,
                        analysis: aiScoreRes.data.analysis,
                    };
                }

                // 2. Get skills from API
                if (skillsRes.ok && skillsRes.data?.skills) {
                    skills = skillsRes.data.skills;
                }

                // 3. Get job preference from API
                if (jobPrefRes.ok && jobPrefRes.data) {
                    jobPreference = {
                        industry: jobPrefRes.data.industry || '',
                        position: jobPrefRes.data.position || '',
                    };
                }
            } catch (error) {
                console.log("Error fetching user data for matching:", error);
            }

            setUserMatchData({ aiScore, skills, jobPreference });
        };

        fetchUserData();
    }, []);

    // Calculate match score for a job
    const calculateMatchScore = (job: any): number => {
        let score = 0;
        const { aiScore, skills, jobPreference } = userMatchData;

        // If no user data, return 0
        if (!aiScore && !jobPreference && skills.length === 0) {
            return 0;
        }

        const jobTitle = (job.title || '').toLowerCase();
        const jobDescription = (job.description || '').toLowerCase();
        const jobQualifications = (job.qualifications || '').toLowerCase();
        const jobText = `${jobTitle} ${jobDescription} ${jobQualifications}`;

        // 1. Position Match (40%) - Check if AI recommended position or user's desired position matches
        const targetPosition = aiScore?.recommended_position || jobPreference?.position || '';
        if (targetPosition) {
            const positionLower = targetPosition.toLowerCase();
            // Check for keyword matches
            const positionKeywords = positionLower.split(/[\s,]+/).filter(k => k.length > 2);
            const matchedKeywords = positionKeywords.filter(keyword =>
                jobTitle.includes(keyword) || jobText.includes(keyword)
            );
            if (matchedKeywords.length > 0) {
                score += Math.min(40, (matchedKeywords.length / positionKeywords.length) * 40);
            }
        }

        // 2. Skills Match (30%) - Check user's skills against job requirements
        if (skills.length > 0) {
            const matchedSkills = skills.filter(skill =>
                jobText.includes(skill.toLowerCase())
            );
            score += (matchedSkills.length / skills.length) * 30;
        }

        // 3. Industry Match (20%) - Check if industry matches
        const targetIndustry = jobPreference?.industry || '';
        if (targetIndustry) {
            const industryLower = targetIndustry.toLowerCase();
            if (jobText.includes(industryLower)) {
                score += 20;
            }
        }

        // 4. Distance Bonus (10%) - Closer jobs get higher score
        if (job.distanceValue !== undefined) {
            if (job.distanceValue < 5) score += 10;
            else if (job.distanceValue < 15) score += 7;
            else if (job.distanceValue < 30) score += 4;
        }

        return Math.round(score);
    };

    // Helper function to parse salary from string
    const parseSalary = (salaryString: string): number => {
        if (!salaryString) return 0;
        const numbers = salaryString.match(/\d+/g);
        if (numbers && numbers.length > 0) {
            return parseInt(numbers[0].replace(/,/g, ''), 10);
        }
        return 0;
    };

    // Filter and sort jobs based on all criteria
    const filteredJobs = useMemo(() => {
        // First, filter jobs
        let result = nearbyJobs.filter(job => {
            // Distance filter
            if (job.distanceValue > maxDistance) return false;

            // Job Type filter
            if (filters.jobTypes.length > 0) {
                const jobType = job.type?.toLowerCase() || '';
                const matchesType = filters.jobTypes.some(type =>
                    jobType.toLowerCase().includes(type.toLowerCase())
                );
                if (!matchesType) return false;
            }

            // Salary Range filter
            if (filters.salaryRanges.length > 0) {
                const salary = parseSalary(job.salary);
                const matchesSalary = filters.salaryRanges.some(range => {
                    const rangeOption = SALARY_RANGE_OPTIONS.find(opt => opt.value === range);
                    if (rangeOption) {
                        return salary >= rangeOption.min && salary <= rangeOption.max;
                    }
                    return false;
                });
                if (!matchesSalary) return false;
            }

            return true;
        });

        // If showing recommended, calculate match scores and sort
        if (showRecommended && hasUserData) {
            result = result.map(job => ({
                ...job,
                matchScore: calculateMatchScore(job),
            })).sort((a, b) => b.matchScore - a.matchScore);
        }

        return result;
    }, [nearbyJobs, maxDistance, filters, showRecommended, hasUserData, userMatchData, SALARY_RANGE_OPTIONS]);

    // Filter handlers
    const handleFilterOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleFilterChange = (category: keyof FilterState, value: string) => {
        setFilters(prev => {
            const currentValues = prev[category];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [category]: newValues };
        });
    };

    const handleClearFilters = () => {
        setFilters({
            jobTypes: [],
            salaryRanges: [],
        });
        setShowRecommended(false);
    };

    const removeFilter = (category: keyof FilterState, value: string) => {
        setFilters(prev => {
            const currentValues = prev[category];
            return { ...prev, [category]: currentValues.filter(v => v !== value) };
        });
    };

    // Get color based on distance
    const getDistanceColor = (distance: number) => {
        if (distance < 5) return { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', icon: '#16a34a' }; // Green (< 5 km)
        if (distance <= 20) return { bg: 'rgba(56, 189, 248, 0.1)', color: '#0284c7', icon: '#0284c7' }; // Light Blue (5-20 km)
        if (distance <= 50) return { bg: 'rgba(249, 115, 22, 0.1)', color: '#ea580c', icon: '#ea580c' }; // Orange (20-50 km)
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', icon: '#dc2626' }; // Red (> 50 km)
    };

    // Fetch jobs from API
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { apiCall, API_ENDPOINTS } = await import('@/app/lib/api');
                const response = await apiCall<any[]>(API_ENDPOINTS.ALL_POSTS, { method: 'GET' });

                if (response.ok && response.data) {
                    const jobsWithLocation = response.data.filter((job: any) => job.latitude && job.longitude);

                    const jobsWithDistance = jobsWithLocation.map((job: any) => {
                        let distance = "N/A";
                        let distanceValue = Infinity;

                        if (userLocation) {
                            const R = 6371;
                            const dLat = deg2rad(job.latitude - userLocation.lat);
                            const dLon = deg2rad(job.longitude - userLocation.lon);
                            const a =
                                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                Math.cos(deg2rad(userLocation.lat)) * Math.cos(deg2rad(job.latitude)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            const d = R * c;
                            distance = d.toFixed(1) + " " + t("units.km");
                            distanceValue = d;
                        }
                        return {
                            ...job,
                            lat: job.latitude,
                            lon: job.longitude,
                            distance: distance,
                            distanceValue: distanceValue,
                            company: job.company_name || t("card.unknownCompany"),
                            type: job.job_type,
                            salary: job.salary_range || t("card.negotiable")
                        };
                    });

                    // Sort by distance
                    jobsWithDistance.sort((a: any, b: any) => a.distanceValue - b.distanceValue);

                    setNearbyJobs(jobsWithDistance);
                }
            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
        };

        if (userLocation) {
            fetchJobs();
        }
    }, [userLocation, t]);

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    const initMap = () => {
        if (!mapRef.current) return;

        if (window.longdo) {
            try {
                const mapInstance = new window.longdo.Map({
                    placeholder: mapRef.current,
                    language: 'th'
                });
                setMap(mapInstance);
            } catch (error) {
                console.error("Error initializing Longdo Map:", error);
            }
        } else {
            setTimeout(initMap, 500);
        }
    };

    useEffect(() => {
        if (window.longdo && !map) {
            initMap();
        }
    }, []);

    const handleAllowLocation = () => {
        setPermissionDialogOpen(false);
        setLoading(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lon: longitude });
                    setPermissionGranted(true);
                    setLoading(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setUserLocation({ lat: 13.7563, lon: 100.5018 });
                    setPermissionGranted(true);
                    setLoading(false);
                    alert(t("alerts.locationDenied"));
                }
            );
        } else {
            alert(t("alerts.geoNotSupported"));
            setLoading(false);
        }
    };

    const handleDenyLocation = () => {
        setPermissionDialogOpen(false);
        setUserLocation({ lat: 13.7563, lon: 100.5018 });
        setPermissionGranted(true);
        setLoading(false);
    };

    const handleJobSelect = (job: any) => {
        setSelectedJob(job);
        setDrawerOpen(true);
        if (map) {
            map.location({ lon: job.lon, lat: job.lat }, true);
            map.zoom(14);
        }
    };

    const handleApply = async () => {
        if (!selectedJob) return;

        try {
            const response = await userAPI.applyJob(selectedJob.id);

            if (response.ok) {
                setNotificationMessage(t("alerts.applySuccess") || "สมัครงานเรียบร้อยแล้ว");
                setNotificationType("success");
                setNotificationOpen(true);
            } else {
                if (response.status === 409) {
                    setNotificationMessage(t("alerts.alreadyApplied") || "คุณได้สมัครงานนี้ไปแล้ว");
                    setNotificationType("error"); // Or info/warning
                } else {
                    throw new Error(response.data?.message || "Failed to apply");
                }
                setNotificationOpen(true);
            }
        } catch (error) {
            console.error("Error applying for job:", error);
            setNotificationMessage(t("alerts.applyError") || "เกิดข้อผิดพลาดในการสมัครงาน");
            setNotificationType("error");
            setNotificationOpen(true);
        }
    };

    useEffect(() => {
        if (map && userLocation) {
            map.location({ lon: userLocation.lon, lat: userLocation.lat }, true);
            map.zoom(12);

            map.Overlays.clear();

            // Add user marker
            const userMarker = new window.longdo.Marker(
                { lon: userLocation.lon, lat: userLocation.lat },
                {
                    title: t("map.youAreHere"),
                    detail: t("map.yourLocation"),
                    icon: {
                        url: 'https://map.longdo.com/mmmap/images/pin_mark.png',
                        offset: { x: 12, y: 45 }
                    }
                }
            );
            map.Overlays.add(userMarker);

            // Add job markers
            filteredJobs.forEach(job => {
                const jobMarker = new window.longdo.Marker(
                    { lon: job.lon, lat: job.lat },
                    {
                        title: job.title,
                        detail: job.company,
                        icon: {
                            html: `<div style="background: white; padding: 6px 10px; border-radius: 20px; border: 2px solid #2563eb; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
                                     <span style="font-size: 14px;">💼</span> ${job.salary}
                                   </div>`,
                            offset: { x: 0, y: 0 }
                        }
                    }
                );
                map.Overlays.add(jobMarker);
            });

            // Bind overlay click event
            map.Event.bind('overlayClick', function (overlay: any) {
                if (overlay && overlay.location) {
                    const clickedJob = filteredJobs.find(j =>
                        Math.abs(j.lat - overlay.location().lat) < 0.0001 &&
                        Math.abs(j.lon - overlay.location().lon) < 0.0001
                    );
                    if (clickedJob) {
                        handleJobSelect(clickedJob);
                    }
                }
            });
        }
    }, [map, userLocation, filteredJobs]);

    return (
        <Container maxWidth="xl" className="!px-4 md:!px-8 py-6 h-[calc(100vh-64px)] relative">
            <Script
                src={`https://api.longdo.com/map/?key=${process.env.NEXT_PUBLIC_LONGDO_MAP_KEY || 'YOUR_LONGDO_MAP_KEY'}`}
                strategy="afterInteractive"
                onLoad={initMap}
            />

            <Box className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
                {/* Job List Side */}
                <Box className="md:col-span-4 lg:col-span-3 overflow-y-auto pr-2 space-y-4 h-full pb-20">
                    <Box className="sticky top-0 bg-white z-10 pb-4 pt-2 space-y-3">
                        <Box className="flex items-center justify-between">
                            <Box>
                                <Typography variant="h5" fontWeight="800" className="flex items-center gap-2 text-gray-800">
                                    <MapPin className="text-blue-600" strokeWidth={2.5} /> {t("title")}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t("foundJobs", { count: filteredJobs.length, distance: maxDistance })}
                                </Typography>
                            </Box>

                            {/* Filter Button */}
                            <Badge
                                badgeContent={activeFilterCount}
                                color="primary"
                                sx={{
                                    '& .MuiBadge-badge': {
                                        bgcolor: '#2563eb',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.65rem',
                                        minWidth: 18,
                                        height: 18,
                                    }
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    onClick={handleFilterOpen}
                                    startIcon={<SlidersHorizontal size={16} />}
                                    sx={{
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 2,
                                        py: 1,
                                        minWidth: 'auto',
                                        borderColor: filterOpen ? '#2563eb' : '#e5e7eb',
                                        bgcolor: filterOpen ? '#eff6ff' : 'transparent',
                                        color: filterOpen ? '#2563eb' : '#374151',
                                        '&:hover': {
                                            bgcolor: '#eff6ff',
                                            borderColor: '#2563eb',
                                        }
                                    }}
                                >
                                    {t("filter")}
                                </Button>
                            </Badge>
                        </Box>

                        {/* Active Filters Display */}
                        {activeFilterCount > 0 && (
                            <Box className="flex flex-wrap gap-2">
                                {/* Recommended Filter Chip */}
                                {showRecommended && (
                                    <Chip
                                        key="recommended"
                                        label={t("recommended")}
                                        size="small"
                                        icon={<Sparkles size={12} />}
                                        onDelete={() => setShowRecommended(false)}
                                        sx={{
                                            bgcolor: '#1f2937',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            borderRadius: '20px',
                                            border: 'none',
                                            px: 0.5,
                                            '& .MuiChip-deleteIcon': {
                                                color: 'rgba(255,255,255,0.7)',
                                                '&:hover': { color: 'white' }
                                            },
                                            '& .MuiChip-icon': { color: '#fbbf24' }
                                        }}
                                    />
                                )}
                                {filters.jobTypes.map(type => {
                                    const opt = JOB_TYPE_OPTIONS.find(o => o.value === type);
                                    return (
                                        <Chip
                                            key={`type-${type}`}
                                            label={opt?.label || type}
                                            size="small"
                                            onDelete={() => removeFilter('jobTypes', type)}
                                            sx={{
                                                bgcolor: '#eff6ff',
                                                color: '#2563eb',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #bfdbfe',
                                                '& .MuiChip-deleteIcon': { color: '#2563eb' }
                                            }}
                                        />
                                    );
                                })}
                                {filters.salaryRanges.map(range => {
                                    const opt = SALARY_RANGE_OPTIONS.find(o => o.value === range);
                                    return (
                                        <Chip
                                            key={`salary-${range}`}
                                            label={opt?.label || range}
                                            size="small"
                                            onDelete={() => removeFilter('salaryRanges', range)}
                                            sx={{
                                                bgcolor: '#f0fdf4',
                                                color: '#16a34a',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid #bbf7d0',
                                                '& .MuiChip-deleteIcon': { color: '#16a34a' }
                                            }}
                                        />
                                    );
                                })}
                                <Chip
                                    label={t("clearAll")}
                                    size="small"
                                    onClick={handleClearFilters}
                                    icon={<RotateCcw size={12} />}
                                    sx={{
                                        bgcolor: '#f3f4f6',
                                        color: '#6b7280',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: '#e5e7eb' }
                                    }}
                                />
                            </Box>
                        )}

                        {/* Distance Filter */}
                        <Box className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Typography variant="caption" fontWeight={600} color="text.secondary" className="mb-1 block">
                                {t("maxDistance", { distance: maxDistance })}
                            </Typography>
                            <Slider
                                value={maxDistance}
                                onChange={(_, value) => setMaxDistance(value as number)}
                                min={1}
                                max={100}
                                valueLabelDisplay="auto"
                                size="small"
                                sx={{ color: '#2563eb', py: 1 }}
                            />
                            <Stack direction="row" justifyContent="space-between" className="text-xs text-gray-400 px-1">
                                <span>1 km</span>
                                <span>100 km</span>
                            </Stack>
                        </Box>
                    </Box>

                    {filteredJobs.length === 0 ? (
                        <Box className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <MapPin size={48} className="mb-2 opacity-20" />
                            <Typography>{t("noJobs")}</Typography>
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => setMaxDistance(100)}
                                className="mt-2"
                            >
                                {t("expandDistance")}
                            </Button>
                        </Box>
                    ) : (
                        filteredJobs.map((job) => {
                            const distColor = getDistanceColor(job.distanceValue);
                            return (
                                <Card
                                    key={job.id}
                                    elevation={0}
                                    className={`cursor-pointer transition-all duration-200 border hover:shadow-lg ${selectedJob?.id === job.id ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                                    sx={{ borderRadius: 3 }}
                                    onClick={() => handleJobSelect(job)}
                                >
                                    <CardContent className="p-4">
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" className="mb-2">
                                            <Box>
                                                <Typography fontWeight="700" variant="subtitle1" className="line-clamp-1 text-gray-900">
                                                    {job.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" className="flex items-center gap-1.5 font-medium">
                                                    <Building2 size={14} /> {job.company}
                                                </Typography>
                                            </Box>
                                            {job.distance && (
                                                <Chip
                                                    label={job.distance}
                                                    size="small"
                                                    icon={<Navigation size={10} color={distColor.icon} />}
                                                    sx={{
                                                        height: 24,
                                                        fontSize: '0.7rem',
                                                        bgcolor: distColor.bg,
                                                        color: distColor.color,
                                                        fontWeight: 700,
                                                        border: 'none'
                                                    }}
                                                />
                                            )}
                                        </Stack>

                                        <Stack direction="row" spacing={1} className="flex-wrap gap-y-2 mt-3">
                                            {/* Match Score Badge */}
                                            {showRecommended && job.matchScore !== undefined && job.matchScore > 0 && (
                                                <Chip
                                                    size="small"
                                                    label={`${job.matchScore}% Match`}
                                                    icon={<TrendingUp size={12} />}
                                                    sx={{
                                                        bgcolor: job.matchScore >= 70 ? '#dcfce7' : job.matchScore >= 40 ? '#fef3c7' : '#f3f4f6',
                                                        color: job.matchScore >= 70 ? '#15803d' : job.matchScore >= 40 ? '#92400e' : '#6b7280',
                                                        fontWeight: 700,
                                                        fontSize: '0.7rem',
                                                        border: 'none',
                                                    }}
                                                />
                                            )}
                                            <Chip
                                                size="small"
                                                label={job.salary}
                                                icon={<DollarSign size={12} />}
                                                sx={{ ...pillSX("neutral"), bgcolor: '#f3f4f6', border: 'none' }}
                                            />
                                            <Chip
                                                size="small"
                                                label={job.type}
                                                icon={<Briefcase size={12} />}
                                                sx={{ ...pillSX("blue"), border: 'none' }}
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </Box>

                {/* Map Side */}
                <Box className="md:col-span-8 lg:col-span-9 relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 h-full">
                    {!permissionGranted && !loading && (
                        <Box className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                            <Typography color="text.secondary">{t("waitingLocation")}</Typography>
                        </Box>
                    )}

                    <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                </Box>
            </Box>

            {/* Filter Popover - Anchored to filter button */}
            <Popover
                open={filterOpen}
                anchorEl={filterAnchorEl}
                onClose={handleFilterClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid #e5e7eb',
                        width: 320,
                        overflow: 'hidden',
                    }
                }}
            >
                {/* Filter Header */}
                <Box sx={{
                    px: 2.5,
                    py: 2,
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <SlidersHorizontal size={18} className="text-gray-600" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1f2937' }}>
                            ตัวกรอง
                        </Typography>
                    </Box>
                    <IconButton onClick={handleFilterClose} size="small" sx={{ color: '#6b7280' }}>
                        <X size={18} />
                    </IconButton>
                </Box>

                {/* Filter Content */}
                <Box sx={{
                    maxHeight: 'calc(100vh - 350px)',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#e5e7eb', borderRadius: 2 },
                }}>
                    {/* Recommended Jobs Section */}
                    <Box sx={{ p: 2.5, borderBottom: '1px solid #f3f4f6' }}>
                        <Box
                            onClick={() => hasUserData && setShowRecommended(!showRecommended)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: hasUserData ? 'pointer' : 'not-allowed',
                                opacity: hasUserData ? 1 : 0.5,
                                p: 1.5,
                                borderRadius: '12px',
                                bgcolor: showRecommended ? '#1f2937' : '#f9fafb',
                                border: showRecommended ? '1.5px solid #1f2937' : '1.5px solid #e5e7eb',
                                transition: 'all 0.2s ease',
                                '&:hover': hasUserData ? {
                                    bgcolor: showRecommended ? '#1f2937' : '#f3f4f6',
                                    borderColor: showRecommended ? '#1f2937' : '#d1d5db',
                                } : {},
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    bgcolor: showRecommended ? '#fbbf24' : '#e5e7eb',
                                    p: 0.75,
                                    borderRadius: '8px',
                                    display: 'flex',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <Sparkles size={16} color={showRecommended ? '#1f2937' : '#6b7280'} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: showRecommended ? 'white' : '#374151', lineHeight: 1.2 }}>
                                        งานแนะนำสำหรับคุณ
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: showRecommended ? 'rgba(255,255,255,0.7)' : '#9ca3af', fontSize: '0.7rem' }}>
                                        {hasUserData ? 'เรียงตามความเหมาะสมกับโปรไฟล์' : 'กรุณาทำ AI Score ก่อน'}
                                    </Typography>
                                </Box>
                            </Box>
                            {hasUserData && (
                                <Box sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '6px',
                                    bgcolor: showRecommended ? '#fbbf24' : 'white',
                                    border: showRecommended ? 'none' : '2px solid #d1d5db',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                }}>
                                    {showRecommended && <CheckCircle2 size={14} color="#1f2937" />}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Job Type Section */}
                    <Box sx={{ p: 2.5, borderBottom: '1px solid #f3f4f6' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Briefcase size={15} className="text-gray-500" />
                            ประเภทงาน
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {JOB_TYPE_OPTIONS.map(option => (
                                <Chip
                                    key={option.value}
                                    label={option.label}
                                    onClick={() => handleFilterChange('jobTypes', option.value)}
                                    size="small"
                                    sx={{
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        height: 32,
                                        bgcolor: filters.jobTypes.includes(option.value)
                                            ? '#eff6ff'
                                            : '#f9fafb',
                                        color: filters.jobTypes.includes(option.value)
                                            ? '#2563eb'
                                            : '#6b7280',
                                        border: filters.jobTypes.includes(option.value)
                                            ? '1.5px solid #2563eb'
                                            : '1.5px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            bgcolor: filters.jobTypes.includes(option.value)
                                                ? '#eff6ff'
                                                : '#f3f4f6',
                                            borderColor: filters.jobTypes.includes(option.value)
                                                ? '#2563eb'
                                                : '#d1d5db',
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Salary Range Section - Commented out, uncomment and add Banknote import if needed */}
                    {/* <Box sx={{ p: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DollarSign size={15} className="text-gray-500" />
                            ช่วงเงินเดือน (บาท/เดือน)
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {SALARY_RANGE_OPTIONS.map(option => (
                                <Chip
                                    key={option.value}
                                    label={option.label}
                                    onClick={() => handleFilterChange('salaryRanges', option.value)}
                                    size="small"
                                    sx={{
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        height: 32,
                                        bgcolor: filters.salaryRanges.includes(option.value)
                                            ? '#f0fdf4'
                                            : '#f9fafb',
                                        color: filters.salaryRanges.includes(option.value)
                                            ? '#16a34a'
                                            : '#6b7280',
                                        border: filters.salaryRanges.includes(option.value)
                                            ? '1.5px solid #16a34a'
                                            : '1.5px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            bgcolor: filters.salaryRanges.includes(option.value)
                                                ? '#f0fdf4'
                                                : '#f3f4f6',
                                            borderColor: filters.salaryRanges.includes(option.value)
                                                ? '#16a34a'
                                                : '#d1d5db',
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </Box> */}
                </Box>

                {/* Filter Footer */}
                <Box sx={{
                    p: 2,
                    borderTop: '1px solid #f3f4f6',
                    bgcolor: 'white',
                    display: 'flex',
                    gap: 1.5,
                }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleClearFilters}
                        startIcon={<RotateCcw size={14} />}
                        size="small"
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1,
                            borderColor: '#e5e7eb',
                            color: '#6b7280',
                            '&:hover': {
                                borderColor: '#d1d5db',
                                bgcolor: '#f9fafb',
                            }
                        }}
                    >
                        ล้างตัวกรอง
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleFilterClose}
                        size="small"
                        sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1,
                            bgcolor: '#2563eb',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: '#1d4ed8',
                                boxShadow: 'none',
                            }
                        }}
                    >
                        ดูผลลัพธ์ ({filteredJobs.length})
                    </Button>
                </Box>
            </Popover>

            <Drawer
                anchor={isMobile ? "bottom" : "right"}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: isMobile ? '100%' : 500,
                        height: isMobile ? '90vh' : '100%',
                        borderRadius: isMobile ? '32px 32px 0 0' : 0,
                        p: 0,
                        bgcolor: '#f8fafc'
                    }
                }}
            >
                {selectedJob && (
                    <Box className="h-full flex flex-col">
                        {/* Sticky Header */}
                        <Box className="px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
                            <Box className="flex-1 pr-4">
                                <Typography variant="h6" fontWeight="800" className="text-gray-900 leading-tight line-clamp-1">
                                    {selectedJob.title}
                                </Typography>
                                <Typography variant="caption" className="text-blue-600 font-bold flex items-center gap-1.5 mt-0.5">
                                    <Building2 size={14} /> {selectedJob.company}
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={() => setDrawerOpen(false)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                                size="small"
                            >
                                <X size={20} />
                            </IconButton>
                        </Box>

                        {/* Scrollable Content */}
                        <Box className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

                            {/* 1. Bento Widgets Grid */}
                            <Box className="grid grid-cols-2 gap-4">
                                {/* Salary Widget */}
                                <Box className="bg-[#ecfdf5] p-5 rounded-[28px] flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all border border-green-100">
                                    <Box className="bg-white/60 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <DollarSign size={18} className="text-green-700" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="800" className="text-green-900 leading-tight">
                                            {selectedJob.salary}
                                        </Typography>
                                        <Typography variant="caption" fontWeight="700" className="text-green-700/70 uppercase tracking-wide text-[10px]">
                                            Salary
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Job Type Widget */}
                                <Box className="bg-[#eff6ff] p-5 rounded-[28px] flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all border border-blue-100">
                                    <Box className="bg-white/60 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <Briefcase size={18} className="text-blue-700" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="800" className="text-blue-900 leading-tight">
                                            {selectedJob.type}
                                        </Typography>
                                        <Typography variant="caption" fontWeight="700" className="text-blue-700/70 uppercase tracking-wide text-[10px]">
                                            Job Type
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Distance Widget */}
                                <Box className="bg-[#fff7ed] p-5 rounded-[28px] flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all border border-orange-100">
                                    <Box className="bg-white/60 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <Navigation size={18} className="text-orange-700" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="800" className="text-orange-900 leading-tight">
                                            {selectedJob.distance}
                                        </Typography>
                                        <Typography variant="caption" fontWeight="700" className="text-orange-700/70 uppercase tracking-wide text-[10px]">
                                            Distance
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Apply Widget (Action) */}
                                <Box
                                    className="bg-[#faf5ff] p-5 rounded-[28px] flex flex-col justify-center items-center h-32 cursor-pointer hover:bg-[#f3e8ff] transition-all active:scale-95 border border-purple-100 group"
                                    onClick={handleApply}
                                >
                                    <Box className="bg-purple-100 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                        <Briefcase size={20} className="text-purple-600" />
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight="800" className="text-purple-900">
                                        Apply Now
                                    </Typography>
                                </Box>
                            </Box>

                            {/* 2. Description Section */}
                            <Box className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                <Typography variant="h6" fontWeight="800" className="mb-3 text-gray-800 flex items-center gap-2">
                                    รายละเอียดงาน
                                </Typography>
                                <Typography variant="body1" color="text.secondary" className="leading-relaxed whitespace-pre-line text-sm">
                                    {selectedJob.description || "ไม่ระบุรายละเอียด"}
                                </Typography>
                            </Box>

                            {/* 3. Responsibilities & Qualifications */}
                            <Box className="grid grid-cols-1 gap-4">
                                <Box className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                    <Typography variant="h6" fontWeight="800" className="mb-4 text-gray-800">
                                        หน้าที่ความรับผิดชอบ
                                    </Typography>
                                    {selectedJob.responsibilities ? (
                                        <ul className="space-y-3">
                                            {selectedJob.responsibilities.split('\n').map((item: string, index: number) => (
                                                item.trim() && (
                                                    <li key={index} className="flex items-start gap-3 text-gray-600 text-sm">
                                                        <Box className="mt-1 p-1 bg-blue-50 rounded-full shrink-0">
                                                            <CheckCircle2 size={12} className="text-blue-500" />
                                                        </Box>
                                                        <span className="font-medium">{item}</span>
                                                    </li>
                                                )
                                            ))}
                                        </ul>
                                    ) : (
                                        <Typography color="text.secondary" className="text-sm">- ไม่ระบุ -</Typography>
                                    )}
                                </Box>

                                <Box className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                    <Typography variant="h6" fontWeight="800" className="mb-4 text-gray-800">
                                        คุณสมบัติ
                                    </Typography>
                                    {selectedJob.qualifications ? (
                                        <ul className="space-y-3">
                                            {selectedJob.qualifications.split('\n').map((item: string, index: number) => (
                                                item.trim() && (
                                                    <li key={index} className="flex items-start gap-3 text-gray-600 text-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                                        <span className="font-medium">{item}</span>
                                                    </li>
                                                )
                                            ))}
                                        </ul>
                                    ) : (
                                        <Typography color="text.secondary" className="text-sm">- ไม่ระบุ -</Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* 4. Benefits */}
                            <Box className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                                <Typography variant="h6" fontWeight="800" className="mb-4 text-gray-800">
                                    สวัสดิการ
                                </Typography>
                                {selectedJob.benefits ? (
                                    <Box className="flex flex-wrap gap-2">
                                        {selectedJob.benefits.split('\n').map((item: string, index: number) => (
                                            item.trim() && (
                                                <Chip
                                                    key={index}
                                                    label={item}
                                                    icon={<CheckCircle2 size={12} />}
                                                    sx={{
                                                        bgcolor: '#f0fdf4',
                                                        color: '#15803d',
                                                        fontWeight: 600,
                                                        borderRadius: '12px',
                                                        border: '1px solid #dcfce7',
                                                        height: 32,
                                                        '& .MuiChip-icon': { color: '#15803d' }
                                                    }}
                                                />
                                            )
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary" className="text-sm">- ไม่ระบุ -</Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* Permission Dialog */}
            <Dialog
                open={permissionDialogOpen}
                onClose={handleDenyLocation}
                aria-labelledby="location-permission-title"
                aria-describedby="location-permission-description"
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle id="location-permission-title" fontWeight={700}>
                    {"อนุญาตให้เข้าถึงตำแหน่งของคุณ?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="location-permission-description">
                        เพื่อช่วยให้คุณค้นหางานที่อยู่ใกล้ตัวคุณได้ง่ายขึ้น เราขออนุญาตเข้าถึงตำแหน่งปัจจุบันของคุณ
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleDenyLocation} color="inherit" sx={{ borderRadius: 2 }}>
                        {t("alerts.cancel")}
                    </Button>
                    <Button onClick={handleAllowLocation} variant="contained" autoFocus sx={{ borderRadius: 2, px: 3 }}>
                        {t("alerts.allow")}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notificationOpen}
                autoHideDuration={4000}
                onClose={() => setNotificationOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setNotificationOpen(false)}
                    severity={notificationType}
                    sx={{ width: '100%', borderRadius: 3 }}
                >
                    {notificationMessage}
                </Alert>
            </Snackbar>
        </Container >
    );
}
