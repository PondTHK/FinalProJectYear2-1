import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    MenuItem,
    Box,
    Typography,
    Avatar,
    CircularProgress,
    IconButton,
    Paper
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Ad, CreateAdRequest, UpdateAdRequest } from '../../utils/adsAPI';
import { storageAPI } from '../../utils/storageAPI';

interface AdFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (ad: CreateAdRequest | UpdateAdRequest) => Promise<void>;
    initialData?: Ad | null;
}

const AdFormModal: React.FC<AdFormModalProps> = ({ open, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState<CreateAdRequest>({
        title: '',
        sponsor_name: '',
        sponsor_tag: 'Sponsored',
        profile_image_url: '',
        details: '',
        link_url: '',
        start_date: '',
        end_date: '',
        status: 'Active',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                sponsor_name: initialData.sponsor_name || '',
                sponsor_tag: initialData.sponsor_tag || 'Sponsored',
                profile_image_url: initialData.profile_image_url || '',
                details: initialData.details || '',
                link_url: initialData.link_url || '',
                start_date: initialData.start_date || '',
                end_date: initialData.end_date || '',
                status: initialData.status || 'Active',
            });
            setPreviewUrl(initialData.profile_image_url || null);
            setStartDate(initialData.start_date ? dayjs(initialData.start_date) : null);
            setEndDate(initialData.end_date ? dayjs(initialData.end_date) : null);
        } else {
            setFormData({
                title: '',
                sponsor_name: '',
                sponsor_tag: 'Sponsored',
                profile_image_url: '',
                details: '',
                link_url: '',
                start_date: '',
                end_date: '',
                status: 'Active',
            });
            setPreviewUrl(null);
            setStartDate(null);
            setEndDate(null);
        }
        setSelectedFile(null);
    }, [initialData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        try {
            let imageUrl = formData.profile_image_url;

            if (selectedFile) {
                setUploading(true);
                try {
                    imageUrl = await storageAPI.uploadProfileImage(selectedFile);
                } catch (error) {
                    console.error("Failed to upload image", error);
                    alert("Failed to upload image");
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const submissionData = {
                ...formData,
                profile_image_url: imageUrl,
                start_date: startDate ? startDate.toISOString() : dayjs().toISOString(),
                end_date: endDate ? endDate.toISOString() : undefined,
            };
            await onSubmit(submissionData);
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h5" fontWeight="bold" component="div">
                        {initialData ? 'Edit Advertisement' : 'Create New Advertisement'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Image Upload Section */}
                        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    width: '100%',
                                    maxWidth: 300,
                                    aspectRatio: '1/1',
                                    bgcolor: 'grey.100',
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '2px dashed',
                                    borderColor: 'grey.300',
                                    position: 'relative'
                                }}
                            >
                                {previewUrl ? (
                                    <Avatar
                                        src={previewUrl}
                                        variant="square"
                                        sx={{ width: '100%', height: '100%' }}
                                        imgProps={{ style: { objectFit: 'contain' } }}
                                    />
                                ) : (
                                    <Box sx={{ textAlign: 'center', color: 'text.secondary', p: 2 }}>
                                        <CloudUploadIcon sx={{ fontSize: 48, mb: 1, color: 'grey.400' }} />
                                        <Typography variant="body2">Upload Image</Typography>
                                    </Box>
                                )}
                            </Paper>
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Choose Image'}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </Button>
                        </Grid>

                        {/* Form Fields Section */}
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Sponsor Name"
                                        name="sponsor_name"
                                        value={formData.sponsor_name}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Sponsor Tag"
                                        name="sponsor_tag"
                                        value={formData.sponsor_tag}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Details"
                                        name="details"
                                        value={formData.details}
                                        onChange={handleChange}
                                        multiline
                                        rows={3}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Link URL"
                                        name="link_url"
                                        value={formData.link_url}
                                        onChange={handleChange}
                                        placeholder="https://example.com"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <DateTimePicker
                                        label="End Date"
                                        value={endDate}
                                        onChange={(newValue) => setEndDate(newValue)}
                                        slotProps={{ textField: { fullWidth: true } }}
                                        ampm={false}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="Active">Active</MenuItem>
                                        <MenuItem value="Inactive">Inactive</MenuItem>
                                        <MenuItem value="Scheduled">Scheduled</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onClose} size="large" sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={uploading}
                        size="large"
                        sx={{ px: 4, borderRadius: 2 }}
                    >
                        {initialData ? 'Update Ad' : 'Create Ad'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};

export default AdFormModal;
