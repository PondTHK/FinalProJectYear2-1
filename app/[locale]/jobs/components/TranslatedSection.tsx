import React from 'react';
import { Typography, Box, Skeleton, IconButton, Tooltip } from "@mui/material";
import { useAiTranslation } from "@/app/hooks/useAiTranslation";
import { Sparkles, RefreshCw } from "lucide-react";

interface TranslatedSectionProps {
    title: string;
    content: string | string[] | undefined | null;
}

export function TranslatedSection({ title, content }: TranslatedSectionProps) {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;

    const originalText = Array.isArray(content) ? content.join("\n\n") : content;
    const { text, isTranslated, isLoading, error, retry } = useAiTranslation(originalText, "en");

    // Split by double newline to preserve paragraph structure if possible, 
    // but the translation might return a single block. 
    // If the original was array, we joined with \n\n.
    // Let's try to split by \n for display.
    const paragraphs = text ? text.split("\n") : [];

    return (
        <Box className="mt-3">
            <Box className="flex items-center gap-2 mb-1">
                <Typography variant="subtitle2" fontWeight={600}>
                    {title}
                </Typography>
                {isLoading && <Skeleton width={80} height={20} />}
                {isTranslated && !isLoading && !error && (
                    <Box className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                        <Sparkles size={10} />
                        <span>AI Translated</span>
                    </Box>
                )}
                {error && !isLoading && (
                    <Box className="flex items-center gap-1">
                        <Tooltip title="Translation failed. Click to retry.">
                            <IconButton
                                size="small"
                                onClick={retry}
                                className="text-red-500 hover:bg-red-50 p-0.5"
                            >
                                <RefreshCw size={14} />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="caption" className="text-red-500 text-xs">
                            Retry Translation
                        </Typography>
                    </Box>
                )}
            </Box>

            {isLoading ? (
                <Box className="space-y-1">
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="80%" />
                </Box>
            ) : (
                paragraphs.map((p, i) => (
                    <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-line', mb: 0.5 }}>
                        {p}
                    </Typography>
                ))
            )}
        </Box>
    );
}
