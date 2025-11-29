"use client";

import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Typography } from "@mui/material";

const StyledWrapper = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "2rem",

    ".loader-container": {
        position: "relative",
        width: "200px",
        height: "200px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },

    ".loader-wrapper": {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "1.2em",
        fontWeight: 600,
        color: "#475569",
        borderRadius: "50%",
        backgroundColor: "transparent",
        userSelect: "none",
    },

    ".loader-circle": {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        backgroundColor: "transparent",
        animation: "loader-combined 2.5s linear infinite",
        zIndex: 1,
    },

    "@keyframes loader-combined": {
        "0%": {
            transform: "rotate(0deg)",
            boxShadow:
                "0 6px 12px 0 #a855f7 inset, 0 12px 18px 0 #6366f1 inset, 0 36px 36px 0 #8b5cf6 inset, 0 0 10px 2px rgba(168, 85, 247, 0.2)",
        },
        "50%": {
            transform: "rotate(180deg)",
            boxShadow:
                "0 6px 12px 0 #ec4899 inset, 0 12px 18px 0 #8b5cf6 inset, 0 36px 36px 0 #6366f1 inset, 0 0 15px 4px rgba(236, 72, 153, 0.3)",
        },
        "100%": {
            transform: "rotate(360deg)",
            boxShadow:
                "0 6px 12px 0 #a855f7 inset, 0 12px 18px 0 #6366f1 inset, 0 36px 36px 0 #8b5cf6 inset, 0 0 10px 2px rgba(168, 85, 247, 0.2)",
        },
    },

    ".loader-letter": {
        display: "inline-block",
        opacity: 0.4,
        transform: "translateY(0)",
        animation: "loader-letter-anim 2.4s infinite",
        zIndex: 2,
        position: "relative",
        color: "#1e293b", // Darker text for visibility
        textShadow: "0 0 2px rgba(255,255,255,0.5)",
    },

    "@keyframes loader-letter-anim": {
        "0%, 100%": {
            opacity: 0.4,
            transform: "translateY(0)",
            textShadow: "none",
        },
        "20%": {
            opacity: 1,
            transform: "translateY(-2px)",
            textShadow: "0 0 10px rgba(168, 85, 247, 0.6)",
            color: "#7c3aed",
        },
        "40%": {
            opacity: 0.7,
            transform: "translateY(0)",
        },
    },

    ".dynamic-text": {
        marginTop: "2rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "1rem",
        color: "#64748b",
        textAlign: "center",
        minHeight: "1.5em",
        animation: "fade-in 0.5s ease-out",
    },

    "@keyframes fade-in": {
        "0%": { opacity: 0 },
        "100%": { opacity: 1 },
    },
}));

export const AiLoadingIndicator = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    const messages = [
        "กำลังวิเคราะห์โปรไฟล์ของคุณ...",
        "กำลังสแกนหางานที่เหมาะสม...",
        "กำลังเปรียบเทียบทักษะและประสบการณ์...",
        "กำลังคำนวณคะแนนความเข้ากันได้...",
        "กำลังสรุปผลการแนะนำงาน..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const mainText = "AI Matching...".split("");

    return (
        <StyledWrapper>
            <div className="loader-container">
                <div className="loader-wrapper">
                    <div className="loader-circle" />
                    {mainText.map((char, index) => (
                        <span
                            key={index}
                            className="loader-letter"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))}
                </div>
            </div>

            <Typography className="dynamic-text">
                {messages[messageIndex]}
            </Typography>
        </StyledWrapper>
    );
};
