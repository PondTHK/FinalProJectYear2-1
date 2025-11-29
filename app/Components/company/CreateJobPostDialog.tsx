"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Paper,
    ClickAwayListener,
} from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon, LocationOn as LocationIcon } from "@mui/icons-material";
import Script from "next/script";
import { companyAPI, CompanyPostPayload, CompanyPostResponse } from "@/app/lib/api";

interface CreateJobPostDialogProps {
    open: boolean;
    onClose: () => void;
    companyId: string;
    post?: CompanyPostResponse | null; // For edit mode
    onSuccess?: () => void;
}

export default function CreateJobPostDialog({
    open,
    onClose,
    companyId,
    post,
    onSuccess,
}: CreateJobPostDialogProps) {
    const isEditMode = !!post;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CompanyPostPayload>({
        title: "",
        location: "",
        job_type: "Full-Time",
        description: "",
        salary_range: "",
        tags: [],
        status: "active",
        responsibilities: "",
        qualifications: "",
        benefits: "",
    });
    const [tagInput, setTagInput] = useState("");

    const mapRef = React.useRef<any>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [mapSearchQuery, setMapSearchQuery] = useState("");
    const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Load post data when in edit mode
    useEffect(() => {
        if (open && post) {
            setFormData({
                title: post.title || "",
                location: post.location || "",
                latitude: post.latitude || null,
                longitude: post.longitude || null,
                job_type: post.job_type || "Full-Time",
                description: post.description || "",
                salary_range: post.salary_range || "",
                tags: post.tags || [],
                status: post.status || "active",
                responsibilities: post.responsibilities || "",
                qualifications: post.qualifications || "",
                benefits: post.benefits || "",
            });
        } else if (open && !post) {
            // Reset form for create mode
            setFormData({
                title: "",
                location: "",
                latitude: null,
                longitude: null,
                job_type: "Full-Time",
                description: "",
                salary_range: "",
                tags: [],
                status: "active",
                responsibilities: "",
                qualifications: "",
                benefits: "",
            });
            setTagInput("");
        }
    }, [open, post]);

    // Initialize Map
    useEffect(() => {
        if (open && !mapInitialized) {
            const initMap = () => {
                if ((window as any).longdo && document.getElementById('job-creation-map')) {
                    const map = new (window as any).longdo.Map({
                        placeholder: document.getElementById('job-creation-map'),
                        language: 'th',
                        ui: (window as any).longdo.UiComponent.None, // Remove all UI elements
                        zoom: 12
                    });
                    mapRef.current = map;
                    setMapInitialized(true);

                    // If editing and has location, set marker
                    if (post?.latitude && post?.longitude) {
                        map.location({ lon: post.longitude, lat: post.latitude }, true);
                        map.Overlays.add(new (window as any).longdo.Marker({ lon: post.longitude, lat: post.latitude }));
                    } else {
                        // Default to Bangkok
                        map.location({ lon: 100.5018, lat: 13.7563 }, true);
                    }

                    // Bind click event
                    map.Event.bind('click', function () {
                        const mouseLocation = map.location((window as any).longdo.LocationMode.Pointer);
                        if (mouseLocation) {
                            map.Overlays.clear();
                            map.Overlays.add(new (window as any).longdo.Marker(mouseLocation));
                            setFormData(prev => ({
                                ...prev,
                                latitude: mouseLocation.lat,
                                longitude: mouseLocation.lon
                            }));
                        }
                    });
                } else {
                    setTimeout(initMap, 500);
                }
            };
            initMap();
        }
    }, [open, mapInitialized, post]);

    // Search location using Longdo API
    const handleMapSearch = async (query: string) => {
        if (!query.trim()) {
            setMapSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(query)}&limit=5&key=${process.env.NEXT_PUBLIC_LONGDO_MAP_KEY}`
            );
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                setMapSearchResults(data.data);
                setShowSearchResults(true);
            } else {
                setMapSearchResults([]);
                setShowSearchResults(false);
            }
        } catch (error) {
            console.error("Map search error:", error);
            setMapSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle selecting a search result
    const handleSelectSearchResult = (result: any) => {
        if (mapRef.current && result.lat && result.lon) {
            const location = { lat: parseFloat(result.lat), lon: parseFloat(result.lon) };
            mapRef.current.location(location, true);
            mapRef.current.Overlays.clear();
            mapRef.current.Overlays.add(new (window as any).longdo.Marker(location));
            
            setFormData(prev => ({
                ...prev,
                latitude: location.lat,
                longitude: location.lon,
                location: result.name || prev.location
            }));
        }
        setShowSearchResults(false);
        setMapSearchQuery(result.name || "");
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (mapSearchQuery) {
                handleMapSearch(mapSearchQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [mapSearchQuery]);

    const handleSubmit = async () => {
        // Validation
        if (!formData.title.trim()) {
            setError("Job title is required");
            return;
        }
        if (!formData.location.trim()) {
            setError("Location is required");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload: CompanyPostPayload = {
                ...formData,
                description: formData.description?.trim() || null,
                salary_range: formData.salary_range?.trim() || null,
                tags: formData.tags && formData.tags.length > 0 ? formData.tags : null,
                responsibilities: formData.responsibilities?.trim() || null,
                qualifications: formData.qualifications?.trim() || null,
                benefits: formData.benefits?.trim() || null,
                latitude: formData.latitude ?? null,
                longitude: formData.longitude ?? null,
            };

            let response;
            if (isEditMode && post) {
                // Update existing post
                response = await companyAPI.updatePost(post.id, payload);
            } else {
                // Create new post
                response = await companyAPI.createPost(companyId, payload);
            }

            if (response.ok) {
                // Reset form
                setFormData({
                    title: "",
                    location: "",
                    job_type: "Full-Time",
                    description: "",
                    salary_range: "",
                    tags: [],
                    status: "active",
                    responsibilities: "",
                    qualifications: "",
                    benefits: "",
                });
                setTagInput("");

                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            } else {
                setError(isEditMode ? "Failed to update job post. Please try again." : "Failed to create job post. Please try again.");
            }
        } catch (err) {
            console.error("Error creating job post:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.tags?.includes(tag)) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tag],
            });
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
        });
    };

    const handleClose = () => {
        if (!loading) {
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight={700}>
                        {isEditMode ? "Edit Job Post" : "Create Job Post"}
                    </Typography>
                    <Button
                        onClick={handleClose}
                        disabled={loading}
                        sx={{ minWidth: "auto", p: 1 }}
                    >
                        <CloseIcon />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Job Title */}
                    <TextField
                        label="Job Title"
                        placeholder="e.g., Senior Frontend Engineer"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        fullWidth
                        disabled={loading}
                    />

                    {/* Location */}
                    <TextField
                        label="Location"
                        placeholder="e.g., Bangkok, Thailand"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        fullWidth
                        disabled={loading}
                        // InputProps
                        
                    />

                    {/* Map for Location Picking */}
                    <Box sx={{ width: '100%', position: 'relative' }}>
                        {/* Map Search Box */}
                        <ClickAwayListener onClickAway={() => setShowSearchResults(false)}>
                            <Box sx={{ position: 'relative', mb: 1 }}>
                                <TextField
                                    placeholder="ค้นหาสถานที่..."
                                    value={mapSearchQuery}
                                    onChange={(e) => setMapSearchQuery(e.target.value)}
                                    fullWidth
                                    size="small"
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: isSearching ? (
                                            <InputAdornment position="end">
                                                <CircularProgress size={20} />
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                                {/* Search Results Dropdown */}
                                {showSearchResults && mapSearchResults.length > 0 && (
                                    <Paper
                                        sx={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            zIndex: 1100,
                                            maxHeight: 200,
                                            overflow: 'auto',
                                            mt: 0.5,
                                            boxShadow: 3,
                                        }}
                                    >
                                        <List dense disablePadding>
                                            {mapSearchResults.map((result, index) => (
                                                <ListItem key={index} disablePadding>
                                                    <ListItemButton onClick={() => handleSelectSearchResult(result)}>
                                                        <LocationIcon sx={{ mr: 1, color: 'error.main', fontSize: 20 }} />
                                                        <ListItemText
                                                            primary={result.name}
                                                            secondary={result.address}
                                                            primaryTypographyProps={{ fontSize: 14 }}
                                                            secondaryTypographyProps={{ fontSize: 12, noWrap: true }}
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                )}
                            </Box>
                        </ClickAwayListener>

                        {/* Map Container */}
                        <Box sx={{ height: 300, width: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}>
                            {/* Load Longdo Map Script */}
                            <Script
                                src={`https://api.longdo.com/map/?key=${process.env.NEXT_PUBLIC_LONGDO_MAP_KEY}`}
                                strategy="lazyOnload"
                                onLoad={() => {
                                    console.log("Longdo Map Script Loaded");
                                }}
                            />
                            <div id="job-creation-map" style={{ width: '100%', height: '100%' }}></div>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                            คลิกบนแผนที่เพื่อปักหมุดตำแหน่ง หรือค้นหาสถานที่ด้านบน
                        </Typography>
                    </Box>

                    {/* Job Type */}
                    <FormControl fullWidth required disabled={loading}>
                        <InputLabel>Job Type</InputLabel>
                        <Select
                            value={formData.job_type}
                            label="Job Type"
                            onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                        >
                            <MenuItem value="Full-Time">Full-Time</MenuItem>
                            <MenuItem value="Part-Time">Part-Time</MenuItem>
                            <MenuItem value="Contract">Contract</MenuItem>
                            <MenuItem value="Internship">Internship</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Description */}
                    <TextField
                        label="Job Description (Optional)"
                        placeholder="Describe the role, responsibilities, and requirements..."
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        disabled={loading}
                        helperText="Provide detailed information about the position"
                    />

                    {/* Responsibilities */}
                    <TextField
                        label="หน้าที่ความรับผิดชอบ (Responsibilities)"
                        placeholder="ระบุหน้าที่และความรับผิดชอบของตำแหน่งงาน..."
                        value={formData.responsibilities || ""}
                        onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        disabled={loading}
                        helperText="ระบุหน้าที่และความรับผิดชอบหลักของตำแหน่งงาน"
                    />

                    {/* Qualifications */}
                    <TextField
                        label="คุณสมบัติ (Qualifications)"
                        placeholder="ระบุคุณสมบัติที่ต้องการ เช่น ประสบการณ์, ทักษะ, การศึกษา..."
                        value={formData.qualifications || ""}
                        onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        disabled={loading}
                        helperText="ระบุคุณสมบัติที่ต้องการสำหรับตำแหน่งงาน"
                    />

                    {/* Benefits */}
                    <TextField
                        label="สวัสดิการ (Benefits)"
                        placeholder="ระบุสวัสดิการที่บริษัทมอบให้ เช่น ประกันสุขภาพ, วันหยุด, โบนัส..."
                        value={formData.benefits || ""}
                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        disabled={loading}
                        helperText="ระบุสวัสดิการและผลประโยชน์ที่บริษัทมอบให้"
                    />

                    {/* Salary Range */}
                    <TextField
                        label="Salary Range (Optional)"
                        placeholder="e.g., ฿45,000-65,000 /mo or $2,000-3,000 /mo"
                        value={formData.salary_range || ""}
                        onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                        fullWidth
                        disabled={loading}
                        helperText="Examples: ฿40,000-60,000 /mo, $10 /hour, Negotiable"
                    />

                    {/* Tags */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Skills/Tags (Optional)
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                            <TextField
                                placeholder="Add a tag (e.g., React, TypeScript)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                size="small"
                                fullWidth
                                disabled={loading}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddTag}
                                disabled={loading || !tagInput.trim()}
                                sx={{ whiteSpace: "nowrap" }}
                            >
                                Add Tag
                            </Button>
                        </Box>
                        {formData.tags && formData.tags.length > 0 && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                {formData.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => handleRemoveTag(tag)}
                                        disabled={loading}
                                        sx={{ bgcolor: "primary.light", color: "primary.main" }}
                                    />
                                ))}
                            </Stack>
                        )}
                    </Box>

                    {/* Status */}
                    <FormControl fullWidth required disabled={loading}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={formData.status}
                            label="Status"
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <MenuItem value="active">Active (Published)</MenuItem>
                            <MenuItem value="draft">Draft (Not Published)</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={loading} variant="outlined">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        minWidth: 120,
                        boxShadow: "0 4px 6px -1px rgb(59 130 246 / 0.3)",
                    }}
                >
                    {loading ? <CircularProgress size={24} /> : isEditMode ? "Update Job Post" : "Create Job Post"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
