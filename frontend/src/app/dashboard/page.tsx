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
              <a href="#" className={styles.actionButton}>
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
          게임 산업 분석과 재무 데이터 처리를 위한 통합 워크스페이스
        </div>
        <div className={styles.dashboardWidgetGrid}>
          <div className={styles.dashboardWidget}><DigestWidget /></div>
          <div className={styles.dashboardWidget}><TrendsWidget /></div>
          <div className={styles.dashboardWidget}><ValidationWidget /></div>
          <div className={styles.dashboardWidget}><DSDWidget /></div>
          <div className={styles.dashboardWidget}>{/* TODO: 위젯 추가 자리 */}</div>
          <div className={styles.dashboardWidget}>{/* TODO: 위젯 추가 자리 */}</div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
  