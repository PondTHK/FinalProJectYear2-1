"use client";

import React, { useEffect, useRef } from "react";
import Hero from "../Components/Hero";
import Message from "../Components/Message";
import ShowCase from "../Components/ShowCase";
import Navbar from "../Components/Navbar";

import "locomotive-scroll/dist/locomotive-scroll.css";

const Page: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    let scrollInstance: any = null;
    let cleanupResizeObs: (() => void) | null = null;

    import("locomotive-scroll").then(({ default: LocomotiveScroll }: any) => {
      if (!scrollRef.current) return;

      const options: any = {
        el: scrollRef.current as HTMLElement,
        smooth: true,
      };

      scrollInstance = new LocomotiveScroll(options);

      // อัปเดตเมื่อคอนเทนเนอร์รีไซซ์ เพื่อลด layout jump
      if (typeof ResizeObserver !== "undefined" && scrollRef.current) {
        const ro = new ResizeObserver(() => {
          scrollInstance?.update?.();
        });
        ro.observe(scrollRef.current);
        cleanupResizeObs = () => ro.disconnect();
      }
    });

    return () => {
      cleanupResizeObs?.();
      scrollInstance?.destroy?.();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <div data-scroll-container ref={scrollRef}>
      <Navbar />
      <Hero />
      <Message />
      <ShowCase />
    </div>
  );
};

export default Page;
