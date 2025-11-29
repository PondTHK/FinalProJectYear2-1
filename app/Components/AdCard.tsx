import React from 'react';
import { Box, Typography, Button, Avatar, Chip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface AdCardProps {
    title: string;
    sponsorName?: string;
    sponsorTag?: string;
    profileImageUrl?: string;
    details?: string;
    linkUrl?: string;
}

const AdCard: React.FC<AdCardProps> = ({
    title,
    sponsorName,
    sponsorTag = 'Sponsored',
    profileImageUrl,
    details,
    linkUrl,
}) => {
    return (
        <Box
            sx={{
                p: 3,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF5EB 100%)',
                border: '1px solid #FFE4C4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                boxShadow: '0px 4px 20px rgba(230, 180, 100, 0.1)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 8px 30px rgba(230, 180, 100, 0.2)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                {profileImageUrl ? (
                    <Avatar
                        src={profileImageUrl}
                        variant="rounded"
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: '#E6B464',
                            color: 'white',
                        }}
                    >
                        {!profileImageUrl && 'Ad'}
                    </Avatar>
                ) : (
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: '#E6B464',
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Box>
                )}

                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                            {title}
                        </Typography>
                        <Chip
                            label={sponsorTag}
                            size="small"
                            sx={{
                                bgcolor: '#FFF0E0',
                                color: '#D97706',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                                border: '1px solid #FFD8A8',
                            }}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
                        {details}
                    </Typography>
                </Box>
            </Box>

            {linkUrl && (
                <Button
                    variant="contained"
                    href={linkUrl}
                    target="_blank"
                    endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                    sx={{
                        bgcolor: '#E6B464',
                        color: 'white',
                        textTransform: 'none',
                        borderRadius: 50,
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': {
                            bgcolor: '#D9A353',
                            boxShadow: '0px 4px 12px rgba(230, 180, 100, 0.3)',
                        },
                    }}
                >
                    Learn More
                </Button>
            )}
        </Box>
    );
};

export default AdCard;
