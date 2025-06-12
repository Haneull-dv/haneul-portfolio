"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';

const SkillsPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Skills', active: true }
  ];

  const LanguageBar = ({ label, filled }: { label: string; filled: number }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ marginBottom: '8px', fontWeight: '500' }}>{label}</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: i < filled ? 'var(--blue)' : 'var(--grey)',
              borderRadius: '4px',
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


  return (
    <Layout>
      <PageHeader
        title="Skills"
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className="bx bxs-download bx-fade-down-hover"></i>
            <span className="text">Export Skills</span>
          </a>
        }
      />

      <CardContainer columns={2} gap="large">
        <Card title="Language Proficiency" style={{ minHeight: '280px' }}>
          <LanguageBar label="한국어 (Native)" filled={5} />
          <LanguageBar label="영어 (TOEIC Speaking AL(170)/ TOEIC 875)" filled={4} />
          <LanguageBar label="일본어 (JLPT N4)" filled={3} />
        </Card>

        <Card title="Certifications" style={{ minHeight: '280px' }}>
          <ul style={{ paddingLeft: '1rem', lineHeight: '1.8em' }}>
            {certifications.map((cert, idx) => (
              <li key={idx} style={{ listStyleType: 'disc' }}>{cert}</li>
            ))}
          </ul>
        </Card>
      </CardContainer>

      <div style={{ marginTop: '32px' }}>
        <CardContainer columns={1}>
          <Card title="Technical Skills" style={{ minHeight: '280px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px'
            }}>
              {Object.entries(techSkills).map(([category, items]) => (
                <div key={category}>
                  <h4 style={{ marginBottom: '8px', fontWeight: '600' }}>{category}</h4>
                  <ul style={{ paddingLeft: '1rem' }}>
                    {items.map((item, idx) => (
                      <li key={idx} style={{ lineHeight: '1.6em' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </CardContainer>
      </div>
    </Layout>
  );
};

export default SkillsPage;
