// src/shared/components/Layout/Layout.tsx

"use client";

import React, { useState } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import Sidebar from '../Sidebar/Sidebar';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // SSR을 고려한 useMediaQuery 훅으로 isMobile 상태 관리
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  // 메뉴 클릭 시 (모바일에서) 사이드바 닫기
  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // content 영역의 클래스를 동적으로 결정
  const contentClassName = isMobile ? styles.content : `${styles.content} ${styles.contentPC}`;

  return (
    <div className={styles.layout}>
      {/* 모바일 사이드바 오버레이 */}
      {isMobile && isSidebarOpen && (
        <div className={styles.overlay} onClick={handleCloseSidebar} />
      )}

      {/* 모바일 햄버거 버튼 */}
      {isMobile && (
        <button
          className={styles.hamburger}
          aria-label="Toggle sidebar"
          onClick={handleToggleSidebar}
        >
          <i className="bx bx-menu"></i>
        </button>
      )}

      <Sidebar
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onMenuClick={handleCloseSidebar}
      />

      <main id="content" className={contentClassName}>
        {children}
      </main>
    </div>
  );
};

export default Layout;