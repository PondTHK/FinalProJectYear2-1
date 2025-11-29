import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { aiAPI } from '@/app/lib/api';

const CACHE_PREFIX = 'ai_translation_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
    text: string;
    timestamp: number;
}

export function useAiTranslation(text: string | null | undefined, targetLang: string = 'en') {
    const locale = useLocale();
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTranslation = async (retryCount = 0) => {
        if (!text) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await aiAPI.translate({
                text,
                target_language: targetLang
            });

            if (response.translated_text) {
                setTranslatedText(response.translated_text);

                // Save to cache with timestamp
                const cacheKey = `${CACHE_PREFIX}${targetLang}_${text.substring(0, 50)}_${text.length}`;
                const entry: CacheEntry = {
                    text: response.translated_text,
                    timestamp: Date.now()
                };
                localStorage.setItem(cacheKey, JSON.stringify(entry));
            }
        } catch (err) {
            console.error(`Translation failed (attempt ${retryCount + 1}):`, err);

            if (retryCount < 2) {
                // Auto-retry with simple backoff
                setTimeout(() => {
                    fetchTranslation(retryCount + 1);
                }, 1000 * (retryCount + 1)); // 1s, then 2s
            } else {
                setError("Translation failed");
            }
        } finally {
            if (retryCount >= 2 || !error) { // Only stop loading if success or max retries reached
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!text) {
            setTranslatedText(null);
            return;
        }

        if (locale !== targetLang) {
            setTranslatedText(null);
            return;
        }

        const cacheKey = `${CACHE_PREFIX}${targetLang}_${text.substring(0, 50)}_${text.length}`;
        const cachedRaw = localStorage.getItem(cacheKey);

        if (cachedRaw) {
            try {
                // Try parsing as JSON (new format)
                const entry: CacheEntry = JSON.parse(cachedRaw);
                const now = Date.now();

                // Check expiration
                if (now - entry.timestamp < CACHE_EXPIRY_MS) {
                    setTranslatedText(entry.text);
                    return;
                } else {
                    // Expired
                    localStorage.removeItem(cacheKey);
                }
            } catch (e) {
                // Fallback for old string format (backward compatibility)
                // Treat as valid but maybe migrate it? For now just use it.
                // Or better: invalidate old format to force refresh with timestamp
                localStorage.removeItem(cacheKey);
            }
        }

        // Debounce slightly to avoid rapid calls
        const timer = setTimeout(() => fetchTranslation(0), 100);
        return () => clearTimeout(timer);

    }, [text, locale, targetLang]);

    const retry = () => fetchTranslation(0);

    return {
        text: translatedText || text,
        isTranslated: !!translatedText,
        isLoading,
        error,
        retry
    };
}
