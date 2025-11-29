"use client";
import { useGSAP } from "@gsap/react";
import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

interface ProductItem {
  bg: string;
  elements: string;
  drink: string;
  title: string;
  rotate: string;
}

const ShowCase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    productRefs.current.forEach((el) => {
      if (!el) return;

      const handleMove = (e: MouseEvent) => {
        const elem = el.querySelector(".elem") as HTMLElement;
        const prod = el.querySelector(".prod") as HTMLElement;

        if (elem) {
          gsap.to(elem, {
            x: (e.clientX - window.innerWidth / 2) / 40,
          });
        }

        if (prod) {
          gsap.to(prod, {
            y: (e.clientY - window.innerHeight / 2) / 10,
            x: (e.clientX - window.innerWidth / 2) / 10,
          });
        }
      };

      el.addEventListener("mousemove", handleMove);

      return () => el.removeEventListener("mousemove", handleMove);
    });
  }, []);

  useGSAP(() => {
    if (!containerRef.current || !trackRef.current) return;

    // 🔥 Responsive scroll with matchMedia
    ScrollTrigger.matchMedia({
      // Desktop / large screens
      "(min-width: 1024px)": () => {
        if (!trackRef.current || !containerRef.current) return;
        const totalScroll =
          trackRef.current.scrollWidth - containerRef.current.offsetWidth;

        gsap.to(trackRef.current, {
          x: -totalScroll,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: `+=${totalScroll}`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });
      },

      // Mobile / tablets
      "(max-width: 1023px)": () => {
        if (!trackRef.current || !containerRef.current) return;
        const totalScroll =
          trackRef.current.scrollWidth - containerRef.current.offsetWidth;

        gsap.to(trackRef.current, {
          x: -totalScroll,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "30% center",
            end: `+=${totalScroll}`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });
      },
    });

    // ✅ Recalculate on resize
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);

  const productData: ProductItem[] = [
    {
      bg: "pngtree-instagram-color-gradient-background-picture-image_1912080.webp",
      elements:
        "Lucid_Origin_3D_exploded_Instagram_logo_made_of_colorful_gradi_3-removebg-preview.webp",
      drink: "instagram-logo_971166-164497-Photoroom.webp",
      title: "Instagram",
      rotate: "-rotate-6",
    },
    {
      bg: "photo-1671159593357-ee577a598f71.webp",
      elements: "Gemini_Generated_Image_2thukc2thukc2thu-Photoroom.webp",
      drink: "x-new-social-network-black-app-icon-twitter-rebranded-as-x-twitter-s-logo-was-changed_277909-626-Photoroom.webp",
      title: "X",
      rotate: "rotate-6",
    },
    {
      bg: "blue-bg.svg",
      elements: "Gemini_Generated_Image_a81wa0a81wa0a81w-Photoroom.webp",
      drink: "Facebook_logo_(square)-Photoroom.webp",
      title: "Facebook",
      rotate: "-rotate-6",
    },
  ];

  return (
    <>
      {/* Horizontal scroll wrapper */}
      <div
        ref={containerRef}
        className="h-screen w-full overflow-hidden bg-[#FAEADE] relative flex items-center slider"
      >
        {/* Track that moves horizontally */}
        <div
          ref={trackRef}
          className="flex h-full items-center gap-10 sm:gap-20 px-5 sm:px-20"
          style={{ willChange: "transform" }}
        >
          {/* Left text block */}
          <div className="flex-shrink-0 w-[80vw] md:w-[50vw] flex flex-col items-center justify-center uppercase text-4xl sm:text-6xl md:text-8xl font-Antonio font-bold text-center">
            <h1 className="h1-color">We connect with 3</h1>
            <div className="bg-[#FAEADE] -rotate-3 p-1 sm:p-2 mt-2">
              <div className="bg-[#A16833] py-2 sm:py-4 px-3 sm:px-6">
                <h1 className="text-[#FAEADE]">POPULAR</h1>
              </div>
            </div>
            <h1 className="h1-color mt-2">Platform</h1>
          </div>

          {/* Product Slides */}
          {productData.map((item, i) => (
            <div
              key={i}
              ref={(el) => {
                productRefs.current[i] = el;
              }}
              className={`slide relative min-w-[85vw] sm:min-w-[70vw] h-[60vh] sm:h-[70vh] flex-shrink-0 ${item.rotate}`}
            >
              <Image
                src={`/images/${item.bg}`}
                alt="showcase"
                fill
                className="w-full h-full object-cover rounded-4xl"
              />
              <Image
                src={`/images/${item.elements}`}
                alt="elem"
                fill
                className="absolute top-0 left-0 w-full h-full object-contain z-10 prod"
              />
              <Image
                src={`/images/${item.drink}`}
                alt="item"
                fill
                className="absolute top-0 left-0 w-full h-full object-contain z-20 elem"
              />
              <h1 className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 text-2xl sm:text-3xl md:text-5xl uppercase text-[#FAEADE] font-bold font-Antonio z-30">
                {item.title}
              </h1>
            </div>
          ))}
        </div>

        {/* Button overlay */}
        <div className="absolute z-50 px-5 sm:px-10 py-2 bottom-5 left-1/2 -translate-x-1/2">
          <button className="bg-[#E2A458] cursor-pointer uppercase px-8 sm:px-14 py-3 sm:py-4 h1-color font-Antonio font-extrabold rounded-3xl sm:rounded-4xl text-sm sm:text-base md:text-lg">
            Get it now
          </button>
        </div>
      </div>

      <Image src="/images/slider-dip.png" alt="" width={1920} height={100} className="w-full" />
    </>
  );
};

export default ShowCase;
