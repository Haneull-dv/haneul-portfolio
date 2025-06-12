"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';

const pdfMap: Record<string, string> = {
  '미래정치연구소 연구보조원': '/pdfs/mirae_politics.pdf',
  'Blog Platform': '/pdfs/blog_platform.pdf',
};

const ProjectsPage: React.FC = () => {
  const [openedIdx, setOpenedIdx] = useState<null | number>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', active: true }
  ];

  const projects = [
    {
      title: 'Conan AI',
      description: '재무팀 및 IR팀을 위한 업무 자동화 플랫폼입니다. 재무제표 합계검증 및 전기보고서 대사, 재무제표 DSD 생성, 동종업계 주요 공시 및 실적 요약, 애널리스트 리포트 요약 기능을 제공합니다.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      status: 'In Progress',
      image: '/projects/conanai.png',
      github: '#',
      demo: '#'
    },
    {
      title: '네오위즈 IR팀 인턴',
      description: '공시 업무와 주주총회를 지원했습니다. IR미팅을 대응하고 IR자료를 제작하는 등 다양한 업무도 수행했습니다.',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Socket.io'],
      status: 'Completed',
      image: '/projects/네오위즈.png',
      github: '#',
      demo: '#'
    },
    {
      title: '미래정치연구소 연구보조원',
      description: '동유럽 5개국의 시민-정당 관계 동향을 모니터링하여 월간 보고서를 작성했습니다. 주요 이슈를 구조화하여 요약하고 인사이트를 도출하여 월례발표회에서 정기 발표를 수행했습니다 .',
      technologies: ['Research', 'Excel', 'Word', 'Policy Analysis'],
      status: 'Completed',
      image: '/projects/미래정치연구소.png',
      github: '#',
      demo: '#'
    },
    {
      title: '파스타집 사업계획서',
      description: '아르바이트 하던 파스타집의 사업개선을 위해 사장님께 제안한 자료입니다. 마케팅, 사업개선 방안, 동종업계 비교 등의 내용을 담았습니다.',
      technologies: ['Next.js', 'MDX', 'Prisma', 'NextAuth'],
      status: 'Planning',
      image: '/projects/쏘어_사업계획서.png',
      github: '#',
      demo: '#'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#4caf50';
      case 'In Progress': return '#ff9800';
      case 'Planning': return '#2196f3';
      default: return '#757575';
    }
  };

  return (
    <Layout>
      <PageHeader 
        title="Projects" 
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className='bx bx-plus bx-fade-down-hover'></i>
            <span className="text">New Project</span>
          </a>
        }
      />

      <CardContainer columns={2} gap="large">
        {projects.map((project, index) => (
          <div key={index}>
            <Card 
              title={project.title}
              headerActions={
                <>
                  <i 
                    className='bx bx-link-external'
                    onClick={() => window.open('https://conan.ai.kr', '_blank')}
                    style={{ cursor: 'pointer' }}
                  ></i>
                  <i className='bx bx-dots-vertical-rounded'></i>
                </>
              }
              onClick={
                project.title === '네오위즈 IR팀 인턴'
                  ? () => window.location.href = '/projects/neowiz'
                  : pdfMap[project.title]
                    ? () => setOpenedIdx(openedIdx === index ? null : index)
                    : undefined
              }
              style={{ minHeight: 420, display: 'flex', flexDirection: 'column', height: '100%', cursor: (project.title === '네오위즈 IR팀 인턴' || pdfMap[project.title]) ? 'pointer' : undefined }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                <img 
                  src={project.image} 
                  alt={project.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    style={{
                      padding: '4px 12px',
                      backgroundColor: getStatusColor(project.status),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {project.status}
                  </span>
                </div>

                <p style={{ 
                  color: 'var(--dark-grey)', 
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {project.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {project.technologies.map((tech, techIndex) => (
                    <span 
                      key={techIndex}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--grey)',
                        color: 'var(--dark)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginTop: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--grey)'
                }}>
                  <a 
                    href={project.github}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--blue)',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <i className='bx bxl-github'></i>
                    GitHub
                  </a>
                  <a 
                    href={project.demo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--blue)',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <i className='bx bx-link-external'></i>
                    Live Demo
                  </a>
                </div>
              </div>
            </Card>
            {pdfMap[project.title] && openedIdx === index && (
              <div style={{ marginTop: 16, width: '100%' }}>
                <iframe
                  src={pdfMap[project.title]}
                  title={project.title + ' PDF'}
                  width="100%"
                  height="600px"
                  style={{ border: '1px solid #ddd', borderRadius: 8, background: 'white' }}
                />
              </div>
            )}
          </div>
        ))}
      </CardContainer>
    </Layout>
  );
};

export default ProjectsPage; 