"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/src/navigation";
import { motion } from "framer-motion";

type LanguageSwitcherProps = {
    variant?: 'light' | 'dark';
};

export default function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = () => {
        const nextLocale = locale === "en" ? "th" : "en";
        router.replace(pathname, { locale: nextLocale });
    };

    const isDark = variant === 'dark';

    // Styles based on variant
    const containerClass = isDark
        ? "border-black/10 bg-black/5 hover:bg-black/10"
        : "border-white/20 bg-white/10 hover:bg-white/20";

    const textActive = isDark ? "text-black" : "text-white";
    const textInactive = isDark ? "text-black/40" : "text-white/60";
    const dividerClass = isDark ? "bg-black/20" : "bg-white/20";

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-300 group ${containerClass}`}
        >
            <span className={`text-sm font-medium ${locale === 'en' ? textActive : textInactive} group-hover:${isDark ? 'text-black' : 'text-white'} transition-colors`}>
                EN
            </span>
            <div className={`h-4 w-[1px] ${dividerClass}`} />
            <span className={`text-sm font-medium ${locale === 'th' ? textActive : textInactive} group-hover:${isDark ? 'text-black' : 'text-white'} transition-colors`}>
                TH
            </span>
        </motion.button>
    );
}
