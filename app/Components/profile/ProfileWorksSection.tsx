"use client";

import React from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";
import type { UserPortfolioResponse } from "@/app/lib/api";
import { usePortfolioMenu } from "./hooks/usePortfolioMenu";
import { usePortfolioImageUpload } from "./hooks/usePortfolioImageUpload";
import { usePortfolioEdit } from "./hooks/usePortfolioEdit";
import { usePortfolioDelete } from "./hooks/usePortfolioDelete";
import PortfolioCard from "./components/PortfolioCard";
import PortfolioMenu from "./components/PortfolioMenu";
import PortfolioEditDialog from "./components/PortfolioEditDialog";
import PortfolioDeleteDialog from "./components/PortfolioDeleteDialog";

interface ProfileWorksSectionProps {
  portfolioItems: UserPortfolioResponse[];
  onPortfolioUpdate?: (() => void) | undefined;
}

const ProfileWorksSection: React.FC<ProfileWorksSectionProps> = ({
  portfolioItems,
  onPortfolioUpdate,
}) => {
  // Menu
  const {
    anchorEl,
    selectedPortfolio,
    openMenu,
    handleMenuOpen,
    handleMenuClose,
    setSelectedPortfolio,
  } = usePortfolioMenu();

  // Image upload
  const {
    imagePreview,
    isUploadingImage,
    handleImageSelect,
    setImagePreview,
    error: imageError,
  } = usePortfolioImageUpload();

  // Edit
  const {
    editDialogOpen,
    editFormData,
    isEditing,
    setEditFormData,
    handleEditClick,
    handleEditSave,
    handleEditCancel,
    error: editError,
  } = usePortfolioEdit(imagePreview, setImagePreview);

  // Delete
  const {
    deleteDialogOpen,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    error: deleteError,
  } = usePortfolioDelete();

  // Combined error state
  const error = imageError || editError || deleteError;

  // Menu actions
  const handleEdit = () => {
    if (selectedPortfolio) {
      handleEditClick(selectedPortfolio);
      handleMenuClose();
    }
  };

  const handleShare = async () => {
    if (selectedPortfolio?.link) {
      try {
        await navigator.clipboard.writeText(selectedPortfolio.link);
        handleMenuClose();
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handleDelete = () => {
    handleDeleteClick();
    handleMenuClose();
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (selectedPortfolio) {
      // Update image_url if image was uploaded
      const finalFormData: typeof editFormData = {
        ...editFormData,
        image_url: imagePreview || editFormData.image_url || null,
      };
      setEditFormData(finalFormData);
      
      await handleEditSave(selectedPortfolio.id, () => {
        if (onPortfolioUpdate) {
          onPortfolioUpdate();
        }
      });
    }
  };

  // Handle image select in edit dialog
  const handleEditImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const imageUrl = await handleImageSelect(event);
    if (imageUrl) {
      setEditFormData((prev) => ({ ...prev, image_url: imageUrl }));
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (selectedPortfolio) {
      await handleDeleteConfirm(selectedPortfolio.id, () => {
        setSelectedPortfolio(null);
        if (onPortfolioUpdate) {
          onPortfolioUpdate();
        }
      });
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "900px",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: "#1f2937",
          fontWeight: 700,
          mb: 4,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 4,
            height: 24,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: 2,
          }}
        />
        ผลงานของฉัน
      </Typography>

      {portfolioItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            bgcolor: "#f9fafb",
            borderRadius: 3,
            p: 6,
            textAlign: "center",
            border: "1px dashed #e5e7eb",
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "#9ca3af", fontStyle: "italic" }}
          >
            ยังไม่มีผลงานที่เพิ่มไว้
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={4}>
          {portfolioItems.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              onMenuClick={handleMenuOpen}
            />
          ))}
        </Stack>
      )}

      {/* Menu */}
      <PortfolioMenu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        onEdit={handleEdit}
        onShare={handleShare}
        onDelete={handleDelete}
      />

      {/* Edit Dialog */}
      <PortfolioEditDialog
        open={editDialogOpen}
        formData={editFormData}
        imagePreview={imagePreview}
        isEditing={isEditing}
        isUploadingImage={isUploadingImage}
        error={error}
        onClose={handleEditCancel}
        onSave={handleSaveEdit}
        onFormChange={setEditFormData}
        onImageSelect={handleEditImageSelect}
      />

      {/* Delete Dialog */}
      <PortfolioDeleteDialog
        open={deleteDialogOpen}
        portfolioTitle={selectedPortfolio?.title || ""}
        isDeleting={isDeleting}
        error={error}
        onClose={handleDeleteCancel}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default ProfileWorksSection;
