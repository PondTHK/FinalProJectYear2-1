import JobPostsList from "@/components/admin/JobPostsList";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "โพสต์งาน | Smart Persona Admin",
  description: "หน้าดูโพสต์งานที่บริษัทต่างๆ โพสต์ไว้",
};

export default function JobPostsPage() {
  return (
    <div>
      <JobPostsList />
    </div>
  );
}

