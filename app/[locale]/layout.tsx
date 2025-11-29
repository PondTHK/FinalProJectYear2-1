import "../globals.css";
import localFont from "next/font/local";
import { Antonio, Poppins } from "next/font/google";
import { Metadata } from "next";
import ThemeRegistry from "../ThemeRegistry";
import { AuthProvider } from "@/app/lib/auth/auth-context";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/src/navigation';

const inter = localFont({
  src: "../../public/fonts/ProximaNova-Regular.otf",
  weight: "400",
  variable: "--font-inter",
});

const antonio = Antonio({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-Antonio",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-Poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Persona",
  description: "Animated Website",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/images/logo.png" />
      </head>
      <body className={`${inter.variable} ${antonio.variable} ${poppins.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeRegistry>
            <AuthProvider>{children}</AuthProvider>
          </ThemeRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
