"use client";

import { useSidebar } from '../../shared/hooks/useSidebar';
import { useMenuToggle } from '../../shared/hooks/useMenuToggle';
import Sidebar from '../../shared/components/Sidebar/Sidebar';
import Header from '../../shared/components/Header/Header';
import DashboardContent from '../../features/dashboard/DashboardContent';
import styles from './dashboard.module.scss';

const DashboardPage: React.FC = () => {
  const { isHidden, toggleSidebar } = useSidebar();
  const { 
    isNotificationOpen, 
    isProfileOpen, 
    toggleNotification, 
    toggleProfile 
  } = useMenuToggle();

  console.log('Dashboard rendering:', { isHidden, isNotificationOpen, isProfileOpen });

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar */}
      <Sidebar isHidden={isHidden} />
      
      {/* Content */}
      <section id="content" className={`${styles.content} ${isHidden ? styles.sidebarHidden : ''}`}>
        <Header 
          onMenuToggle={toggleSidebar}
          isNotificationOpen={isNotificationOpen}
          isProfileOpen={isProfileOpen}
          onNotificationToggle={toggleNotification}
          onProfileToggle={toggleProfile}
        />
        
        <DashboardContent />
      </section>
    </div>
  );
};

export default DashboardPage;
  