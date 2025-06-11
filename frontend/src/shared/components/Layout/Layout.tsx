"use client";

import React from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { useMenuToggle } from '../../hooks/useMenuToggle';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isHidden, toggleSidebar } = useSidebar();
  const { 
    isNotificationOpen, 
    isProfileOpen, 
    toggleNotification, 
    toggleProfile 
  } = useMenuToggle();

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar isHidden={isHidden} />
      
      {/* Content */}
      <section 
        id="content" 
        className={`${styles.content} ${isHidden ? styles.sidebarHidden : ''}`}
      >
        <Header 
          onMenuToggle={toggleSidebar}
          isNotificationOpen={isNotificationOpen}
          isProfileOpen={isProfileOpen}
          onNotificationToggle={toggleNotification}
          onProfileToggle={toggleProfile}
        />
        
        <main className={styles.main}>
          {children}
        </main>
      </section>
    </div>
  );
};

export default Layout; 