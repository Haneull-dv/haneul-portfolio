"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

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

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        <p>우측 하단의 AI 어시스턴트와 대화해보세요! 💬</p>
      </div>
    </Layout>
  );
};

export default DashboardPage;
  