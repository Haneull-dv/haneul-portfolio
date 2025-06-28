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
              업무 프로세스 개선에 관심이 많아 IR팀 인턴 당시 수행했던 업무들을 자동화로 기획하여
              스타트업 경진대회 본선에도 진출한 경험이 있습니다.
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