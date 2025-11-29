import CompanyApprovalList from "@/components/admin/CompanyApprovalList";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "อนุมัติบริษัท | Smart Persona Admin",
  description: "หน้าอนุมัติบริษัทที่สมัครและกรอกข้อมูลแล้ว",
};

export default function CompanyApprovalPage() {
  return (
    <div>
      <CompanyApprovalList />
    </div>
  );
}

