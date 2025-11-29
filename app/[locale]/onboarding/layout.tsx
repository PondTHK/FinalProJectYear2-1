import { Suspense } from 'react';
import OnboardingLayoutClient from './OnboardingLayoutClient';
import { LinearProgress } from '@mui/material';
import { OnboardingProvider } from '../../context/OnboardingContext';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LinearProgress />}>
      <OnboardingProvider>
        <OnboardingLayoutClient>{children}</OnboardingLayoutClient>
      </OnboardingProvider>
    </Suspense>
  );
}
