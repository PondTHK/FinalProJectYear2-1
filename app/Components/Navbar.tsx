"use client";
import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Link } from "@/src/navigation";
import Image from "next/image";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "next-intl";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Navbar");

  const navLinks = [
    { title: t("home"), href: "/" },
    { title: t("dreamJobs"), href: "/jobs" },
    { title: t("contact"), href: "/contact" },
  ];

  const toggleMenu = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const menuVars: Variants = {
    initial: {
      scaleY: 0,
    },
    animate: {
      scaleY: 1,
      transition: {
        duration: 0.5,
        ease: [0.12, 0, 0.39, 0],
      },
    },
    exit: {
      scaleY: 0,
      transition: {
        delay: 0.5,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const containerVars = {
    initial: {
      transition: {
        staggerChildren: 0.09,
        staggerDirection: -1,
      },
    },
    open: {
      transition: {
        delay: 0.2,
        staggerChildren: 0.09,
        staggerDirection: 1,
      },
    },
  };

  return (
    <header className="fixed z-50 w-full md:px-10 px-4 py-3 flex justify-between items-center bg-transparent backdrop-blur-sm shadow-sm">
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="logo"
            width={100}
            height={100}
            className="w-12"
          />
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {link.title}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Link href="/company-register">
          <button className="bg-[#E2A458] cursor-pointer uppercase px-8 py-2 h1-color font-Antonio font-bold rounded-full">
            {t("joinUs")}
          </button>
        </Link>
        <div
          className="md:hidden text-2xl text-white cursor-pointer"
          onClick={toggleMenu}
        >
          &#9776;
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={menuVars}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed left-0 top-0 w-full h-screen origin-top bg-[#A16833] text-white p-10"
          >
            <div className="flex h-full flex-col">
              <div className="flex justify-between">
                <h1 className="text-lg text-white">
                  <Image
                    src="/images/logo.png"
                    alt="logo"
                    width={100}
                    height={100}
                    className="w-12"
                  />
                </h1>
                <p
                  className="cursor-pointer text-md text-white"
                  onClick={toggleMenu}
                >
                  {t("close")}
                </p>
              </div>
              <motion.div
                variants={containerVars}
                initial="initial"
                animate="open"
                exit="initial"
                className="flex flex-col h-full justify-center items-center gap-4 "
              >
                {navLinks.map((link, index) => {
                  return (
                    <div className="overflow-hidden" key={index}>
                      <MobileNavLink
                        key={index}
                        title={link.title}
                        href={link.href}
                        onClick={toggleMenu}
                      />
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

const mobileLinkVars: Variants = {
  initial: {
    y: "30vh",
    transition: {
      duration: 0.5,
      ease: [0.37, 0, 0.63, 1] as const,
    },
  },
  open: {
    y: 0,
    transition: {
      ease: [0, 0.55, 0.45, 1] as const,
      duration: 0.7,
    },
  },
};

const MobileNavLink = ({
  title,
  href,
  onClick
}: {
  title: string;
  href: string;
  onClick: () => void;
}) => {
  return (
    <motion.div
      variants={mobileLinkVars}
      className="text-5xl uppercase text-white"
    >
      <Link href={href} onClick={onClick}>{title}</Link>
    </motion.div>
  );
};
