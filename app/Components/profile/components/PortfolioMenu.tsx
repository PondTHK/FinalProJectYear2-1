"use client";

import React from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
} from "@mui/icons-material";

interface PortfolioMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}

const PortfolioMenu: React.FC<PortfolioMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onEdit,
  onShare,
  onDelete,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      PaperProps={{
        sx: {
          mt: 1.5,
          minWidth: 180,
          borderRadius: 2,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          border: "1px solid #e5e7eb",
        },
      }}
    >
      <MenuItem
        onClick={onEdit}
        sx={{
          "&:hover": {
            backgroundColor: "rgba(99, 102, 241, 0.08)",
          },
        }}
      >
        <ListItemIcon>
          <EditIcon fontSize="small" sx={{ color: "#6366f1" }} />
        </ListItemIcon>
        <ListItemText primary="แก้ไข" />
      </MenuItem>
      <MenuItem
        onClick={onShare}
        sx={{
          "&:hover": {
            backgroundColor: "rgba(99, 102, 241, 0.08)",
          },
        }}
      >
        <ListItemIcon>
          <ShareIcon fontSize="small" sx={{ color: "#10b981" }} />
        </ListItemIcon>
        <ListItemText primary="คัดลอกลิงก์" />
      </MenuItem>
      <MenuItem
        onClick={onDelete}
        sx={{
          "&:hover": {
            backgroundColor: "rgba(239, 68, 68, 0.08)",
          },
        }}
      >
        <ListItemIcon>
          <DeleteIcon fontSize="small" sx={{ color: "#ef4444" }} />
        </ListItemIcon>
        <ListItemText primary="ลบ" />
      </MenuItem>
    </Menu>
  );
};

export default PortfolioMenu;

