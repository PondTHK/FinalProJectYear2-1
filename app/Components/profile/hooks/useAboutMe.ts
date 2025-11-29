import React, { useEffect, useState } from "react";

export interface UseAboutMeReturn {
  aboutMe: string;
  isEditingAboutMe: boolean;
  aboutMeTemp: string;
  handleEditAboutMe: () => void;
  handleSaveAboutMe: () => void;
  handleCancelEditAboutMe: () => void;
  setAboutMeTemp: React.Dispatch<React.SetStateAction<string>>;
}

export const useAboutMe = (): UseAboutMeReturn => {
  const [aboutMe, setAboutMe] = useState<string>("");
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false);
  const [aboutMeTemp, setAboutMeTemp] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAboutMe = localStorage.getItem("user_about_me");
      if (savedAboutMe) {
        setAboutMe(savedAboutMe);
      }
    }
  }, []);

  const handleEditAboutMe = () => {
    setAboutMeTemp(aboutMe);
    setIsEditingAboutMe(true);
  };

  const handleSaveAboutMe = () => {
    setAboutMe(aboutMeTemp);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_about_me", aboutMeTemp);
    }
    setIsEditingAboutMe(false);
  };

  const handleCancelEditAboutMe = () => {
    setAboutMeTemp(aboutMe);
    setIsEditingAboutMe(false);
  };

  return {
    aboutMe,
    isEditingAboutMe,
    aboutMeTemp,
    handleEditAboutMe,
    handleSaveAboutMe,
    handleCancelEditAboutMe,
    setAboutMeTemp,
  };
};

