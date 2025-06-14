"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

const DigestPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Digest', active: true }
  ];

  return (
    <Layout>
      <PageHeader 
        title="Digest" 
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
          background: '#e6fff2',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <i className='bx bxs-book-content' style={{ fontSize: '4rem', color: '#27ae60', marginBottom: '20px' }}></i>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>리포트 요약</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            애널리스트 리포트의 핵심 내용을 요약 제공하여, 
            투자 포인트와 산업 이슈를 빠르고 효율적으로 파악할 수 있습니다.
          </p>
          <div style={{ marginTop: '30px' }}>
            <button style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              리포트 요약하기
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DigestPage; 