'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Stack,
    CircularProgress,
    Autocomplete,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { companyAPI } from '@/app/lib/api';

// Industry options from company-register page
const INDUSTRIES = [
    'เทคโนโลยีสารสนเทศ (IT)',
    'ซอฟต์แวร์และการพัฒนา',
    'ฮาร์ดแวร์และอุปกรณ์อิเล็กทรอนิกส์',
    'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง',
    'ไซเบอร์ซิเคียวริตี้',
    'คลาวด์คอมพิวติ้ง',
    'การเงินและธนาคาร',
    'ประกันภัย',
    'การลงทุนและหลักทรัพย์',
    'ฟินเทค (FinTech)',
    'การบัญชีและการตรวจสอบบัญชี',
    'การผลิตและอุตสาหกรรม',
    'ยานยนต์และชิ้นส่วน',
    'อิเล็กทรอนิกส์',
    'สิ่งทอและเครื่องนุ่งห่ม',
    'อาหารและเครื่องดื่ม',
    'เคมีภัณฑ์และปิโตรเคมี',
    'พลาสติกและยาง',
    'เหล็กและโลหะ',
    'เครื่องจักรและอุปกรณ์',
    'การก่อสร้างและอสังหาริมทรัพย์',
    'วิศวกรรมโยธา',
    'สถาปัตยกรรมและออกแบบ',
    'การพัฒนาอสังหาริมทรัพย์',
    'บริหารอาคาร',
    'การขายปลีกและขายส่ง',
    'อีคอมเมิร์ซ',
    'ค้าปลีกสินค้าอุปโภคบริโภค',
    'ค้าส่งและการจัดจำหน่าย',
    'บริการสุขภาพและการแพทย์',
    'โรงพยาบาลและคลินิก',
    'เภสัชกรรมและยา',
    'อุปกรณ์การแพทย์',
    'สุขภาพดิจิทัล (HealthTech)',
    'การศึกษาและฝึกอบรม',
    'EdTech',
    'มหาวิทยาลัยและสถาบันการศึกษา',
    'การฝึกอบรมองค์กร',
    'การท่องเที่ยวและโรงแรม',
    'โรงแรมและรีสอร์ท',
    'สายการบินและการบิน',
    'ท่องเที่ยวและทัวร์',
    'ร้านอาหารและบริการอาหาร',
    'การขนส่งและโลจิสติกส์',
    'การขนส่งทางบก',
    'การขนส่งทางเรือ',
    'การขนส่งทางอากาศ',
    'คลังสินค้าและการจัดการห่วงโซ่อุปทาน',
    'พลังงานและสาธารณูปโภค',
    'น้ำมันและก๊าซ',
    'พลังงานหมุนเวียน',
    'ไฟฟ้าและพลังงาน',
    'โทรคมนาคมและสื่อสาร',
    'ผู้ให้บริการโทรคมนาคม',
    'บริการอินเทอร์เน็ต',
    'สื่อและบันเทิง',
    'โทรทัศน์และวิทยุ',
    'ภาพยนตร์และการผลิตวิดีโอ',
    'ดนตรีและบันเทิง',
    'การเกมและ E-sports',
    'สื่อดิจิทัลและโซเชียลมีเดีย',
    'การเกษตรและประมง',
    'เกษตรกรรม',
    'ปศุสัตว์',
    'ประมง',
    'AgriTech',
    'กฎหมายและที่ปรึกษากฎหมาย',
    'สำนักงานกฎหมาย',
    'ที่ปรึกษากฎหมาย',
    'การตลาดและโฆษณา',
    'เอเจนซี่โฆษณา',
    'การตลาดดิจิทัล',
    'ประชาสัมพันธ์',
    'ทรัพยากรบุคคลและการจัดหางาน',
    'การจัดหางาน',
    'ที่ปรึกษาทรัพยากรบุคคล',
    'HR Tech',
    'การออกแบบและความคิดสร้างสรรค์',
    'กราฟิกดีไซน์',
    'UX/UI Design',
    'แฟชั่นและสิ่งทอ',
    'ศิลปะและหัตถกรรม',
    'การวิจัยและพัฒนา',
    'วิทยาศาสตร์และเทคโนโลยี',
    'ไบโอเทคและวิทยาศาสตร์ชีวภาพ',
    'สิ่งแวดล้อมและความยั่งยืน',
    'พลังงานสะอาด',
    'การจัดการขยะและรีไซเคิล',
    'ที่ปรึกษาด้านสิ่งแวดล้อม',
    'บริการมืออาชีพและที่ปรึกษา',
    'ที่ปรึกษาธุรกิจ',
    'ที่ปรึกษาการจัดการ',
    'ที่ปรึกษาด้านกลยุทธ์',
    'บริการทำความสะอาดและดูแลอาคาร',
    'ความปลอดภัยและรักษาความปลอดภัย',
    'องค์กรไม่แสวงหาผลกำไร (NGO)',
    'การกุศลและสังคมสงเคราะห์',
    'หน่วยงานรัฐและองค์กรสาธารณะ',
    'กีฬาและนันทนาการ',
    'ฟิตเนสและสุขภาพ',
    'อื่นๆ',
];

