'use client';

import { Box, Paper } from '@mui/material';
import CompanySidebar from '../../company/CompanySidebar';

interface CompanyOnboardingLayoutProps {
  children: React.ReactNode;
}

export default function CompanyOnboardingLayout({ children }: CompanyOnboardingLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#f5f7ff',
        position: 'relative',
      }}
    >
      <CompanySidebar />
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
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
