'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Button,
  TextField,
  Typography,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useOnboarding } from '@/app/context/OnboardingContext';
import { userAPI } from '@/app/lib/api';

const textFieldSlotProps = {
  input: {
    sx: {
      color: '#11121f',
      '&::placeholder': {
        color: '#5c678f',
        opacity: 1,
      },
    },
  },
} as const;

export default function SkillsTab() {
  const t = useTranslations('Onboarding.skills');
  const { resumeData, skills, setSkills } = useOnboarding();
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const initialLoadDone = useRef(false);

  // Load skills from database on mount
  useEffect(() => {
    const loadSkills = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getSkills();
        if (response.ok && response.data?.skills) {
          // Filter out null values and convert to string[]
          const existingSkills = response.data.skills
            .filter((s): s is string => s !== null)
            .map(s => s.trim())
            .filter(s => s.length > 0);
          if (existingSkills.length > 0) {
            setSkills(existingSkills);
          }
        }
      } catch (err) {
        console.log('No existing skills found or error loading:', err);
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };
    loadSkills();
  }, [setSkills]);

  // Auto-fill from AI resume data (only after initial load and if skills are empty)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (resumeData?.skills && resumeData.skills.length > 0 && skills.length === 0) {
      // Auto-fill from AI and save to database
      const aiSkills = resumeData.skills;
      setSkills(aiSkills);
      saveSkillsToDb(aiSkills);
    }
  }, [resumeData, skills.length, setSkills]);

  // Save skills to database
  const saveSkillsToDb = async (skillsToSave: string[]) => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await userAPI.upsertSkills(skillsToSave);
      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error(typeof response.data === 'string' ? response.data : t('alerts.saveError'));
      }
    } catch (err) {
      console.error('Failed to save skills:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async () => {
    const skill = newSkill.trim();
    if (skill && !skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      const newSkillsList = [...skills, skill];
      setSkills(newSkillsList);
      setNewSkill('');
      // Save immediately to database
      await saveSkillsToDb(newSkillsList);
    }
  };

  const handleDeleteSkill = async (skillToDelete: string) => {
    const newSkillsList = skills.filter((skill) => skill !== skillToDelete);
    setSkills(newSkillsList);
    // Save immediately to database
    await saveSkillsToDb(newSkillsList);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={32} />
        <Typography sx={{ ml: 2, color: '#666' }}>{t('loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#222752' }}>
          {t('title')}
        </Typography>
        {resumeData?.skills && resumeData.skills.length > 0 && (
          <Chip
            label={t('aiRecommended')}
            size="small"
            color="primary"
            variant="outlined"
            icon={<AutoFixHighIcon />}
          />
        )}
        {/* Saving status indicator */}
        {isSaving && (
          <Chip
            label={t('saving')}
            size="small"
            color="default"
            icon={<CircularProgress size={14} />}
          />
        )}
        {saveStatus === 'saved' && !isSaving && (
          <Chip
            label={t('saved')}
            size="small"
            color="success"
            variant="outlined"
            icon={<CheckCircleIcon />}
          />
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {skills.map((skill) => (
          <Chip
            key={skill}
            label={skill}
            onDelete={() => handleDeleteSkill(skill)}
            sx={{
              bgcolor: '#f0f7ff',
              color: '#5c7aff',
              borderColor: '#5c7aff',
              '& .MuiChip-deleteIcon': {
                color: '#5c7aff',
                '&:hover': {
                  color: '#3762ff',
                },
              },
            }}
            variant="outlined"
          />
        ))}
        {skills.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {t('empty')}
          </Typography>
        )}
      </Stack>

      <Grid container spacing={2} alignItems="center">
        <Grid size={10}>
          <TextField
            label={t('form.addSkill')}
            fullWidth
            slotProps={textFieldSlotProps}
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('form.placeholder')}
          />
        </Grid>
        <Grid size={2}>
          <Button
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            fullWidth
            sx={{ height: '56px', borderRadius: 2 }} // Match text field height
            onClick={handleAddSkill}
            disabled={!newSkill.trim()}
          >
            {t('form.add')}
          </Button>
        </Grid>
      </Grid>

      {/* Note about saving */}
      <Typography variant="caption" sx={{ mt: 2, display: 'block', color: '#999' }}>
        {t('note')}
      </Typography>
    </Box>
  );
}
