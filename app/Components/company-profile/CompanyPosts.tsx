'use client';

import { Typography, Paper, Card, CardContent, Chip, Stack, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { CompanyPostResponse } from '@/app/lib/api';

interface CompanyPostsProps {
    posts: CompanyPostResponse[];
}

export default function CompanyPosts({ posts }: CompanyPostsProps) {
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1a237e' }}>
                Open Positions
            </Typography>

            <Stack spacing={2}>
                {posts.map((post) => (
                    <Card key={post.id} variant="outlined" sx={{ borderRadius: 2, '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size="grow">
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#283593' }}>
                                        {post.title}
                                    </Typography>
                                    <Stack direction="row" spacing={2} sx={{ mt: 1, color: 'text.secondary' }}>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <WorkOutlineIcon fontSize="small" />
                                            <Typography variant="body2">{post.job_type}</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <LocationOnIcon fontSize="small" />
                                            <Typography variant="body2">{post.location}</Typography>
                                        </Stack>
                                        {post.salary_range && (
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <AttachMoneyIcon fontSize="small" />
                                                <Typography variant="body2">{post.salary_range}</Typography>
                                            </Stack>
                                        )}
                                    </Stack>
                                    {post.tags && post.tags.length > 0 && (
                                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                            {post.tags.map((tag) => (
                                                <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#e8eaf6', color: '#3949ab' }} />
                                            ))}
                                        </Stack>
                                    )}
                                </Grid>
                                <Grid size="auto">
                                    <Button variant="contained" disableElevation>
                                        Apply Now
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Paper>
    );
}
