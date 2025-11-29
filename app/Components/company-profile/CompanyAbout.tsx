'use client';

import { Box, Typography, Paper, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { CompanyResponse } from '@/app/lib/api';

interface CompanyAboutProps {
    company: CompanyResponse;
}

export default function CompanyAbout({ company }: CompanyAboutProps) {
    return (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1a237e' }}>
                About Us
            </Typography>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                        {company.description || "No description provided."}
                    </Typography>
                </Grid>

                {(company.mission || company.vision) && (
                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>
                )}

                {company.mission && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ bgcolor: '#f5f7fa', p: 2.5, borderRadius: 2, height: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: '#283593' }}>
                                Our Mission
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {company.mission}
                            </Typography>
                        </Box>
                    </Grid>
                )}

                {company.vision && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ bgcolor: '#f5f7fa', p: 2.5, borderRadius: 2, height: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: '#283593' }}>
                                Our Vision
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {company.vision}
                            </Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Paper>
    );
}
