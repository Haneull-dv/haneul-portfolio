"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

const TrendsPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Trends', active: true }
  ];

  return (
    <Layout>
      <PageHeader 
        title="Trends" 
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
          background: '#ffe6f0',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <i className='bx bxs-trending-up' style={{ fontSize: '4rem', color: '#e91e63', marginBottom: '20px' }}></i>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>시장 동향</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            산업별 시가총액 상위 기업의 주가 변동, 주요 공시, 실적 발표 동향을 정리해 드립니다. 
            PDF 리포트 형식으로 다운로드도 가능합니다.
          </p>
          <div style={{ marginTop: '30px' }}>
            <button style={{
              background: '#e91e63',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              동향 분석하기
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrendsPage; 