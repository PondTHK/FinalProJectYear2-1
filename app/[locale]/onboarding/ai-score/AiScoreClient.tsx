'use client';

import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Chip,
  IconButton,
  Fade,
  LinearProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useEffect, useState } from 'react';
import { aiAPI, userAPI, userAIScoreAPI, type AIScoreResponse, type UserProfileResponse, type UserEducationResponse, type UserExperienceResponse, type UserJobPreferenceResponse, type UserAddressResponse } from '../../../lib/api';
import GlassSidebar from '../../../Components/profile/GlassSidebar';

// Color theme matching Figma
const colors = {
  primary: '#7C3AED', // Purple
  primaryLight: '#A78BFA',
  primaryBg: '#EDE9FE',
  accent: '#10B981', // Green for skills
  accentBg: '#D1FAE5',
  dark: '#1F2937',
  darkSecondary: '#374151',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  surface: '#F9FAFB',
  surfaceCard: '#F3F0FF', // Light purple card bg
  border: '#E5E7EB',
  white: '#FFFFFF',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
};

// Circular Score Component
const CircularScore = ({ score, size = 200 }: { score: number; size?: number }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontSize: '2.5rem', fontWeight: 700, color: colors.text, lineHeight: 1 }}>
          {score}%
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: colors.primary, fontWeight: 500 }}>
          จากทั้งหมด 100%
        </Typography>
      </Box>
    </Box>
  );
};