const COMPANY_SIZES = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+',
];

export default function CompanyInfoTab() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        company_name: '',
        industry: '',
        email: '',
        company_size: '',
        founded_year: '',
        description: '',
        mission: '',
        vision: '',
    });

    // Load company data on mount
    useEffect(() => {
        const loadCompany = async () => {
            try {
                setLoading(true);
                const response = await companyAPI.getCompany();
                if (response.ok && response.data) {
                    const company = response.data;
                    setFormData({
                        company_name: company.company_name || '',
                        industry: company.industry || '',
                        email: company.email || '',
                        company_size: company.company_size || '',
                        founded_year: company.founded_year?.toString() || '',
                        description: company.description || '',
                        mission: company.mission || '',
                        vision: company.vision || '',
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

    const handleNext = async () => {
        try {
            setLoading(true);
            // Save current tab data
            await companyAPI.updateCompany({
                company_name: formData.company_name,
                industry: formData.industry,
                email: formData.email,
                company_size: formData.company_size,
                founded_year: formData.founded_year || null,
                description: formData.description,
                mission: formData.mission,
                vision: formData.vision,
            });
            router.push('/onboarding/company?tab=contact');
        } catch (error) {
            console.error('Failed to save company info:', error);
            alert('Failed to save company information. Please try again.');
        } finally {
            setLoading(false);
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
                {formData.company_name || formData.email || 'Company Information'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
                {formData.company_name && formData.email
                    ? `${formData.email} - แก้ไขข้อมูลบริษัทของคุณ`
                    : formData.company_name
                        ? 'แก้ไขข้อมูลบริษัทของคุณ'
                        : formData.email
                            ? `${formData.email} - Tell us about your company.`
                            : 'Tell us about your company.'}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Company Name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                        options={INDUSTRIES}
                        value={formData.industry || null}
                        onChange={(_, newValue) => {
                            setFormData({ ...formData, industry: newValue || '' });
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...(params as any)}
                                label="Industry"
                                name="industry"
                                fullWidth
                            />
                        )}
                        freeSolo
                        sx={{ width: '100%' }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        select
                        fullWidth
                        label="Company Size"
                        name="company_size"
                        value={formData.company_size}
                        onChange={handleChange}
                    >
                        {COMPANY_SIZES.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Founded Year"
                        name="founded_year"
                        value={formData.founded_year}
                        onChange={handleChange}
                        inputProps={{ maxLength: 4 }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Mission"
                        name="mission"
                        value={formData.mission}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Vision"
                        name="vision"
                        value={formData.vision}
                        onChange={handleChange}
                    />
                </Grid>
            </Grid>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 4 }}>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!formData.company_name}
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
                    Next Step
                </Button>
            </Stack>
        </Box>
    );
}
