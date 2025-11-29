"use client";

import React from "react";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  Chip,
  Stack,
  IconButton,
  Typography,
} from "@mui/material";
import {
  Launch as LaunchIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import type { UserPortfolioResponse } from "@/app/lib/api";
import { getViewsCount, extractTags, cleanDescription } from "../utils/portfolioUtils";

interface PortfolioCardProps {
  item: UserPortfolioResponse;
  onMenuClick: (event: React.MouseEvent<HTMLElement>, portfolio: UserPortfolioResponse) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ item, onMenuClick }) => {
  const views = getViewsCount(item.id);
  const tags = extractTags(item.description);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: "#ffffff",
        border: "1px solid #e5e7eb",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
          borderColor: "#d1d5db",
        },
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            {item.title.charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: "#1f2937",
            }}
          >
            {item.title.split(" ")[0] || "User"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{ color: "#6b7280" }}
          onClick={(e) => onMenuClick(e, item)}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Main Image */}
      {item.image_url ? (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            overflow: "hidden",
            bgcolor: "#f3f4f6",
          }}
        >
          <CardMedia
            component="img"
            image={item.image_url}
            alt={item.title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            aspectRatio: "16/9",
            bgcolor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#9ca3af", fontStyle: "italic" }}
          >
            ไม่มีรูปภาพ
          </Typography>
        </Box>
      )}

      {/* Card Footer */}
      <CardContent
        sx={{
          p: 3,
          "&:last-child": {
            pb: 3,
          },
        }}
      >
        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1f2937",
            mb: 1.5,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            lineHeight: 1.3,
          }}
        >
          {item.title}
        </Typography>

        {/* Views Count */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mb: 2,
          }}
        >
          <VisibilityIcon sx={{ fontSize: 16, color: "#6b7280" }} />
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            {views.toLocaleString()} Views
          </Typography>
        </Box>

        {/* Tags */}
        {tags.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
          >
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  bgcolor: "rgba(99, 102, 241, 0.1)",
                  color: "#6366f1",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 24,
                  "&:hover": {
                    bgcolor: "rgba(99, 102, 241, 0.15)",
                  },
                }}
              />
            ))}
          </Stack>
        )}

        {/* Description */}
        {item.description && (
          <Typography
            variant="body2"
            sx={{
              color: "#4b5563",
              lineHeight: 1.6,
              mb: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {cleanDescription(item.description)}
          </Typography>
        )}

        {/* Link */}
        {item.link && (
          <Box
            component="a"
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: "#6366f1",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              mt: 1,
              transition: "all 0.2s ease",
              "&:hover": {
                color: "#4f46e5",
                gap: 0.75,
              },
            }}
          >
            <LaunchIcon sx={{ fontSize: 16 }} />
            ดูผลงาน
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioCard;

