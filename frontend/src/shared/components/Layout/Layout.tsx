"use client";

import React from 'react';
// useSidebar 훅의 실제 경로를 확인해주세요.
import { useSidebar } from '../../hooks/useSidebar';
import Sidebar from '../Sidebar/Sidebar'; // Sidebar 컴포넌트의 상대 경로
import styles from './Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isHidden, toggleSidebar } = useSidebar();

  return (
    <>
      <button
        className={styles.hamburger}
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 3001,
          display: 'none',
        }}
      >
        <i className="bx bx-menu"></i>
      </button>
      <div className={styles.layout}>
        <Sidebar isHidden={isHidden} toggleSidebar={toggleSidebar} />
        <section id="content" className={styles.content}>
          {children}
        </section>
      </div>
    </>
  );
};

export default Layout;