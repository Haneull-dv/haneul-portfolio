"use client";

import { useState } from 'react';

export const useActiveMenu = (defaultActive: string = 'dashboard') => {
  const [activeMenu, setActiveMenu] = useState(defaultActive);

  const setActive = (menuId: string) => {
    setActiveMenu(menuId);
  };

  return {
    activeMenu,
    setActive,
  };
}; 