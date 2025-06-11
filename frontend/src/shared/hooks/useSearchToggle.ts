"use client";

import { useState } from 'react';

export const useSearchToggle = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const toggleSearch = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) {
      e.preventDefault();
      setIsSearchVisible(prev => !prev);
    }
  };

  return {
    isSearchVisible,
    toggleSearch,
  };
}; 