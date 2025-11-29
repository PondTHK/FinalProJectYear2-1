"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useOnboarding } from '@/app/context/OnboardingContext';
import FacebookIcon from '@mui/icons-material/Facebook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import PublicIcon from '@mui/icons-material/Public';
import { aiAPI, socialAPI } from '@/app/lib/api';
import { Box, Typography, Chip, CircularProgress, Paper, Button, Avatar } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function SocialConnectButton() {
    const t = useTranslations('Onboarding.socialMedia');
    const { socialData, setSocialData } = useOnboarding();
    const [showModal, setShowModal] = useState(false);
    const [loginStep, setLoginStep] = useState<'permission' | 'authenticating' | 'fetching' | 'success'>('permission');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    const loadSocialDataFromBackend = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await socialAPI.getSocialData();
            if (res.ok && res.data && res.data.length > 0) {
                const firstData = res.data[0];
                // Transform backend data to frontend format
                const transformedData = {
                    name: firstData.connection.name || t('time.unknown'),
                    profileImage: firstData.connection.profile_image || '',
                    posts: firstData.posts.map((post: any) => ({
                        id: post.platform_post_id,
                        content: post.content,
                        date: post.posted_at ? formatDate(post.posted_at) : t('time.unknown'),
                        likes: post.likes_count || 0,
                        comments: post.comments_count || 0,
                    })),
                };
                setSocialData(transformedData);

                // Load analysis if exists
                if (firstData.analysis) {
                    const transformedAnalysis = {
                        big_five_scores: {
                            Openness: firstData.analysis.big_five_scores.openness || 0,
                            Conscientiousness: firstData.analysis.big_five_scores.conscientiousness || 0,
                            Extraversion: firstData.analysis.big_five_scores.extraversion || 0,
                            Agreeableness: firstData.analysis.big_five_scores.agreeableness || 0,
                            Neuroticism: firstData.analysis.big_five_scores.neuroticism || 0,
                        },
                        analyzed_posts: firstData.analysis.analyzed_posts || [],
                        strengths: firstData.analysis.strengths || [],
                        work_style: firstData.analysis.work_style || null,
                    };
                    setAnalysisResult(transformedAnalysis);
                }
            }
        } catch (error) {
            console.error('Failed to load social data from backend:', error);
            // Silently fail - user can still connect manually
        } finally {
            setIsLoading(false);
        }
    }, [setSocialData]);

    // Load social data from backend on mount
    useEffect(() => {
        loadSocialDataFromBackend();
    }, [loadSocialDataFromBackend]);

    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffHours < 1) return t('time.justNow');
            if (diffHours < 24) return t('time.hoursAgo', { hours: diffHours });
            if (diffDays === 1) return t('time.yesterday');
            if (diffDays < 7) return t('time.daysAgo', { days: diffDays });
            if (diffDays < 30) return t('time.weeksAgo', { weeks: Math.floor(diffDays / 7) });
            return date.toLocaleDateString();
        } catch {
            return t('time.unknown');
        }
    };

    const handleConnect = () => {
        setShowModal(true);
        setLoginStep('permission');
    };

    const confirmLogin = async () => {
        setLoginStep('authenticating');

        try {
            // 1. Simulate Auth Delay (Realistic)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // For now, use mock data but save to backend
            const authRes = await fetch('/api/mock/social-auth', { method: 'POST' });
            const authData = await authRes.json();

            if (authData.success) {
                setLoginStep('fetching');
                // 2. Simulate Data Fetching Delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                const dataRes = await fetch('/api/mock/social-data');
                const socialContent = await dataRes.json();

                if (socialContent.success) {
                    setLoginStep('success');
                    // Short delay to show success state
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Save to backend
                    await saveSocialDataToBackend(socialContent.data);

                    setSocialData(socialContent.data);
                    setShowModal(false);

                    // 3. Trigger AI Analysis
                    analyzeSocialData(socialContent.data);
                }
            }
        } catch (error) {
            console.error("Social connection failed", error);
            setLoginStep('permission'); // Reset on error
        }
    };

    const saveSocialDataToBackend = async (data: any) => {
        try {
            const { socialAPI } = await import('@/app/lib/api');

            // 1. Check if connection already exists
            let connection;
            const existingConnectionsRes = await socialAPI.getConnections();

            if (existingConnectionsRes.ok && existingConnectionsRes.data && existingConnectionsRes.data.length > 0) {
                // Use existing connection
                connection = existingConnectionsRes.data[0];
                console.log('Using existing connection:', connection.id);
            } else {
                // Create new connection
                const connectionRes = await socialAPI.createConnection({
                    platform: 'facebook',
                    platform_user_id: data.id || 'mock_user_id',
                    access_token: 'mock_access_token',
                    refresh_token: null,
                    expires_at: null,
                    name: data.name || null,
                    profile_image: data.profileImage || null,
                });

                if (!connectionRes.ok) {
                    // If create fails, try to fetch again (maybe race condition or just created)
                    const retryConnectionsRes = await socialAPI.getConnections();
                    if (retryConnectionsRes.ok && retryConnectionsRes.data && retryConnectionsRes.data.length > 0) {
                        connection = retryConnectionsRes.data[0];
                    } else {
                        throw new Error('Failed to create connection');
                    }
                } else {
                    connection = connectionRes.data;
                }
            }

            // 2. Create posts
            if (data.posts && data.posts.length > 0) {
                const posts = data.posts.map((post: any) => ({
                    platform_post_id: post.id || `post_${Date.now()}_${Math.random()}`,
                    content: post.content,
                    posted_at: post.date ? parseRelativeDate(post.date) : null,
                    likes_count: post.likes || null,
                    comments_count: post.comments || null,
                }));

                await socialAPI.createPosts(connection.id, posts);
            }
        } catch (error) {
            console.error('Failed to save social data to backend:', error);
            // Don't throw - allow UI to continue even if backend save fails
        }
    };

    const parseRelativeDate = (dateStr: string): string | null => {
        // Simple parser for relative dates like "2 hours ago", "Yesterday", etc.
        // For production, use a proper date library
        try {
            const now = new Date();
            if (dateStr.includes('hour')) {
                const hours = parseInt(dateStr) || 0;
                const date = new Date(now.getTime() - hours * 60 * 60 * 1000);
                return date.toISOString();
            } else if (dateStr.includes('day')) {
                const days = parseInt(dateStr) || 1;
                const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                return date.toISOString();
            } else if (dateStr.toLowerCase().includes('yesterday')) {
                const date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                return date.toISOString();
            } else if (dateStr.toLowerCase().includes('week')) {
                const weeks = parseInt(dateStr) || 1;
                const date = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
                return date.toISOString();
            }
            return null;
        } catch {
            return null;
        }
    };

    const analyzeSocialData = async (data: any) => {
        if (!data || !data.posts) return;

        setIsAnalyzing(true);
        try {
            const postsContent = data.posts.map((p: any) => p.content);
            // Simulate AI thinking time for effect
            await new Promise(resolve => setTimeout(resolve, 2000));
            const result = await aiAPI.analyzePersonality(postsContent);

            // Merge original post data with analysis result if possible, or just use analysis result
            // The AI returns analyzed_posts array which matches the order of input posts
            if (result.analyzed_posts && result.analyzed_posts.length === data.posts.length) {
                result.analyzed_posts = result.analyzed_posts.map((analysis: any, index: number) => ({
                    ...analysis,
                    original_post: data.posts[index]
                }));
            }

            // Save analysis to backend
            await saveAnalysisToBackend(result);

            setAnalysisResult(result);
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const saveAnalysisToBackend = async (analysisResult: any) => {
        try {
            console.log('Saving analysis to backend...', analysisResult);
            const { socialAPI } = await import('@/app/lib/api');

            // Get the connection ID
            let connectionId;

            // First try to get from current socialData state
            if (socialData && socialData.connection && socialData.connection.id) {
                connectionId = socialData.connection.id;
            } else {
                // Fallback to fetching from API
                const connectionsRes = await socialAPI.getConnections();
                if (connectionsRes.ok && connectionsRes.data && connectionsRes.data.length > 0) {
                    connectionId = connectionsRes.data[0].id;
                }
            }

            if (!connectionId) {
                console.warn('No social connections found to save analysis');
                return;
            }

            console.log('Using connection ID:', connectionId);

            // Transform big_five_scores to match backend format
            const bigFiveScores = {
                openness: analysisResult.big_five_scores?.Openness || 0,
                conscientiousness: analysisResult.big_five_scores?.Conscientiousness || 0,
                extraversion: analysisResult.big_five_scores?.Extraversion || 0,
                agreeableness: analysisResult.big_five_scores?.Agreeableness || 0,
                neuroticism: analysisResult.big_five_scores?.Neuroticism || 0,
            };

            const payload = {
                big_five_scores: bigFiveScores,
                analyzed_posts: analysisResult.analyzed_posts || null,
                strengths: analysisResult.strengths || null,
                work_style: analysisResult.work_style || null,
            };

            console.log('Sending analysis payload:', payload);

            const res = await socialAPI.createAnalysis(connectionId, payload);
            console.log('Save analysis response:', res);

        } catch (error) {
            console.error('Failed to save analysis to backend:', error);
            // Don't throw - allow UI to continue even if backend save fails
        }
    };

    // Prepare data for Radar Chart
    const chartData = analysisResult?.big_five_scores ? [
        { subject: 'เปิดรับประสบการณ์', A: analysisResult.big_five_scores.Openness || 0, fullMark: 100 },
        { subject: 'มีวินัย', A: analysisResult.big_five_scores.Conscientiousness || 0, fullMark: 100 },
        { subject: 'ชอบเข้าสังคม', A: analysisResult.big_five_scores.Extraversion || 0, fullMark: 100 },
        { subject: 'เป็นมิตร', A: analysisResult.big_five_scores.Agreeableness || 0, fullMark: 100 },
        { subject: 'อ่อนไหวทางอารมณ์', A: analysisResult.big_five_scores.Neuroticism || 0, fullMark: 100 },
    ] : [];

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (socialData) {
        return (
            <Box sx={{ width: '100%', maxWidth: 700 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            bgcolor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 4,
                            mb: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <Avatar
                            src="https://media.discordapp.net/attachments/1383375037184348246/1444010665957392497/IMG_2028.jpg?ex=692b273b&is=6929d5bb&hm=3f51e0bb215ac32ef4e971c488614683afe517717f962421816913c84122c3e3&=&format=webp&width=1168&height=1558"
                            sx={{ width: 56, height: 56, border: '2px solid #22c55e' }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="#15803d">
                                    {t('connectedSuccess')}
                                </Typography>
                                <CheckCircleIcon sx={{ color: '#22c55e' }} />
                            </Box>
                            <Typography variant="body2" color="#166534">
                                {t('accountInfo', { name: socialData.name, count: socialData.posts.length })}
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            onClick={async () => {
                                try {
                                    const { socialAPI } = await import('@/app/lib/api');
                                    const connectionsRes = await socialAPI.getConnections();
                                    if (connectionsRes.ok && connectionsRes.data && connectionsRes.data.length > 0) {
                                        // Delete the first connection (or find matching one)
                                        await socialAPI.deleteConnection(connectionsRes.data[0].id);
                                    }
                                } catch (error) {
                                    console.error('Failed to delete connection:', error);
                                }
                                setSocialData(null);
                                setAnalysisResult(null);
                            }}
                        >
                            {t('disconnectButton')}
                        </Button>
                    </Paper>
                </motion.div>

                <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                        <Box
                            component={motion.div}
                            key="analyzing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}
                        >
                            <Box sx={{ position: 'relative', width: 96, height: 96, mb: 3 }}>
                                <CircularProgress size={96} sx={{ color: '#d8b4fe', position: 'absolute' }} thickness={2} />
                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ bgcolor: 'linear-gradient(to top right, #9333ea, #4f46e5)', borderRadius: '50%', p: 2, boxShadow: '0 10px 15px -3px rgba(147, 51, 234, 0.3)' }}>
                                        <AutoAwesomeIcon sx={{ fontSize: 40, color: '#9333ea' }} />
                                    </Box>
                                </Box>
                            </Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ background: 'linear-gradient(to right, #9333ea, #4f46e5)', backgroundClip: 'text', color: 'transparent', mb: 1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {t('analyzing.title')}
                            </Typography>
                            <Typography color="text.secondary">
                                {t('analyzing.subtitle')}
                            </Typography>
                        </Box>
                    ) : analysisResult ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                        >
                            <Paper
                                elevation={3}
                                sx={{
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    background: 'white',
                                    border: '1px solid rgba(147, 51, 234, 0.1)',
                                    boxShadow: '0 20px 40px -10px rgba(147, 51, 234, 0.15)'
                                }}
                            >
                                <Box sx={{ p: 3, background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)', borderBottom: '1px solid rgba(147, 51, 234, 0.1)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#9333ea', color: 'white', display: 'flex' }}>
                                                <AutoAwesomeIcon />
                                            </Box>
                                            <Typography variant="h6" fontWeight="800" color="#4c1d95">
                                                {t('result.title')}
                                            </Typography>
                                        </Box>
                                        {analysisResult.analyzed_posts && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => setShowAnalysisModal(true)}
                                                sx={{
                                                    bgcolor: '#9333ea',
                                                    '&:hover': { bgcolor: '#7e22ce' },
                                                    textTransform: 'none',
                                                    borderRadius: 2
                                                }}
                                            >
                                                {t('result.viewPosts')}
                                            </Button>
                                        )}
                                    </Box>
                                </Box>

                                <Box sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                                        {/* Radar Chart */}
                                        <Box sx={{ flex: 1, height: 300, minHeight: 300, position: 'relative' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                                    <PolarGrid stroke="#e9d5ff" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar
                                                        name="Personality"
                                                        dataKey="A"
                                                        stroke="#9333ea"
                                                        strokeWidth={3}
                                                        fill="#a855f7"
                                                        fillOpacity={0.3}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </Box>

                                        {/* Text Analysis */}
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom textTransform="uppercase" letterSpacing={1} fontWeight="bold">
                                                {t('result.strengths')}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                                                {analysisResult.personality_traits?.map((trait: string, index: number) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.1 }}
                                                    >
                                                        <Chip
                                                            label={trait}
                                                            sx={{
                                                                bgcolor: '#f3e8ff',
                                                                color: '#7e22ce',
                                                                fontWeight: 600,
                                                                border: '1px solid #d8b4fe'
                                                            }}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </Box>

                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom textTransform="uppercase" letterSpacing={1} fontWeight="bold">
                                                {t('result.workStyle')}
                                            </Typography>
                                            <Typography variant="body1" color="#374151" sx={{ lineHeight: 1.7 }}>
                                                {analysisResult.work_style || t('analyzing.workStyle')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {/* Analyzed Posts Modal */}
                <AnimatePresence>
                    {showAnalysisModal && typeof document !== 'undefined' && (
                        <>
                            {createPortal(
                                <Box sx={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                                        onClick={() => setShowAnalysisModal(false)}
                                    />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        style={{
                                            position: 'relative',
                                            backgroundColor: 'white',
                                            borderRadius: '16px',
                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                            width: '100%',
                                            maxWidth: '600px',
                                            maxHeight: '80vh',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            zIndex: 1401,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#faf5ff' }}>
                                            <Typography variant="h6" fontWeight="bold" color="#4c1d95">
                                                {t('modal.analyzedPostsTitle')}
                                            </Typography>
                                            <Button onClick={() => setShowAnalysisModal(false)} sx={{ minWidth: 'auto', p: 0.5, color: '#6b7280' }}>
                                                <CloseIcon />
                                            </Button>
                                        </Box>

                                        <Box sx={{ p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {analysisResult.analyzed_posts?.map((post: any, index: number) => (
                                                <Paper key={index} elevation={0} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {post.original_post?.date || `Post #${index + 1}`}
                                                        </Typography>
                                                        <Chip
                                                            label={post.sentiment}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: post.sentiment === 'Positive' ? '#dcfce7' : post.sentiment === 'Negative' ? '#fee2e2' : '#f3f4f6',
                                                                color: post.sentiment === 'Positive' ? '#166534' : post.sentiment === 'Negative' ? '#991b1b' : '#374151',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.7rem'
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="#1f2937" sx={{ mb: 1.5 }}>
                                                        &quot;{post.original_post?.content || post.content_snippet}&quot;
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f9fafb', p: 1, borderRadius: 1 }}>
                                                        <AutoAwesomeIcon sx={{ fontSize: 16, color: '#9333ea' }} />
                                                        <Typography variant="caption" color="#6b7280">
                                                            {t('modal.aiSummary', { summary: post.summary })}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            ))}
                                        </Box>
                                    </motion.div>
                                </Box>,
                                document.body
                            )}
                        </>
                    )}
                </AnimatePresence>
            </Box>
        );
    }


    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(24, 119, 242, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 32px',
                    backgroundColor: '#1877F2',
                    color: 'white',
                    borderRadius: '9999px',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(24, 119, 242, 0.2)',
                    transition: 'all 0.2s ease'
                }}
            >
                <FacebookIcon sx={{ fontSize: 28 }} />
                <span>{t('connectButton')}</span>
            </motion.button>

            <AnimatePresence>
                {showModal && typeof document !== 'undefined' && (
                    <>
                        {createPortal(
                            <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                                    onClick={() => setShowModal(false)}
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    style={{
                                        position: 'relative',
                                        backgroundColor: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                        width: '100%',
                                        maxWidth: '480px',
                                        overflow: 'hidden',
                                        zIndex: 1301
                                    }}
                                >
                                    {/* Facebook Header */}
                                    <Box sx={{ bgcolor: '#1877F2', px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FacebookIcon sx={{ color: 'white', fontSize: 24 }} />
                                            <Typography fontWeight="bold" color="white" sx={{ fontSize: '1.125rem', letterSpacing: '-0.025em' }}>
                                                facebook
                                            </Typography>
                                        </Box>
                                        <Button onClick={() => setShowModal(false)} sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 'auto', p: 0.5, '&:hover': { color: 'white' } }}>
                                            <CloseIcon />
                                        </Button>
                                    </Box>

                                    {/* Content */}
                                    <Box sx={{ p: 3, minHeight: 320, display: 'flex', flexDirection: 'column' }}>
                                        {loginStep === 'permission' && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                    <Box sx={{ width: 64, height: 64, bgcolor: '#f3f4f6', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                                                        <Image
                                                            src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg"
                                                            alt="FB"
                                                            width={40}
                                                            height={40}
                                                            unoptimized
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="h6" fontWeight="bold" color="#111827">{t('modal.loginTitle')}</Typography>
                                                        <Typography variant="body2" color="#6b7280">{t('modal.requestAccess')}</Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f9fafb' }, transition: 'background-color 0.2s' }}>
                                                        <PublicIcon sx={{ color: '#9ca3af', mt: 0.5 }} />
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight="bold" color="#1f2937">{t('modal.publicProfile')}</Typography>
                                                            <Typography variant="caption" color="#6b7280">{t('modal.publicProfileDesc')}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f9fafb' }, transition: 'background-color 0.2s' }}>
                                                        <AutoAwesomeIcon sx={{ color: '#9ca3af', mt: 0.5 }} />
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight="bold" color="#1f2937">{t('modal.postsActivities')}</Typography>
                                                            <Typography variant="caption" color="#6b7280">{t('modal.postsActivitiesDesc')}</Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                    <Button
                                                        onClick={confirmLogin}
                                                        variant="contained"
                                                        fullWidth
                                                        sx={{
                                                            bgcolor: '#1877F2',
                                                            color: 'white',
                                                            py: 1.5,
                                                            borderRadius: 2,
                                                            fontWeight: 'bold',
                                                            fontSize: '1.125rem',
                                                            textTransform: 'none',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                            '&:hover': { bgcolor: '#166fe5', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
                                                        }}
                                                    >
                                                        {t('modal.continueAs', { name: 'Thanakorn Hipngen' })}
                                                    </Button>
                                                    <Button
                                                        onClick={() => setShowModal(false)}
                                                        fullWidth
                                                        sx={{
                                                            bgcolor: '#f3f4f6',
                                                            color: '#374151',
                                                            py: 1.5,
                                                            borderRadius: 2,
                                                            fontWeight: '600',
                                                            textTransform: 'none',
                                                            '&:hover': { bgcolor: '#e5e7eb' }
                                                        }}
                                                    >
                                                        {t('modal.cancel')}
                                                    </Button>
                                                </Box>

                                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#9ca3af' }}>
                                                    <SecurityIcon sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption">{t('modal.secureConnection')}</Typography>
                                                </Box>
                                            </motion.div>
                                        )}

                                        {(loginStep === 'authenticating' || loginStep === 'fetching') && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}
                                            >
                                                <Box sx={{ position: 'relative', width: 80, height: 80, mb: 3 }}>
                                                    <CircularProgress size={80} thickness={2} sx={{ color: '#1877F2' }} />
                                                    <Avatar
                                                        src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg"
                                                        sx={{ width: 40, height: 40, position: 'absolute', top: 20, left: 20, bgcolor: 'transparent' }}
                                                        imgProps={{ style: { objectFit: 'contain' } }}
                                                    />
                                                </Box>
                                                <Typography variant="h6" fontWeight="bold" color="#111827" gutterBottom>
                                                    {loginStep === 'authenticating' ? t('modal.verifying') : t('modal.fetching')}
                                                </Typography>
                                                <Typography variant="body2" color="#6b7280" sx={{ maxWidth: 250 }}>
                                                    {t('modal.waitMessage')}
                                                </Typography>
                                            </motion.div>
                                        )}

                                        {loginStep === 'success' && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}
                                            >
                                                <Box sx={{ width: 96, height: 96, bgcolor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, color: '#16a34a' }}>
                                                    <CheckCircleIcon sx={{ fontSize: 60 }} />
                                                </Box>
                                                <Typography variant="h5" fontWeight="bold" color="#111827" gutterBottom>{t('modal.successTitle')}</Typography>
                                                <Typography variant="body1" color="#6b7280">
                                                    {t('modal.successMessage')}
                                                </Typography>
                                            </motion.div>
                                        )}
                                    </Box>
                                </motion.div>
                            </Box>,
                            document.body
                        )}
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
