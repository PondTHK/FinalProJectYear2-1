"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ParsedResumeData, UserProfilePayload, UserAddressPayload, UserEducationPayload, UserExperiencePayload } from '../lib/api';

interface OnboardingContextType {
  // Resume Data (from AI)
  resumeData: ParsedResumeData | null;
  setResumeData: (data: ParsedResumeData | null) => void;

  // Name (for Sidebar/Header)
  name: string;
  setName: (name: string) => void;

  // Personal Info
  personalInfo: UserProfilePayload & UserAddressPayload;
  setPersonalInfo: (data: UserProfilePayload & UserAddressPayload) => void;

  // Education
  education: UserEducationPayload[];
  setEducation: (data: UserEducationPayload[]) => void;

  // Experience
  experience: UserExperiencePayload[];
  setExperience: (data: UserExperiencePayload[]) => void;

  // Skills
  skills: string[];
  setSkills: (data: string[]) => void;

  // Social Media
  socialData: any | null;
  setSocialData: (data: any | null) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [resumeData, setResumeData] = useState<ParsedResumeData | null>(null);
  const [name, setName] = useState('');

  const [personalInfo, setPersonalInfo] = useState<UserProfilePayload & UserAddressPayload>({});
  const [education, setEducation] = useState<UserEducationPayload[]>([]);
  const [experience, setExperience] = useState<UserExperiencePayload[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [socialData, setSocialData] = useState<any | null>(null);

  return (
    <OnboardingContext.Provider value={{
      resumeData,
      setResumeData,
      name,
      setName,
      personalInfo,
      setPersonalInfo,
      education,
      setEducation,
      experience,
      setExperience,
      skills,
      setSkills,
      socialData,
      setSocialData
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
