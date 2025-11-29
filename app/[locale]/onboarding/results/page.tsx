'use client';

import {
  Paper,
  Typography,
} from '@mui/material';

export default function AiScorePage() {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        p: { xs: 3, md: 5 },
        textAlign: 'center',
        border: '1px dashed rgba(134, 157, 255, 0.5)',
        bgcolor: 'rgba(235, 240, 255, 0.9)',
        color: '#3c4a7d',
      }}
    >
      <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 1.5, color: '#2e3870' }}>
       My results
      </Typography>
      <Typography sx={{ maxWidth: 520, mx: 'auto' }}>
        หน้านี้สำหรับแสดงผล My results ซึ่งยังอยู่ในระหว่างการพัฒนา
      </Typography>
    </Paper>
  );
}
