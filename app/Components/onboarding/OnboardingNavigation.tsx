'use client';

import { Box, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

interface OnboardingNavigationProps {
    onNext: () => void;
    onBack?: () => void;
    isLastStep?: boolean;
    loading?: boolean;
    disableNext?: boolean;
}

export default function OnboardingNavigation({
    onNext,
    onBack,
    isLastStep = false,
    loading = false,
    disableNext = false,
}: OnboardingNavigationProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 4,
                pt: 3,
                borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
        >
            <Box>
                {onBack && (
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                        disabled={loading}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.04)',
                            },
                        }}
                    >
                        ย้อนกลับ
                    </Button>
                )}
            </Box>

            <Button
                variant="contained"
                onClick={onNext}
                disabled={loading || disableNext}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : isLastStep ? <CheckIcon /> : <ArrowForwardIcon />}
                sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                    '&:hover': {
                        boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
                    },
                }}
            >
                {isLastStep ? 'เสร็จสิ้น' : 'ถัดไป'}
            </Button>
        </Box>
    );
}
