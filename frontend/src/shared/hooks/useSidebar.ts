"use client";

import { useState, useEffect } from 'react';

export const useSidebar = () => {
  const [isHidden, setIsHidden] = useState(false);

  const toggleSidebar = () => {
    setIsHidden(prev => !prev);
  };

  const adjustSidebar = () => {
    if (window.innerWidth <= 576) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
  };

  useEffect(() => {
    adjustSidebar();
    
    const handleResize = () => {
      adjustSidebar();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    isHidden,
    toggleSidebar,
  };
}; 