"use client";
import React from "react";

export const ProfileSharesTable = () => {
  // TODO: Implement with profile shares API when available
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Profile Shares
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Most viewed shared profiles
        </p>
      </div>
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Profile shares data will be displayed here</p>
      </div>
    </div>
  );
};