// Category Score Pill (Clickable Tab)
const ScorePill = ({
  label,
  score,
  color = colors.primary,
  isActive = false,
  onClick,
}: {
  label: string;
  score: number;
  color?: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 2.5,
      py: 1.5,
      borderRadius: 2,
      border: isActive ? `2px solid ${color}` : `1px solid ${colors.border}`,
      bgcolor: colors.white,
      minWidth: 140,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      '&:hover': onClick ? {
        borderColor: color,
        transform: 'translateY(-1px)',
        boxShadow: `0 4px 12px ${color}20`,
      } : {},
    }}
  >
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: color,
      }}
    />
    <Typography sx={{ color: colors.text, fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>
      {label}
    </Typography>
    <Typography sx={{ color: colors.text, fontSize: '0.9rem', fontWeight: 600 }}>
      {score} %
    </Typography>
  </Box>
);


// Tab types
type ScoreTab = 'education' | 'experience' | 'skills';

// Profile completion criteria and weights
interface ProfileCompletionResult {
  score: number;
  canAnalyze: boolean;
  completedItems: string[];
  missingItems: string[];
}

export default function AiScorePage() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [educations, setEducations] = useState<UserEducationResponse[]>([]);
  const [experiences, setExperiences] = useState<UserExperienceResponse[]>([]);
  const [jobPreference, setJobPreference] = useState<UserJobPreferenceResponse | null>(null);
  const [address, setAddress] = useState<UserAddressResponse | null>(null);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ScoreTab>('education');

  // Calculate profile completion score
  const calculateProfileCompletion = (): ProfileCompletionResult => {
    let score = 0;
    const completedItems: string[] = [];
    const missingItems: string[] = [];

    // 1. Profile Image (10%)
    if (profile?.profile_image_url) {
      score += 10;
      completedItems.push('รูปโปรไฟล์');
    } else {
      missingItems.push('รูปโปรไฟล์');
    }

    // 2. Name (15%) - Thai or English name
    const hasName = (profile?.first_name_th && profile?.last_name_th) ||
      (profile?.first_name_en && profile?.last_name_en);
    if (hasName) {
      score += 15;
      completedItems.push('ชื่อ-นามสกุล');
    } else {
      missingItems.push('ชื่อ-นามสกุล');
    }

    // 3. Contact Info (15%) - Email and Phone
    const hasEmail = profile?.email && profile.email.trim() !== '';
    const hasPhone = profile?.phone && profile.phone.trim() !== '';
    if (hasEmail && hasPhone) {
      score += 15;
      completedItems.push('ข้อมูลติดต่อ (อีเมล, เบอร์โทร)');
    } else if (hasEmail || hasPhone) {
      score += 8;
      if (!hasEmail) missingItems.push('อีเมล');
      if (!hasPhone) missingItems.push('เบอร์โทรศัพท์');
    } else {
      missingItems.push('ข้อมูลติดต่อ (อีเมล, เบอร์โทร)');
    }

    // 4. Address (10%)
    if (address?.province && address?.district) {
      score += 10;
      completedItems.push('ที่อยู่');
    } else {
      missingItems.push('ที่อยู่');
    }

    // 5. Education (20%) - At least 1 education
    if (educations.length > 0 && educations.some(e => e.school)) {
      score += 20;
      completedItems.push('ประวัติการศึกษา');
    } else {
      missingItems.push('ประวัติการศึกษา');
    }

    // 6. Experience (15%) - At least 1 experience (can be 0 for fresh graduates)
    if (experiences.length > 0 && experiences.some(e => e.company || e.position)) {
      score += 15;
      completedItems.push('ประสบการณ์ทำงาน');
    } else {
      missingItems.push('ประสบการณ์ทำงาน');
    }

    // 7. Job Preference (15%) - Position interested
    if (jobPreference?.position && jobPreference.position.trim() !== '') {
      score += 15;
      completedItems.push('ตำแหน่งที่สนใจ');
    } else {
      missingItems.push('ตำแหน่งที่สนใจ');
    }

    // Requirements for AI Analysis:
    // - Must have name
    // - Must have at least education OR experience
    // - Must have job preference
    const hasJobPreference = !!(jobPreference?.position && jobPreference.position.trim() !== '');
    const hasEducationOrExperience = educations.length > 0 || experiences.length > 0;
    const canAnalyze = !!(hasName && hasEducationOrExperience && hasJobPreference);

    return {
      score,
      canAnalyze,
      completedItems,
      missingItems,
    };
  };

  // Calculate sub-scores based on profile completeness
  const calculateSubScores = () => {
    let educationScore = 0;
    let experienceScore = 0;
    let skillScore = 0;

    // Education score (max 30)
    if (educations.length > 0) {
      educationScore = 10;
      if (educations.some(e => e.degree)) educationScore += 10;
      if (educations.some(e => e.description)) educationScore += 10;
    }

    // Experience score (max 40)
    if (experiences.length > 0) {
      experienceScore = 15;
      experiences.forEach(exp => {
        if (exp.description) experienceScore += 5;
        if (exp.position) experienceScore += 5;
      });
      experienceScore = Math.min(experienceScore, 40);
    }

    // Skills score (max 30)
    // Since we don't have direct skills array, estimate from job preference
    if (jobPreference?.position) skillScore += 15;
    if (jobPreference?.industry) skillScore += 15;

    return {
      education: educationScore,
      experience: experienceScore,
      skill: skillScore,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, educationsRes, experiencesRes, jobPrefRes, addressRes, skillsRes] = await Promise.all([
          userAPI.getProfile(),
          userAPI.getEducations(),
          userAPI.getExperiences(),
          userAPI.getJobPreference(),
          userAPI.getAddress(),
          userAPI.getSkills(),
        ]);

        if (profileRes.ok && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (educationsRes.ok && educationsRes.data) {
          setEducations(educationsRes.data);
        }
        if (experiencesRes.ok && experiencesRes.data) {
          setExperiences(experiencesRes.data);
        }
        if (jobPrefRes.ok && jobPrefRes.data) {
          setJobPreference(jobPrefRes.data);
        }
        if (addressRes.ok && addressRes.data) {
          setAddress(addressRes.data);
        }
        if (skillsRes.ok && skillsRes.data && skillsRes.data.skills) {
          setUserSkills(skillsRes.data.skills);
        }

        // Fetch saved AI Score from backend
        try {
          const scoreRes = await userAIScoreAPI.getScore();
          if (scoreRes.ok && scoreRes.data) {
            setAiResult(scoreRes.data as unknown as AIScoreResponse);
          }
        } catch (err) {
          console.error("Failed to fetch AI score from backend:", err);
        }
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAnalyze = async (forceRefresh = false) => {
    // Check if profile is complete enough for analysis
    const completion = calculateProfileCompletion();
    if (!completion.canAnalyze) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนก่อนเริ่มการวิเคราะห์');
      return;
    }

    if (!profile) return;

    setAnalyzing(true);
    setError(null);

    if (forceRefresh) {
      setAiResult(null);
    }

    try {
      const fullProfile = {
        ...profile,
        address: address || {},
        educations: educations || [],
        experiences: experiences || [],
        jobPreference: jobPreference || {},
        skills: userSkills || [],
      };

      const res = await aiAPI.getAiScore(fullProfile);
      if (res.ok && res.data) {
        setAiResult(res.data);

        // Save to backend
        try {
          await userAIScoreAPI.saveScore({
            score: res.data.score,
            recommended_position: res.data.recommended_position,
            analysis: res.data.analysis,
            ...(res.data.education_score !== undefined && { education_score: res.data.education_score }),
            ...(res.data.experience_score !== undefined && { experience_score: res.data.experience_score }),
            ...(res.data.skill_score !== undefined && { skill_score: res.data.skill_score }),
            ...(res.data.level && { level: res.data.level }),
          });
        } catch (saveErr) {
          console.error("Failed to save AI score to backend:", saveErr);
        }
      } else {
        setError('ไม่สามารถคำนวณคะแนนได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการวิเคราะห์');
    } finally {
      setAnalyzing(false);
    }
  };


  const renderContent = () => {
    if (loading) {
      return (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: colors.white,
            borderRadius: 0,
            borderLeft: `1px solid ${colors.border}`,
          }}
        >
          <CircularProgress size={40} sx={{ color: colors.primary }} />
        </Paper>
      );
    }

    if (analyzing) {
      return (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            bgcolor: colors.white,
            borderRadius: 0,
            borderLeft: `1px solid ${colors.border}`,
            p: 4,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '28px',
              background: '#7C3AED', // Purple 600
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
              boxShadow: '0 12px 32px rgba(99, 102, 241, 0.3)',
              mb: 4,
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.08)', opacity: 0.9 },
              },
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 48, color: colors.white }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.text, mb: 1.5 }}>
            AI กำลังวิเคราะห์โปรไฟล์ของคุณ
          </Typography>
          <Typography sx={{ color: colors.textSecondary, maxWidth: 360, lineHeight: 1.6, mb: 1 }}>
            กำลังประมวลผลข้อมูลการศึกษา ประสบการณ์ และทักษะของคุณ
          </Typography>
          <Typography sx={{ color: colors.textMuted, fontSize: '0.875rem' }}>
            กรุณารอสักครู่...
          </Typography>
          <Box sx={{ width: 240, mt: 4 }}>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: colors.primaryBg,
                '& .MuiLinearProgress-bar': {
                  background: '#7C3AED',
                  borderRadius: 4,
                }
              }}
            />
          </Box>
        </Paper>
      );
    }

    if (!aiResult) {
      // Feature cards data
      const features = [
        {
          icon: <TaskAltIcon sx={{ fontSize: 28 }} />,
          title: 'วิเคราะห์ทักษะ',
          description: 'ประเมินทักษะที่มีและทักษะที่จำเป็น',
          color: colors.primary,
          bgColor: colors.primaryBg,
        },
        {
          icon: <ThumbUpAltIcon sx={{ fontSize: 28 }} />,
          title: 'คำแนะนำ',
          description: 'ให้คำแนะนำเพื่อปรับปรุงโปรไฟล์',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        },
        {
          icon: <WorkOutlineOutlinedIcon sx={{ fontSize: 28 }} />,
          title: 'เพิ่มโอกาส',
          description: 'เพิ่มโอกาสในการได้งานที่เหมาะสม',
          color: '#6366F1',
          bgColor: '#EEF2FF',
        },
      ];

      const completion = calculateProfileCompletion();

      return (
        <Fade in={true} timeout={500}>
          <Paper
            elevation={0}
            sx={{
              minHeight: '100vh',
              borderRadius: 0,
              background: colors.white,
              border: `1px solid ${colors.border}`,
              borderTop: 'none',
              borderBottom: 'none',
              borderRight: 'none',
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 3, md: 5 },
            }}
          >
            {/* AI Readiness Section */}
            <Box
              sx={{
                textAlign: 'center',
                mb: 5,
                maxWidth: 500,
                mx: 'auto',
                width: '100%',
              }}
            >
              {/* AI Readiness Circular Indicator */}
              <Box sx={{ position: 'relative', width: 160, height: 160, mx: 'auto', mb: 3 }}>
                {/* Background circle */}
                <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx={80}
                    cy={80}
                    r={70}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={10}
                  />
                  <circle
                    cx={80}
                    cy={80}
                    r={70}
                    fill="none"
                    stroke={completion.canAnalyze ? colors.accent : colors.primary}
                    strokeWidth={10}
                    strokeDasharray={440}
                    strokeDashoffset={440 - (completion.score / 100) * 440}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                {/* Center content */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text, lineHeight: 1 }}>
                    {completion.score}%
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mt: 0.5 }}>
                    ความพร้อม
                  </Typography>
                </Box>
              </Box>

              {/* Status Text */}
              <Typography sx={{ fontWeight: 700, color: '#495089', fontSize: '1.1rem' }}>
                {completion.canAnalyze ? 'พร้อมสำหรับการวิเคราะห์ AI' : 'ยังไม่พร้อมสำหรับการวิเคราะห์'}
              </Typography>
              <Typography sx={{ color: '#8490b3', fontSize: '0.875rem', mt: 1, lineHeight: 1.6 }}>
                {completion.canAnalyze
                  ? 'ข้อมูลของคุณครบถ้วน สามารถเริ่มการวิเคราะห์ได้เลย'
                  : 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนเริ่มการวิเคราะห์'}
              </Typography>

              {/* Checklist Items */}
              <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
                {[
                  { label: 'ชื่อ-นามสกุล', done: completion.completedItems.includes('ชื่อ-นามสกุล') },
                  { label: 'การศึกษา/ประสบการณ์', done: completion.completedItems.includes('ประวัติการศึกษา') || completion.completedItems.includes('ประสบการณ์ทำงาน') },
                  { label: 'ตำแหน่งที่สนใจ', done: completion.completedItems.includes('ตำแหน่งที่สนใจ') },
                ].map((item, idx) => (
                  <Chip
                    key={idx}
                    icon={item.done ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <WarningAmberIcon sx={{ fontSize: 16 }} />}
                    label={item.label}
                    size="small"
                    sx={{
                      bgcolor: item.done ? colors.accentBg : colors.warningBg,
                      color: item.done ? colors.accent : colors.warning,
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      '& .MuiChip-icon': {
                        color: item.done ? colors.accent : colors.warning,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Feature Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 5,
                maxWidth: 800,
                mx: 'auto',
                width: '100%',
              }}
            >
              {features.map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `1px solid ${colors.border}`,
                    bgcolor: colors.white,
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: feature.color,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${feature.color}15`,
                    },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      bgcolor: feature.bgColor,
                      color: feature.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>

                  {/* Title */}
                  <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: '1rem', mb: 1 }}>
                    {feature.title}
                  </Typography>

                  {/* Description */}
                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {feature.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* CTA Section - Gradient */}
            <Box
              sx={{
                background: completion.canAnalyze
                  ? '#4F46E5' // Indigo 600
                  : '#6B7280', // Gray 500
                borderRadius: 4,
                p: { xs: 4, md: 5 },
                textAlign: 'center',
                maxWidth: 800,
                mx: 'auto',
                width: '100%',
                mt: '5px',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  color: colors.white,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  mb: 1.5,
                }}
              >
                {completion.canAnalyze
                  ? 'พร้อมเริ่มการวิเคราะห์ AI แล้วหรือยัง?'
                  : 'กรุณากรอกข้อมูลให้ครบถ้วนก่อน'}
              </Typography>

              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', mb: 3 }}>
                {completion.canAnalyze
                  ? 'คลิกปุ่มด้านล่างเพื่อให้ AI วิเคราะห์ CV ของคุณ'
                  : `ยังขาดข้อมูล: ${completion.missingItems.slice(0, 3).join(', ')}${completion.missingItems.length > 3 ? '...' : ''}`}
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={() => handleAnalyze()}
                disabled={!completion.canAnalyze}
                startIcon={<AutoAwesomeIcon />}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  bgcolor: completion.canAnalyze ? colors.white : 'rgba(255,255,255,0.5)',
                  color: completion.canAnalyze ? colors.primary : 'rgba(255,255,255,0.8)',
                  boxShadow: completion.canAnalyze ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
                  '&:hover': completion.canAnalyze ? {
                    bgcolor: 'rgba(255,255,255,0.95)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  } : {},
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.7)',
                  },
                }}
              >
                {completion.canAnalyze ? 'ประเมินคะแนนโปรไฟล์' : 'กรอกข้อมูลให้ครบก่อน'}
              </Button>

              {completion.canAnalyze && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', mt: 2.5 }}>
                  การวิเคราะห์จะด้วย AI อาจจะใช้เวลาประมาณ 30 - 60 วินาที
                </Typography>
              )}
            </Box>
          </Paper>
        </Fade>
      );
    }

    if (error) {
      return (
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            py: 8,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: colors.white,
            borderRadius: 0,
            borderLeft: `1px solid ${colors.border}`,
          }}
        >
          <Typography color="error" variant="h6" sx={{ mb: 2 }}>{error}</Typography>
          <Button
            variant="outlined"
            onClick={() => handleAnalyze(true)}
            startIcon={<RefreshIcon />}
          >
            ลองใหม่อีกครั้ง
          </Button>
        </Paper>
      );
    }

    // Use AI scores if available, otherwise use calculated scores
    const educationScore = aiResult.education_score ?? calculateSubScores().education;
    const experienceScore = aiResult.experience_score ?? calculateSubScores().experience;
    const skillScore = aiResult.skill_score ?? calculateSubScores().skill;
    const positionName = aiResult.recommended_position || jobPreference?.position || 'ไม่ระบุตำแหน่ง';

    return (
      <Fade in={true} timeout={600}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 0,
            bgcolor: colors.white,
            width: '100%',
            minHeight: '100vh',
            p: { xs: 2, md: 3 },
          }}
        >
          {/* Header Badge */}
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
            label="AI Analysis"
            sx={{
              bgcolor: colors.accent,
              color: colors.white,
              fontWeight: 600,
              fontSize: '0.85rem',
              height: 36,
              px: 1,
              mb: 3,
              '& .MuiChip-icon': { color: colors.white },
            }}
          />

          {/* Two Column Layout */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            {/* Left: Score Circle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <CircularScore score={aiResult.score} size={200} />
            </Box>

            {/* Right: Analysis Summary */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: '1.1rem' }}>
                  สรุปการประเมินความเหมาะสมกับตำแหน่ง
                </Typography>
                <IconButton onClick={() => handleAnalyze(true)} size="small" sx={{ color: colors.textMuted }}>
                  <RefreshIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WorkOutlineIcon sx={{ fontSize: 18, color: colors.accent }} />
                <Typography sx={{ color: colors.accent, fontWeight: 600, fontSize: '0.95rem' }}>
                  {positionName}
                </Typography>
              </Box>

              {/* Analysis Box */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <CheckCircleIcon sx={{ color: colors.accent, fontSize: 22, mt: 0.3, flexShrink: 0 }} />
                <Box>
                  <Typography
                    sx={{
                      color: colors.text,
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      display: '-webkit-box',
                      WebkitLineClamp: showAnalysis ? 'unset' : 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {aiResult.analysis}
                  </Typography>
                  <Typography
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    sx={{
                      color: colors.primary,
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      mt: 1,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {showAnalysis ? 'ย่อลง' : 'อ่านเพิ่มเติม'}
                  </Typography>
                </Box>
              </Box>


            </Box>
          </Box>

          {/* Score Breakdown Section */}
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ fontWeight: 700, color: colors.text, fontSize: '1rem', mb: 2 }}>
              ผลการประเมิน
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <ScorePill
                label="การศึกษา"
                score={educationScore}
                color={colors.primary}
                isActive={selectedTab === 'education'}
                onClick={() => setSelectedTab('education')}
              />
              <ScorePill
                label="ประสบการณ์"
                score={experienceScore}
                color={colors.primary}
                isActive={selectedTab === 'experience'}
                onClick={() => setSelectedTab('experience')}
              />
              <ScorePill
                label="ทักษะ"
                score={skillScore}
                color={colors.accent}
                isActive={selectedTab === 'skills'}
                onClick={() => setSelectedTab('skills')}
              />
            </Box>

            {/* Dynamic Content Based on Selected Tab */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: selectedTab === 'skills' ? colors.accentBg : colors.surfaceCard,
              }}
            >
              {/* Education Tab Content */}
              {selectedTab === 'education' && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors.primary }} />
                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: '1rem' }}>
                      การศึกษา
                    </Typography>
                  </Box>
                  {educations.length > 0 ? (
                    <Box sx={{ pl: 3 }}>
                      {educations.map((edu, index) => (
                        <Box key={index} sx={{ mb: index < educations.length - 1 ? 3 : 0 }}>
                          <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem', mb: 0.5 }}>
                            ชื่อสถานศึกษา
                          </Typography>
                          <Typography sx={{ color: colors.text, fontWeight: 500, fontSize: '1rem' }}>
                            {edu.school || '-'}
                          </Typography>
                          {edu.degree && (
                            <>
                              <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem', mt: 1.5, mb: 0.5 }}>
                                วุฒิการศึกษา
                              </Typography>
                              <Typography sx={{ color: colors.text, fontWeight: 500, fontSize: '1rem' }}>
                                {edu.degree}{edu.major ? ` - ${edu.major}` : ''}
                              </Typography>
                            </>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ color: colors.textSecondary, pl: 3, fontSize: '0.95rem' }}>
                      ไม่มีข้อมูลการศึกษา
                    </Typography>
                  )}
                </>
              )}

              {/* Experience Tab Content */}
              {selectedTab === 'experience' && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors.primary }} />
                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: '1rem' }}>
                      ประสบการณ์
                    </Typography>
                  </Box>
                  {experiences.length > 0 ? (
                    <Box sx={{ pl: 3 }}>
                      {experiences.map((exp, index) => (
                        <Box key={index} sx={{ mb: index < experiences.length - 1 ? 3 : 0 }}>
                          <Typography sx={{ color: colors.text, fontWeight: 600, fontSize: '1rem' }}>
                            {exp.position}
                          </Typography>
                          <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                            {exp.company}
                          </Typography>
                          {exp.description && (
                            <Typography sx={{ color: colors.text, fontSize: '0.9rem', mt: 1 }}>
                              {exp.description}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ color: colors.textSecondary, textAlign: 'center', py: 2, fontSize: '0.95rem' }}>
                      ไม่มีประสบการณ์ทำงาน
                    </Typography>
                  )}
                </>
              )}

              {/* Skills Tab Content - Real Data */}
              {selectedTab === 'skills' && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors.accent }} />
                    <Typography sx={{ fontWeight: 600, color: colors.text, fontSize: '1rem' }}>
                      ทักษะ
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4, pl: 3 }}>
                    {/* User's actual skills from database */}
                    <Box>
                      <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 1.5, fontWeight: 500 }}>
                        ทักษะของคุณ
                      </Typography>
                      {userSkills.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {userSkills.map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                bgcolor: colors.white,
                                color: colors.accent,
                                fontWeight: 500,
                                fontSize: '0.85rem',
                                border: `1px solid ${colors.accent}`,
                                '& .MuiChip-icon': { color: colors.accent },
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem', fontStyle: 'italic' }}>
                          ยังไม่ได้เพิ่มทักษะ
                        </Typography>
                      )}
                    </Box>

                    {/* AI Recommended Skills based on position/industry */}
                    <Box>
                      <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 1.5, fontWeight: 500 }}>
                        ทักษะแนะนำสำหรับ {jobPreference?.industry ? `${jobPreference.industry} - ` : ''}{positionName}
                      </Typography>
                      {aiResult?.recommended_skills && aiResult.recommended_skills.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {aiResult.recommended_skills.map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              sx={{
                                bgcolor: colors.primaryBg,
                                color: colors.primary,
                                fontWeight: 500,
                                fontSize: '0.85rem',
                                border: `1px dashed ${colors.primaryLight}`,
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem', fontStyle: 'italic' }}>
                          กรุณาวิเคราะห์ AI Score เพื่อรับคำแนะนำทักษะ
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      </Fade>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <GlassSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: 0,
          width: '100%',
          minHeight: '100vh',
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
}
