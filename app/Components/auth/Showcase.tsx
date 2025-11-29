"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { AuthMode } from "./types";

const BRAND_NAME = "Smart Persona";

// const cardCopy = {
//   signup: {
//     eyebrow: "Playbooks",
//     title: "Smart Persona Studio",
//     body: "Curate cross-channel behaviours, tones, and automations in a few guided inputs.",
//   },
//   signin: {
//     eyebrow: "Configuration",
//     title: "Create a new persona",
//     body: "Name the agent, pick a tone, and link your CRM or workspace docs. Smart Persona will choreograph the rest.",
//   },
// };

// const floatingIcons: Array<{
//   id: string;
//   direction: "down" | "up";
//   delay: number;
//   style: CSSProperties;
//   icon: JSX.Element;
// }> = [
//   {
//     id: "spark",
//     direction: "down",
//     delay: 0.15,
//     style: { left: "10%", top: "15%" },
//   },
//   {
//     id: "pulse",
//     direction: "up",
//     delay: 0.3,
//     style: { left: "15%", bottom: "25%" },
//   },
//   {
//     id: "sun",
//     direction: "down",
//     delay: 0.45,
//     style: { right: "12%", top: "22%" },
//   },
//   {
//     id: "target",
//     direction: "up",
//     delay: 0.6,
//     style: { right: "18%", bottom: "28%" },
//   },
// ];

type ShowcaseProps = {
  mode: AuthMode;
};

export default function Showcase({ mode }: ShowcaseProps) {
  const [videoReady, setVideoReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVideoReady(true);
      return;
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVideoReady(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl"
    >
      {videoReady ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute left-0 top-0 h-full w-full object-cover"
        >
          <source src="/videos/test.mp4" type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 bg-[#090909] opacity-80"
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/90" />
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Image
              src="/images/logo.png"
              alt={`${BRAND_NAME} logo`}
              width={48}
              height={48}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/60">
              {BRAND_NAME}
            </p>
            <p className="text-xl font-bold text-white">
              Craft softer onboarding
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${mode}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
              className="w-full max-w-md"
            >
              {mode === "signup" ? <QuoteBlock /> : <FeatureBlock />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div />
      </div>
    </div>
  );
}

function QuoteBlock() {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-lg backdrop-blur-xl">
      <h3 className="text-4xl font-bold text-white">
        Welcome to Smart Persona
      </h3>
      <p className="mt-4 text-lg leading-relaxed text-white/80">
        An intelligent assistant to streamline your workflow, automate tasks,
        and unlock new levels of productivity. Let our AI handle the repetitive
        work, so you can focus on what truly matters.
      </p>
      <div className="mt-6 flex items-center justify-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer rounded-full bg-gradient-to-r from-[#ffb067] via-[#ff8364] to-[#ff5d6b] px-6 py-3 font-semibold text-white shadow-lg"
        >
          Learn More
        </motion.div>
      </div>
    </div>
  );
}

function FeatureBlock() {
  const features = [
    {
      icon: <OnboardingIcon />,
      title: "AI-Powered Onboarding",
      body: "Personalized onboarding flows that adapt to your needs.",
    },
    {
      icon: <JobMatchingIcon />,
      title: "Intelligent Job Matching",
      body: "Our AI finds the perfect job opportunities for you.",
    },
  ];

  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-lg backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.35em] text-white/60">
        Key Features
      </p>
      <h3 className="mt-2 text-3xl font-bold text-white">
        Unlock Your Potential
      </h3>
      <p className="mt-3 text-lg leading-relaxed text-white/80">
        Sign in to discover a smarter way to manage your career.
      </p>
      <div className="mt-8 grid gap-6 text-left">
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
            className="flex items-start gap-4"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#ff8364]">
              {feature.icon}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {feature.title}
              </p>
              <p className="mt-1 text-md text-white/70">{feature.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function OnboardingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7.5" r="4.5" />
      <path d="m17 11 4 4-4 4" />
    </svg>
  );
}

function JobMatchingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
