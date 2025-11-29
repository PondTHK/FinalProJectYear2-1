import React, { useState } from "react";
import { userAPI } from "@/app/lib/api";

export interface UsePortfolioDeleteReturn {
  deleteDialogOpen: boolean;
  isDeleting: boolean;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteClick: () => void;
  handleDeleteConfirm: (portfolioId: string, onSuccess?: () => void) => Promise<void>;
  handleDeleteCancel: () => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePortfolioDelete = (): UsePortfolioDeleteReturn => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (portfolioId: string, onSuccess?: () => void) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await userAPI.deletePortfolio(portfolioId);

      if (response.ok || response.status === 204) {
        setDeleteDialogOpen(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMessage =
          (response.data as any)?.error ||
          (typeof response.data === "string" ? response.data : null) ||
          "ไม่สามารถลบผลงานได้ กรุณาลองอีกครั้ง";
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการลบผลงาน กรุณาลองอีกครั้ง";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setError(null);
  };

  return {
    deleteDialogOpen,
    isDeleting,
    setDeleteDialogOpen,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    error,
    setError,
  };
};

