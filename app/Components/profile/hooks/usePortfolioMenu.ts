import React, { useState } from "react";
import type { UserPortfolioResponse } from "@/app/lib/api";

export interface UsePortfolioMenuReturn {
  anchorEl: HTMLElement | null;
  selectedPortfolio: UserPortfolioResponse | null;
  openMenu: boolean;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, portfolio: UserPortfolioResponse) => void;
  handleMenuClose: () => void;
  setSelectedPortfolio: React.Dispatch<React.SetStateAction<UserPortfolioResponse | null>>;
}

export const usePortfolioMenu = (): UsePortfolioMenuReturn => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<UserPortfolioResponse | null>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, portfolio: UserPortfolioResponse) => {
    setAnchorEl(event.currentTarget);
    setSelectedPortfolio(portfolio);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPortfolio(null);
  };

  return {
    anchorEl,
    selectedPortfolio,
    openMenu,
    handleMenuOpen,
    handleMenuClose,
    setSelectedPortfolio,
  };
};

