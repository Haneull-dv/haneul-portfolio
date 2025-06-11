"use client";

import React from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';

const ProjectsPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', active: true }
  ];

  const projects = [
    {
      title: 'E-Commerce Platform',
      description: 'React와 Node.js를 사용한 풀스택 이커머스 플랫폼입니다. 사용자 인증, 결제 시스템, 관리자 대시보드 등의 기능을 포함합니다.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      status: 'Completed',
      image: 'https://placehold.co/300x200/4285f4/ffffff?text=E-Commerce',
      github: '#',
      demo: '#'
    },
    {
      title: 'Task Management App',
      description: '팀 협업을 위한 태스크 관리 애플리케이션입니다. 실시간 업데이트, 파일 공유, 댓글 시스템 등을 제공합니다.',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Socket.io'],
      status: 'In Progress',
      image: 'https://placehold.co/300x200/34a853/ffffff?text=Task+App',
      github: '#',
      demo: '#'
    },
    {
      title: 'Weather Dashboard',
      description: '실시간 날씨 정보를 제공하는 대시보드입니다. 다양한 차트와 시각화를 통해 날씨 데이터를 표시합니다.',
      technologies: ['React', 'Chart.js', 'Weather API', 'Tailwind'],
      status: 'Completed',
      image: 'https://placehold.co/300x200/ff9800/ffffff?text=Weather',
      github: '#',
      demo: '#'
    },
    {
      title: 'Blog Platform',
      description: '개발자를 위한 블로그 플랫폼입니다. 마크다운 에디터, 코드 하이라이팅, 댓글 시스템을 지원합니다.',
      technologies: ['Next.js', 'MDX', 'Prisma', 'NextAuth'],
      status: 'Planning',
      image: 'https://placehold.co/300x200/9c27b0/ffffff?text=Blog',
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
          <Card 
            key={index}
            title={project.title}
            headerActions={
              <>
                <i className='bx bx-link-external'></i>
                <i className='bx bx-dots-vertical-rounded'></i>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
        ))}
      </CardContainer>
    </Layout>
  );
};

export default ProjectsPage; 