'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { adsAPI, Ad, CreateAdRequest, UpdateAdRequest } from '@/utils/adsAPI';
import AdFormModal from '@/components/ads/AdFormModal';

export default function AdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [adToDelete, setAdToDelete] = useState<string | null>(null);

    const fetchAds = async () => {
        try {
            const data = await adsAPI.getAds();
            setAds(data);
        } catch (error) {
            console.error('Failed to fetch ads:', error);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleCreate = () => {
        setSelectedAd(null);
        setIsModalOpen(true);
    };

    const handleEdit = (ad: Ad) => {
        setSelectedAd(ad);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setAdToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (adToDelete) {
            try {
                await adsAPI.deleteAd(adToDelete);
                fetchAds();
            } catch (error) {
                console.error('Failed to delete ad:', error);
            } finally {
                setDeleteDialogOpen(false);
                setAdToDelete(null);
            }
        }
    };

    const handleSubmit = async (data: CreateAdRequest | UpdateAdRequest) => {
        try {
            if (selectedAd) {
                await adsAPI.updateAd(selectedAd.id, data);
            } else {
                await adsAPI.createAd(data as CreateAdRequest);
            }
            fetchAds();
        } catch (error) {
            console.error('Failed to save ad:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Ads Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Create Ad
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Sponsor</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ads.map((ad) => (
                            <TableRow key={ad.id}>
                                <TableCell>{ad.title}</TableCell>
                                <TableCell>{ad.sponsor_name}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={ad.status}
                                        color={ad.status === 'Active' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell>
                                    {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEdit(ad)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(ad.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <AdFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={selectedAd}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Delete"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete this ad? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
