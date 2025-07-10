"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import DigestWidget from './components/DigestWidget';
import TrendsWidget from './components/TrendsWidget';
import ValidationWidget from './components/ValidationWidget';
import DSDWidget from './components/DSDWidget';
import styles from './digest/digest.module.scss';

const DashboardPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', active: true },
    { label: 'Home' }
  ];

  return (
    <Layout>
      <div className={styles.contentWrapper}>
        <div className={styles.pageHeaderArea}>
          <PageHeader 
            title="Dashboard" 
            breadcrumbs={breadcrumbs}
            actions={
              <a href="#" className={`${styles.actionButton} ${styles.primary}`} style={{background: '#472a03', color: '#fff', width: 'auto', padding: '8px 16px', margin: 0, fontWeight: 600, fontSize: 15, border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: 'none', outline: 'none', minWidth: 0, minHeight: 0, backgroundColor: '#472a03 !important', colorScheme: 'none'}}>
                <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
                <span className="text">Get PDF</span>
              </a>
            }
          />
        </div>
        <div className={styles.pageTitle}>
          Haneul's Financial Workspace
        </div>
        <div style={{marginBottom: 18, color: '#6b7280', fontSize: 15}}>
          재무팀 IR팀을 위한 업무 효율화 플랫폼
        </div>
        <div className={styles.dashboardWidgetGrid}>
          <div className={styles.dashboardWidget}><DigestWidget /></div>
          <div className={styles.dashboardWidget}><TrendsWidget /></div>
          <div className={styles.dashboardWidget}><ValidationWidget /></div>
          <div className={styles.dashboardWidget}><DSDWidget /></div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
  