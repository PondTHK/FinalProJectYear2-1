"use client";
import React, { useEffect, useState } from "react";
import Badge from "../common/Badge";
import { ArrowUpIcon, GroupIcon, BoxIconLine, UserIcon, ShootingStarIcon } from "@/icons";
import { adminAPI } from "../../../../app/lib/api";
import type { DashboardStats } from "../../../../app/lib/api";
import { redirectToLoginIfUnauthorized } from "@/lib/handleUnauthorized";

export const AdminMetrics = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        if (redirectToLoginIfUnauthorized(response.status)) {
          return;
        }

        if (response.ok) {
          setStats(response.data);
        } else {
          console.error("Failed to fetch dashboard stats:", response.status, response.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="h-12 w-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5 space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="h-8 w-24 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
      label: "Total Users",
      value: stats?.total_users?.toLocaleString() || "0",
      // change: "+12.5%",
      changeType: "success" as const,
    },
    {
      icon: <UserIcon className="text-gray-800 size-6 dark:text-white/90" />,
      label: "New Users Today",
      value: stats?.new_users_today?.toLocaleString() || "0",
      change: `+${stats?.new_users_today || 0}`,
      changeType: "success" as const,
    },
    {
      icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
      label: "Total Companies",
      value: stats?.total_companies?.toLocaleString() || "0",
      // change: "+5.2%",
      changeType: "success" as const,
    },
    {
      icon: <ShootingStarIcon className="text-gray-800 size-6 dark:text-white/90" />,
      label: "Total Job Posts",
      value: stats?.total_job_posts?.toLocaleString() || "0",
      // change: "+2.4%",
      changeType: "success" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {metric.icon}
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.label}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value}
              </h4>
            </div>
            <Badge color={metric.changeType}>
              <ArrowUpIcon />
              {metric.change}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

