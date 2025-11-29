'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/navigation';
import { companyAPI } from '@/app/lib/api';

export default function ContactDetailsTab() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [formData, setFormData] = useState({
        phone: '',
        address_detail: '',
        province: '',
        district: '',
        subdistrict: '',
        postal_code: '',
    });

    // Load company data on mount
    useEffect(() => {
        const loadCompany = async () => {
            try {
                setLoading(true);
                const response = await companyAPI.getCompany();
                if (response.ok && response.data) {
                    const company = response.data;
                    setCompanyName(company.company_name || '');
                    setCompanyEmail(company.email || '');
                    setFormData({
                        phone: company.phone || '',
                        address_detail: company.address_detail || '',
                        province: company.province || '',
                        district: company.district || '',
                        subdistrict: company.subdistrict || '',
                        postal_code: company.postal_code || '',
                    });
                }
            } catch (error) {
                console.error('Failed to load company data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCompany();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBack = () => {
        router.push('/onboarding/company?tab=info');
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await companyAPI.updateCompany({
                phone: formData.phone,
                address_detail: formData.address_detail,
                province: formData.province,
                district: formData.district,
                subdistrict: formData.subdistrict,
                postal_code: formData.postal_code,
            });

            // Redirect to profile
            router.push('/company-public-profile');
        } catch (error) {
            console.error('Failed to update company:', error);
            alert('Failed to update company information. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#1a237e' }}>
                {companyName || companyEmail || 'Contact Details'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
                {companyName && companyEmail 
                    ? `${companyEmail} - Where is your company located?`
                    : companyEmail 
                    ? `${companyEmail} - Where is your company located?`
                    : 'Where is your company located?'}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Address Detail"
                        name="address_detail"
                        value={formData.address_detail}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Province"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="District"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Subdistrict"
                        name="subdistrict"
                        value={formData.subdistrict}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Postal Code"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                    />
                </Grid>
            </Grid>

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                    variant="outlined"
                    onClick={handleBack}
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderColor: '#1a237e',
                        color: '#1a237e',
                        '&:hover': {
                            borderColor: '#0d1b60',
                            bgcolor: 'rgba(26, 35, 126, 0.04)',
                        },
                    }}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={saving}
                    sx={{
                        bgcolor: '#1a237e',
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': {
                            bgcolor: '#0d1b60',
                        },
                    }}
                >
                    {saving ? 'Saving...' : 'Save & Complete'}
                </Button>
            </Stack>
        </Box>
    );
}
