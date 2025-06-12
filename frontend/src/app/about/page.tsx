"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';

const AboutPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'About Me', active: true }
  ];

  return (
    <Layout>
      <PageHeader 
        title="About Me" 
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
            <span className="text">Download CV</span>
          </a>
        }
      />

      <CardContainer columns={2} gap="large">
        <Card 
          title="About" 
          headerActions={
            <>
              <i className='bx bx-edit'></i>
              <i className='bx bx-dots-vertical-rounded'></i>
            </>
          }
        >
          <div style={{ lineHeight: '1.8' }}>
            <p>
              안녕하세요! 저는 <strong>김하늘</strong>입니다. 
              풀스택 개발자로서 현대적인 웹 기술을 활용하여 
              사용자 중심의 애플리케이션을 개발하는 것을 좋아합니다.
            </p>
            <p>
              React, Next.js, TypeScript를 주로 사용하며, 
              백엔드는 Node.js와 Python을 활용합니다. 
              항상 새로운 기술을 배우고 적용하는 것에 열정을 가지고 있습니다.
            </p>
            <p>
              사용자 경험을 최우선으로 생각하며, 
              깔끔하고 직관적인 인터페이스 설계에 중점을 둡니다.
            </p>
          </div>
        </Card>

        <Card 
          title="Profile" 
          headerActions={
            <>
              <i className='bx bx-user-circle'></i>
              <i className='bx bx-dots-vertical-rounded'></i>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img 
                src="https://placehold.co/120x120/4285f4/ffffff?text=HK" 
                alt="Profile" 
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '4px solid var(--blue)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>이름:</span>
                <span>김하늘 (Haneul Kim)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>학교:</span>
                <span>명지대학교</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>경력:</span>
                <span>네오위즈 IR팀 인턴(2022.12 - 2023.06)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>위치:</span>
                <span>대한민국, 경기도 용인시</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>이메일:</span>
                <span>haneull.dv@gmail.com</span>
              </div>
            </div>
          </div>
        </Card>
      </CardContainer>
    </Layout>
  );
};

export default AboutPage; 