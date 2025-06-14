"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

const DSDPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'DSD', active: true }
  ];

  return (
    <Layout>
      <PageHeader 
        title="DSD" 
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
        padding: '20px',
        flexDirection: 'column'
      }}>
        <div style={{
          background: '#f0e6ff',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <i className='bx bxs-file-export' style={{ fontSize: '4rem', color: '#8e44ad', marginBottom: '20px' }}></i>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>DSD 변환</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            기존 엑셀 기반 재무제표를 버튼 클릭 한 번으로 전자공시용 DSD 양식으로 자동 변환합니다. 
            별도의 편집 없이 즉시 활용 가능합니다.
          </p>
          <div style={{ marginTop: '30px' }}>
            <button style={{
              background: '#8e44ad',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              DSD 변환하기
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DSDPage; 