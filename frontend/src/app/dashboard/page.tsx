"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import DigestWidget from './components/DigestWidget';
import TrendsWidget from './components/TrendsWidget';
import ValidationWidget from './components/ValidationWidget';
import DSDWidget from './components/DSDWidget';
import styles from './dashboard.module.scss';

const DashboardPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', active: true },
    { label: 'Home' }
  ];

  return (
    <Layout>
      <PageHeader 
        title="Dashboard" 
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
            <span className="text">Get PDF</span>
          </a>
        }
      />

      <div className={styles.dashboardContainer}>
        {/* Workspace Header */}
        <div className={styles.workspaceHeader}>
          <div className={styles.backgroundCircle}></div>
          <div className={styles.content}>
            <h1>Haneul's Financial Workspace</h1>
            <p>게임 산업 분석과 재무 데이터 처리를 위한 통합 워크스페이스</p>
          </div>
        </div>

        {/* Widget Grid */}
        <div className={styles.gridContainer}>
          <DigestWidget />
          <TrendsWidget />
          <ValidationWidget />
          <DSDWidget />
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
  