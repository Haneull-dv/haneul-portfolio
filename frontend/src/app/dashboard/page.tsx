"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import BirthdayCake from '@/shared/components/BirthdayCake/BirthdayCake';

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
        padding: '20px'
      }}>
        <BirthdayCake />
      </div>
    </Layout>
  );
};

export default DashboardPage;
  