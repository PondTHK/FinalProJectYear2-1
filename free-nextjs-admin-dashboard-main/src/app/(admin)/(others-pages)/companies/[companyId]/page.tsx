"use client";

import React from "react";
import { useParams } from "next/navigation";
import CompanyDetail from "@/components/admin/CompanyDetail";

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return <CompanyDetail companyId={companyId} />;
}
