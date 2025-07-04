"use client";

import React from 'react';
import Image from 'next/image';
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
              재무 도메인에 대한 이해와 AI활용·코딩 역량을 갖추고자 꾸준히 노력해왔습니다.
            </p>
            <p>
            IR팀 인턴으로 근무하며 반복되는 업무에서 개선점을 발견하고, 이를 자동화하는 솔루션을 직접 기획하고 구현해 스타트업 경진대회 본선에 진출했습니다.
            아이디어를 현실로 만드는 과정에서는 최신 기술과 AI 기반의 개발 도구를 적극적으로 활용하여, 핵심 로직 구현에 집중하고 개발 속도를 높입니다.
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
              <Image 
                src="https://placehold.co/120x120/4285f4/ffffff?text=HK" 
                alt="Profile" 
                width={120}
                height={120}
                style={{ 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '4px solid var(--blue)'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 이름 */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>이름:</span>
                <span>김하늘 (Haneul Kim)</span>
              </div>

              {/* 학교 */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>학교:</span>
                <span>명지대학교</span>
              </div>
              
              {/* 전공 */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>전공:</span>
                <span>정치외교학과</span>
              </div>

              {/* 경력 */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>경력:</span>
                <span>네오위즈 IR팀 인턴 (2022.12 - 2023.06)</span>
              </div>

              {/* 위치 */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>위치:</span>
                <span>대한민국, 경기도 용인시</span>
              </div>

              {/* 이메일 */}
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