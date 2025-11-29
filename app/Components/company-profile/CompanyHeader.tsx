'use client';

import { Box, Typography, Avatar, Button, Stack, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import { CompanyResponse } from '@/app/lib/api';

interface CompanyHeaderProps {
    company: CompanyResponse;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
    return (
        <Box sx={{ mb: 4 }}>
            {/* Cover Image Placeholder */}
            <Box
                sx={{
                    height: 200,
                    bgcolor: 'grey.200',
                    borderRadius: 2,
                    mb: -6,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
                }}
            />

            <Box sx={{ px: 3 }}>
                <Grid container spacing={3} alignItems="flex-end">
                    <Grid size="auto">
                        <Avatar
                            src={company.logo_url ?? ''}
                            alt={company.company_name}
                            sx={{
                                width: 120,
                                height: 120,
                                border: '4px solid white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                bgcolor: 'primary.main',
                                fontSize: 48,
                            }}
                        >
                            {company.company_name.charAt(0).toUpperCase()}
                        </Avatar>
                    </Grid>
                    <Grid size="grow" sx={{ pb: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5, color: '#1a237e' }}>
                                    {company.company_name}
                                </Typography>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'text.secondary', mb: 1 }}>
                                    {company.industry && (
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {company.industry}
                                        </Typography>
                                    )}
                                    {company.province && (
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <LocationOnIcon fontSize="small" />
                                            <Typography variant="body2">
                                                {company.province}, Thailand
                                            </Typography>
                                        </Stack>
                                    )}
                                </Stack>

                                <Stack direction="row" spacing={1}>
                                    {company.company_size && (
                                        <Chip label={company.company_size} size="small" variant="outlined" />
                                    )}
                                    {company.founded_year && (
                                        <Chip label={`Founded ${company.founded_year}`} size="small" variant="outlined" />
                                    )}
                                </Stack>
                            </Box>

                            <Stack direction="row" spacing={1}>
                                {company.website_url && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<LanguageIcon />}
                                        href={company.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Website
                                    </Button>
                                )}
                                <Button variant="contained" startIcon={<EditIcon />}>
                                    Edit Profile
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
