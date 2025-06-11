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

  const frontendSkills = [
    { name: 'React', level: 90 },
    { name: 'Next.js', level: 85 },
    { name: 'TypeScript', level: 88 },
    { name: 'JavaScript', level: 92 },
    { name: 'HTML/CSS', level: 95 },
    { name: 'Tailwind CSS', level: 80 }
  ];

  const backendSkills = [
    { name: 'Node.js', level: 85 },
    { name: 'Python', level: 80 },
    { name: 'Express.js', level: 82 },
    { name: 'MongoDB', level: 75 },
    { name: 'PostgreSQL', level: 78 },
    { name: 'REST API', level: 88 }
  ];

  const tools = [
    'Git & GitHub',
    'VS Code',
    'Docker',
    'AWS',
    'Figma',
    'Postman',
    'Webpack',
    'Vite'
  ];

  const SkillBar = ({ name, level }: { name: string; level: number }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: '500' }}>{name}</span>
        <span style={{ color: 'var(--blue)', fontWeight: '600' }}>{level}%</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: 'var(--grey)', 
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${level}%`, 
          height: '100%', 
          backgroundColor: 'var(--blue)',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );

  return (
    <Layout>
      <PageHeader 
        title="Skills" 
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className='bx bxs-download bx-fade-down-hover'></i>
            <span className="text">Export Skills</span>
          </a>
        }
      />

      <CardContainer columns={2} gap="large">
        <Card 
          title="Language Proficiency" 
          headerActions={
            <>
              <i className='bx bx-code-alt'></i>
              <i className='bx bx-dots-vertical-rounded'></i>
            </>
          }
        >
          <div>
            {frontendSkills.map((skill, index) => (
              <SkillBar key={index} name={skill.name} level={skill.level} />
            ))}
          </div>
        </Card>

        <Card 
          title="Certifications" 
          headerActions={
            <>
              <i className='bx bx-server'></i>
              <i className='bx bx-dots-vertical-rounded'></i>
            </>
          }
        >
          <div>
            {backendSkills.map((skill, index) => (
              <SkillBar key={index} name={skill.name} level={skill.level} />
            ))}
          </div>
        </Card>
      </CardContainer>

      <div style={{ marginTop: '32px' }}>
        <CardContainer columns={1}>
          <Card 
            title="Technical Skills" 
            headerActions={
              <>
                <i className='bx bx-wrench'></i>
                <i className='bx bx-dots-vertical-rounded'></i>
              </>
            }
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px' 
            }}>
              {tools.map((tool, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--blue)',
                    color: 'white',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: '500',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {tool}
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