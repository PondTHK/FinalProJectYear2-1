"use client";

const primarySkills = ["Product Design", "User Experience", "User Research", "Wireframing", "Web"];
const secondarySkills = [
  "User flows",
  "Figma",
  "B2B",
  "Webflow",
  "Journey Mapping",
  "User Interviews",
  "Concept Testing",
  "Usability Testing",
  "Card Sorting",
  "Surveys",
  "A/B Testing",
  "Focus Groups",
  "Roadmapping",
  "UX Writer",
  "Information Architecture",
  "Visual Design",
  "Interaction Design",
];

export default function SkillsSection() {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#2d2b45]">Skills</h2>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {primarySkills.map((skill) => (
          <span key={skill} className="rounded-full bg-[#c2f5d4] px-4 py-2 text-sm font-medium text-[#236042]">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {secondarySkills.map((skill) => (
          <span key={skill} className="rounded-full border border-[#e4e0f9] bg-white px-4 py-2 text-sm text-[#5e5b80]">
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}

