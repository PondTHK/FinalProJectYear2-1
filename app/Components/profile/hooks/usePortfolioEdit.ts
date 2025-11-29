import React, { useState } from "react";
import { userAPI } from "@/app/lib/api";
import type { UserPortfolioResponse, UserPortfolioPayload } from "@/app/lib/api";

export interface UsePortfolioEditReturn {
  editDialogOpen: boolean;
  editFormData: UserPortfolioPayload;
  isEditing: boolean;
  setEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditFormData: React.Dispatch<React.SetStateAction<UserPortfolioPayload>>;
  handleEditClick: (portfolio: UserPortfolioResponse) => void;
  handleEditSave: (portfolioId: string, onSuccess?: () => void) => Promise<void>;
  handleEditCancel: () => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePortfolioEdit = (
  _imagePreview: string | null,
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>
): UsePortfolioEditReturn => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UserPortfolioPayload>({
    title: "",
    description: "",
    link: "",
    image_url: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditClick = (portfolio: UserPortfolioResponse) => {
    setEditFormData({
      title: portfolio.title || "",
      description: portfolio.description || "",
      link: portfolio.link || "",
      image_url: portfolio.image_url || "",
    });
    setImagePreview(portfolio.image_url || null);
    setEditDialogOpen(true);
  };

  const handleEditSave = async (portfolioId: string, onSuccess?: () => void) => {
    if (!editFormData.title || editFormData.title.trim() === "") {
      setError("กรุณากรอกชื่อผลงาน");
      return;
    }

    setIsEditing(true);
    setError(null);

    try {
      const response = await userAPI.updatePortfolio(portfolioId, editFormData);

      if (response.ok && response.data) {
        setEditDialogOpen(false);
        setEditFormData({
          title: "",
          description: "",
          link: "",
          image_url: "",
        });
        setImagePreview(null);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorMessage =
          (response.data as any)?.error ||
          (typeof response.data === "string" ? response.data : null) ||
          "ไม่สามารถอัพเดทผลงานได้ กรุณาลองอีกครั้ง";
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการอัพเดทผลงาน กรุณาลองอีกครั้ง";
      setError(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditFormData({
      title: "",
      description: "",
      link: "",
      image_url: "",
    });
    setImagePreview(null);
    setError(null);
  };

  return {
    editDialogOpen,
    editFormData,
    isEditing,
    setEditDialogOpen,
    setEditFormData,
    handleEditClick,
    handleEditSave,
    handleEditCancel,
    error,
    setError,
  };
};
