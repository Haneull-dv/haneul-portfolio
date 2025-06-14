"use client";

import { useState } from 'react';

export const useSidebar = () => {
  const [isHidden, setIsHidden] = useState(false);

  const toggleSidebar = () => {
    setIsHidden(prev => !prev);
  };

  return {
    isHidden,
    toggleSidebar,
  };
}; 