"use client";

import React from 'react';
import Image from 'next/image';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';
import styles from './about.module.scss';

const AboutPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'About Me', active: true }
  ];

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>About Me</span>
          </div>
          <h2 className={styles.cardTitle}>About Me</h2>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <a href="#" className={styles.actionButton} style={{ width: 'auto', maxWidth: 180 }}>
              <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
              <span>Download CV</span>
            </a>
          </div>
        </div>
        <div className={styles.validationGrid}>
          <div className={styles.card}>
            <h3>About</h3>
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
          </div>
          <div className={styles.card}>
            <h3>Profile</h3>
            <div className={styles.profileImageWrapper}>
              <Image 
                src="https://placehold.co/120x120/4285f4/ffffff?text=HK" 
                alt="Profile" 
                width={120}
                height={120}
                className={styles.profileImage}
              />
            </div>
            <div className={styles.profileInfoList}>
              <div className={styles.profileInfoRow}><span>이름:</span><span>김하늘 (Haneul Kim)</span></div>
              <div className={styles.profileInfoRow}><span>학교:</span><span>명지대학교</span></div>
              <div className={styles.profileInfoRow}><span>전공:</span><span>정치외교학과</span></div>
              <div className={styles.profileInfoRow}><span>경력:</span><span>네오위즈 IR팀 인턴 (2022.12 - 2023.06)</span></div>
              <div className={styles.profileInfoRow}><span>위치:</span><span>대한민국, 경기도 용인시</span></div>
              <div className={styles.profileInfoRow}><span>이메일:</span><span>haneull.dv@gmail.com</span></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage; 