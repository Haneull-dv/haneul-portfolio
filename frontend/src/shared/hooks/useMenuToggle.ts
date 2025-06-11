"use client";

import { useState, useEffect, useCallback } from 'react';

export const useMenuToggle = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleNotification = useCallback(() => {
    setIsNotificationOpen(prev => !prev);
    setIsProfileOpen(false); // Close profile menu if open
  }, []);

  const toggleProfile = useCallback(() => {
    setIsProfileOpen(prev => !prev);
    setIsNotificationOpen(false); // Close notification menu if open
  }, []);

  const closeAllMenus = useCallback(() => {
    setIsNotificationOpen(false);
    setIsProfileOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.notification') && !target.closest('.profile')) {
        closeAllMenus();
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [closeAllMenus]);

  return {
    isNotificationOpen,
    isProfileOpen,
    toggleNotification,
    toggleProfile,
    closeAllMenus,
  };
}; 