"use client";

import React from 'react';
import Image from 'next/image';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';
import styles from './about.module.scss';

const LanguageBar = ({ label, filled }: { label: string; filled: number }) => (
  <div style={{ marginBottom: '3px' }}>
    <div style={{ marginBottom: '8px', fontWeight: 400, color: 'var(--dark)', fontFamily: 'inherit', fontSize: 16 }}>{label}</div>
    <div style={{ display: 'flex', gap: '4px' }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            width: '14px',
            height: '14px',
            backgroundColor: i < filled ? '#173e92' : '#e5e7eb',
            borderRadius: '3px',
            transition: 'background-color 0.3s ease'
          }}
        />
      ))}
    </div>
  </div>
);

const certifications = [
  '삼정KPMG 보고서 자동화 과정 - 수강중',
  '재경관리사 - 삼일회계법인',
  '전략기획 케이스 스터디 수료 - 강남 취·창업허브센터',
  '한경협 ESG 전문가 - 한경협 국제경영원',
  '한국사능력검정시험 1급 - 교육부 국사편찬위원회'
];

const techSkills = {
  Frontend: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Zustand'],
  Backend: ['FastAPI', 'Python', 'PostgreSQL', 'Redis', 'Docker', 'MSA Architecture'],
  Tools: ['AWS', 'Kubernetes', 'Docker','Git', 'JIRA', 'Slack', 'Notion', 'Cursor AI']
};

const CardBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: '#f9f9f9',
      border: '1px solid #eee',
      borderRadius: 0,
      padding: '1.5rem',
      // Remove marginBottom, color, fontSize, lineHeight overrides
    }}
  >{children}</div>
);

const AboutPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'About Me', active: true }
  ];

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        <PageHeader
          title="About Me"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'About Me', active: true }
          ]}
          className={styles.card}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <a href="#" className={styles.actionButton} style={{ width: 'auto', maxWidth: 180 }}>
              <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
              <span>Download CV</span>
            </a>
          </div>
        </PageHeader>
        <div className={styles.validationGrid}>
        <div className={styles.card}>
          <h3>About</h3>
          <CardBox>
            <div
              style={{
                fontFamily: 'inherit',
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.6,
                color: 'var(--dark)',
                height: 'auto',
              }}
            >
              <div>
                기술은 도구일 뿐, 제가 집중하는 건 <strong>업무 효율과 빠른 의사결정이 가능한 실무 환경을 만드는 일</strong>입니다.
                
                재무회계 지식과 개발 역량, AI 활용 능력을 바탕으로 재무팀 실무자의 귀중한 시간을 아껴주는 데 보탬이 되고 싶습니다.
              </div>
              </div>
            </CardBox>
          </div>
          <div className={styles.card}>
            <h3>Profile</h3>
            <CardBox>
              <div className={styles.profileInfoList} style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400, color: 'var(--dark)', height: 140, display: 'flex', alignItems: 'center', margin: '-6px' }}>
                <div>
                  <div className={styles.profileInfoRow} style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400 }}><span>김하늘 (Haneul Kim)</span></div>
                  <div className={styles.profileInfoRow} style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400 }}><span>명지대학교 정치외교학과</span></div>
                  <div className={styles.profileInfoRow} style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400 }}><span>네오위즈 IR팀 인턴 (2022.12 - 2023.06)</span></div>
                  <div className={styles.profileInfoRow} style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400 }}><span>대한민국, 경기도 용인시</span></div>
                  <div className={styles.profileInfoRow} style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400 }}><span>haneull.dv@gmail.com</span></div>
                </div>
              </div>
            </CardBox>
          </div>
        </div>
        <div className={styles.validationGrid} style={{ marginTop: 3 }}>
          <div className={styles.card}>
            <h3>Language Proficiency</h3>
            <CardBox>
              <div style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400, color: 'var(--dark)', height: 140, display: 'flex', alignItems: 'center', margin: '-6px' }}>
                <div>
                  <LanguageBar label="한국어 (Native)" filled={5} />
                  <LanguageBar label="영어 (TOEIC Speaking AL(170)/ TOEIC 875)" filled={4} />
                  <LanguageBar label="일본어 (JLPT N4)" filled={3} />
                </div>
              </div>
            </CardBox>
          </div>
          <div className={styles.card}>
            <h3>Certifications</h3>
            <CardBox>
              <div style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400, height: 140, display: 'flex', alignItems: 'center', margin: '-6px' }}>
                <div style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400, lineHeight: 1.6, color: 'var(--dark)' }}>
                  {certifications.map((cert, idx) => (
                    <div key={idx} style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 400 }}>{cert}</div>
                  ))}
                </div>
              </div>
            </CardBox>
          </div>
        </div>
        <div style={{ display: 'flex', width: '100%', marginTop: 3 }}>
          <div className={styles.card} style={{ flex: 2 }}>
            <h3>Technical Skills</h3>
            <CardBox>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '180px',
                width: '100%',
                color: 'var(--dark)',
                fontSize: 16,
                fontWeight: 400,
                fontFamily: 'inherit'
              }}>
                {Object.entries(techSkills).map(([category, items]) => (
                  <div key={category}>
                    <h4 style={{ marginBottom: '8px', fontWeight: '600' }}>{category}</h4>
                    <ul style={{ paddingLeft: '1rem' }}>
                      {items.map((item, idx) => (
                        <li key={idx} style={{ lineHeight: 1.6 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardBox>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage; 