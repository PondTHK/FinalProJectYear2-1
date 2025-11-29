import React, { useState } from "react";
import { storageAPI, userAPI, type UserProfileResponse } from "@/app/lib/api";

export interface UseImageUploadReturn {
  isUploadingProfile: boolean;
  isUploadingCover: boolean;
  cropModalOpen: boolean;
  cropImageSrc: string;
  cropType: "profile" | "cover";
  setCropModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleProfileImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCropComplete: (croppedImageBlob: Blob) => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useImageUpload = (
  profile: UserProfileResponse | null,
  setProfile: React.Dispatch<React.SetStateAction<UserProfileResponse | null>>,
  setProfileImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setCoverImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
): UseImageUploadReturn => {
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [cropType, setCropType] = useState<"profile" | "cover">("profile");
  const [error, setError] = useState<string | null>(null);

  const handleProfileImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropType("profile");
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const handleCoverImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropType("cover");
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const handleProfileImageUpload = async (croppedImageBlob: Blob) => {
    setIsUploadingProfile(true);
    setError(null);

    try {
      const isWebP = croppedImageBlob.type === "image/webp";
      const fileName = isWebP ? "profile.webp" : "profile.jpg";
      const fileType = isWebP ? "image/webp" : "image/jpeg";

      const file = new File([croppedImageBlob], fileName, {
        type: fileType,
      });

      const response = await storageAPI.uploadProfileImage(file);
      if (response.ok && response.data.url) {
        const imageUrl = response.data.url;
        setProfileImageUrl(imageUrl);
        if (typeof window !== "undefined") {
          localStorage.setItem("profile_image_url", imageUrl);
        }

        try {
          const updateResponse = await userAPI.upsertProfile({
            ...(profile || {}),
            profile_image_url: imageUrl,
          });
          if (updateResponse.ok && updateResponse.data) {
            setProfile(updateResponse.data);
          }
        } catch (updateErr) {
          console.error("Failed to update profile with image URL:", updateErr);
        }
      } else {
        const errorMessage =
          (response.data as any)?.error ||
          response.data?.message ||
          "Failed to upload profile image. Please try again.";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Profile image upload error:", err);
      setError("Failed to upload profile image. Please try again.");
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleCoverImageUpload = async (croppedImageBlob: Blob) => {
    setIsUploadingCover(true);
    setError(null);

    try {
      const isWebP = croppedImageBlob.type === "image/webp";
      const fileName = isWebP ? "cover.webp" : "cover.jpg";
      const fileType = isWebP ? "image/webp" : "image/jpeg";

      const file = new File([croppedImageBlob], fileName, {
        type: fileType,
      });

      const response = await storageAPI.uploadCoverImage(file);
      if (response.ok && response.data.url) {
        const imageUrl = response.data.url;
        setCoverImageUrl(imageUrl);
        if (typeof window !== "undefined") {
          localStorage.setItem("cover_image_url", imageUrl);
        }

        try {
          const updateResponse = await userAPI.upsertProfile({
            ...(profile || {}),
            cover_image_url: imageUrl,
          });
          if (updateResponse.ok && updateResponse.data) {
            setProfile(updateResponse.data);
          }
        } catch (updateErr) {
          console.error("Failed to update profile with image URL:", updateErr);
        }
      } else {
        const errorMessage =
          (response.data as any)?.error ||
          response.data?.message ||
          "Failed to upload cover image. Please try again.";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Cover image upload error:", err);
      setError("Failed to upload cover image. Please try again.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    if (cropType === "profile") {
      handleProfileImageUpload(croppedImageBlob);
    } else {
      handleCoverImageUpload(croppedImageBlob);
    }
  };

  return {
    isUploadingProfile,
    isUploadingCover,
    cropModalOpen,
    cropImageSrc,
    cropType,
    setCropModalOpen,
    handleProfileImageSelect,
    handleCoverImageSelect,
    handleCropComplete,
    error,
    setError,
  };
};
