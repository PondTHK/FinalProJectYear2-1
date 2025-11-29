'use client';
import { createTheme } from '@mui/material/styles';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
});

const theme = createTheme({
    typography: {
        fontFamily: outfit.style.fontFamily,
    },
    palette: {
        mode: 'light',
        primary: {
            main: '#4F46E5', // Indigo-600 to match Tailwind
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
    },
});

export default theme;
