"use client";
import React from "react";

export const GenerationJobsTable = () => {
  // TODO: Implement with generation jobs API when available
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Generation Jobs
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          AI generation jobs status
        </p>
      </div>
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Generation jobs data will be displayed here</p>
        <p className="text-xs mt-2">API endpoint needed: GET /api/admin/generation-jobs</p>
      </div>
    </div>
  );
};

