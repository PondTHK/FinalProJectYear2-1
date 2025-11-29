/* eslint-disable @next/next/no-img-element */
'use client';

import { Typography, Paper, ImageList, ImageListItem } from '@mui/material';
import { CompanyGalleryResponse } from '@/app/lib/api';

interface CompanyGalleryProps {
    galleries: CompanyGalleryResponse[];
}

export default function CompanyGallery({ galleries }: CompanyGalleryProps) {
    if (!galleries || galleries.length === 0) {
        return null;
    }

    return (
        <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1a237e' }}>
                Gallery
            </Typography>

            <ImageList sx={{ width: '100%', height: 'auto' }} cols={3} rowHeight={200} gap={16}>
                {galleries.map((item) => (
                    <ImageListItem key={item.id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <img
                            src={`${item.image_url}?w=248&fit=crop&auto=format`}
                            srcSet={`${item.image_url}?w=248&fit=crop&auto=format&dpr=2 2x`}
                            alt="Company Gallery"
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </ImageListItem>
                ))}
            </ImageList>
        </Paper>
    );
}
