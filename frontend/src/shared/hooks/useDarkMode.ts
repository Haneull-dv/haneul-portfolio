"use client";

import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const newValue = !prev;
      if (newValue) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      localStorage.setItem('darkMode', newValue.toString());
      return newValue;
    });
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDark(true);
      document.body.classList.add('dark');
    }
  }, []);

  return {
    isDark,
    toggleDarkMode,
  };
}; 