import type { Metadata } from "next";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import React from "react";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";
import { RecentUsersTable } from "@/components/admin/RecentUsersTable";

export const metadata: Metadata = {
  title: "Admin Dashboard | Smart Persona",
  description: "Smart Persona Admin Dashboard - Manage users, companies, and system analytics",
};

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Overview Metrics */}
      <div className="col-span-12">
        <AdminMetrics />
      </div>

      {/* Charts Section */}
      <div className="col-span-12 xl:col-span-8">
        <UserGrowthChart />
      </div>

      {/* Recent Activity */}
      <div className="col-span-12 xl:col-span-4 space-y-6">
        <RecentUsersTable />
      </div>
    </div>
  );
}
