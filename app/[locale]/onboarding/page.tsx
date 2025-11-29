'use client';

import { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';

import PersonalInformationTab from '../../Components/onboarding/PersonalInformationTab';
import EducationExperienceTab from '../../Components/onboarding/EducationExperienceTab';
import SkillsTab from '../../Components/onboarding/SkillsTab';
import OtherTab from '../../Components/onboarding/OtherTab';
import GlassSidebar from '../../Components/profile/GlassSidebar';
import SocialMediaTab from '../../Components/onboarding/SocialMediaTab';
import OnboardingNavigation from '../../Components/onboarding/OnboardingNavigation';
import { useOnboarding } from '../../context/OnboardingContext';
import { userAPI } from '../../lib/api';

const TABS = ['personal', 'experience', 'skills', 'social', 'other'];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'personal';
  const { personalInfo } = useOnboarding();
  const [loading, setLoading] = useState(false);

  const currentIndex = TABS.indexOf(currentTab);
  const isLastStep = currentIndex === TABS.length - 1;

  const handleNext = async () => {
    setLoading(true);
    try {
      // Save data based on current tab
      switch (currentTab) {
        case 'personal':
          if (Object.keys(personalInfo).length > 0) {
            // Use correct API methods
            await userAPI.upsertProfile(personalInfo);
            await userAPI.upsertAddress(personalInfo);
          }
          break;
        case 'experience':
          // Education and Experience are usually saved individually in the component,
          // but we could implement bulk save here if API supported it.
          // For now, we assume they are saved or we just proceed.
          break;
        case 'skills':
          // Skills API missing, data persists in Context
          break;
        case 'social':
          // Social data logic
          break;
      }

      if (isLastStep) {
        router.push('/profile'); // Or dashboard
      } else {
        const nextTab = TABS[currentIndex + 1];
        router.push(`/onboarding?tab=${nextTab}`);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      // Handle error (show toast?)
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevTab = TABS[currentIndex - 1];
      router.push(`/onboarding?tab=${prevTab}`);
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'personal':
        return <PersonalInformationTab />;
      case 'experience':
        return <EducationExperienceTab />;
      case 'skills':
        return <SkillsTab />;
      case 'social':
        return <SocialMediaTab />;
      case 'other':
        return <OtherTab />;
      default:
        return <PersonalInformationTab />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#f5f7ff',
        position: 'relative',
      }}
    >
      <GlassSidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 6 },
          ml: { xs: '100px', md: '20px' },
          transition: 'margin-left .25s ease',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            bgcolor: '#ffffff',
            boxShadow: '0 28px 70px rgba(65, 83, 134, 0.14)',
            border: '1px solid rgba(143, 167, 255, 0.16)',
            p: { xs: 3.5, md: 5 },
            width: '100%',
            maxWidth: 960,
          }}
        >
          {renderTabContent()}

          <OnboardingNavigation
            onNext={handleNext}
            onBack={currentIndex > 0 ? handleBack : () => { }}
            isLastStep={isLastStep}
            loading={loading}
          />
        </Paper>
      </Box>
    </Box>
  );
}