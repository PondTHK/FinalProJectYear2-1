"use client";
import { useGSAP } from "@gsap/react";
import React from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useRouter } from "next/navigation";

gsap.registerPlugin(SplitText);
gsap.registerPlugin(ScrollTrigger);

const Hero: React.FC = () => {
  const router = useRouter();

  const handleSignupClick = () => {
    router.push("/auth");
  };

  useGSAP(() => {
    let splitedText = SplitText.create(".animatedLetters h1", {
      type: "chars",
    });

    const tl = gsap.timeline();

    tl.from(splitedText.chars, {
      y: 100,
      delay: 1,
      duration: 0.8,
      opacity: 0,
      ease: "power4.out",
      stagger: 0.05,
    });

    gsap.from(".animatedDiv", {
      opacity: 0,
      y: -100,
      ease: "power4.out",
      delay: 0.99,
      duration: 0.1,
    });

    const splitedpara = SplitText.create(".animatedpara p", {
      type: "words , lines",
    });

    tl.from(splitedpara.lines, {
      y: 100,
      duration: 0.8,
      opacity: 0,
      ease: "power4.out",
      stagger: 0.07,
    });

    tl.from(".btn", {
      y: -100,
      duration: 0.5,
      opacity: 0,
      ease: "back.out(1.7)",
    });

    gsap.set(".vid-div", {
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      borderRadius: "0% 0% 0% 0%",
    });

    gsap.to(".vid-div", {
      clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)",
      borderRadius: "0% 0% 40% 10%",
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: ".vid-div",
        start: "10% top",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  return (
    <>
      {/* Hero Section */}
      <div className="h-screen w-full max-w-screen relative vid-div">
        <video
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover absolute z-0"
        >
          <source
            src="/videos/SmartPersona_Intelligent_Website_Assistant_Videoundefined.mp4"
            type="video/mp4"
          />
        </video>

        <div className="h-full w-full absolute z-10 flex items-center justify-center px-4 sm:px-6 md:px-10">
          <div className="w-full max-w-3xl text-center">
            {/* Animated Heading */}
            <div className="animatedLetters">
              <h1 className="text-5xl sm:text-5xl md:text-7xl lg:text-8xl uppercase font-extrabold h1-color font-Antonio">
                Smart Persona
              </h1>
            </div>

            {/* Animated Div */}
            <div className="bg-[#FFEECF] p-2 mt-0 md:mt-3 -rotate-3 animatedDiv">
              <div className="flex items-center justify-center h1-bg-color py-2 sm:px-4 md:px-6 md:py-6 overflow-hidden">
                <h1 className="text-5xl sm:text-4xl md:text-6xl lg:text-8xl uppercase font-extrabold h1-2color text-center font-Antonio">
                  AI That Knows You
                </h1>
              </div>
            </div>

            {/* Paragraph */}
            <div className="flex justify-center animatedpara">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-xl sm:max-w-2xl font-semibold leading-snug text-[#FFFFFF] font-inter mt-4 sm:mt-10">
                FYNEX คือผู้ช่วยอัจฉริยะที่เข้าใจคุณ
                สามารถปรับแต่งเว็บไซต์ให้ตรงใจ สร้างประสบการณ์ที่ไม่เหมือนใคร
                และเรียนรู้จากพฤติกรรมผู้ใช้แบบเรียลไทม์
              </p>
            </div>

            {/* Button */}
            <div className="flex justify-center btn">
              <button
                onClick={handleSignupClick}
                className="bg-[#FFFFFF] uppercase px-8 sm:px-12 md:px-14 py-3 sm:py-4 text-base sm:text-lg md:text-xl h1-color font-Antonio font-extrabold rounded-3xl mt-8 sm:mt-10 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                สมัครเข้าใช้งาน
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
