import React, { useState } from "react";
import { storageAPI } from "@/app/lib/api";

export interface UsePortfolioImageUploadReturn {
  imagePreview: string | null;
  isUploadingImage: boolean;
  handleImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<string | null>;
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const usePortfolioImageUpload = (): UsePortfolioImageUploadReturn => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<string | null> => {
    const file = event.target.files?.[0];
    if (!file) return null;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("ขนาดไฟล์ต้องไม่เกิน 10MB");
      return null;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setIsUploadingImage(true);
    setError(null);

    try {
      const response = await storageAPI.uploadFile(file, "portfolio");

      if (response.ok && response.data && response.data.url) {
        const imageUrl = response.data.url;
        setImagePreview(imageUrl);
        event.target.value = "";
        setIsUploadingImage(false);
        return imageUrl;
      } else {
        const errorMessage =
          (response.data as any)?.error ||
          (typeof response.data === "string" ? response.data : null) ||
          response.data?.message ||
          "ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองอีกครั้ง";
        setError(errorMessage);
        setIsUploadingImage(false);
        return null;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ กรุณาลองอีกครั้ง";
      setError(errorMessage);
      setIsUploadingImage(false);
      return null;
    }
  };

  return {
    imagePreview,
    isUploadingImage,
    handleImageSelect,
    setImagePreview,
    error,
    setError,
  };
};

