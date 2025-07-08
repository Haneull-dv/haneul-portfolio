"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';
import PDFModal from '@/shared/components/PDFModal/PDFModal';
import VideoModal from '@/shared/components/VideoModal/VideoModal';
import styles from './projects.module.scss';

const pdfMap: Record<string, string> = {
  '파스타집 사업계획서': '/projects/pdfs/soar.pdf',
};

const ProjectsPage: React.FC = () => {
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<{url: string, title: string} | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title: string} | null>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', active: true }
  ];

  const projects = [
    {
      title: 'Conan AI',
      description: "IR 및 재무팀의 반복적인 수작업 업무를 자동화하여 핵심 업무에 집중할 수 있는 환경을 만들고자 했습니다. 문제 해결을 위한 아이디어를 구체화하여 업무 자동화 플랫폼 'Conan AI'를 기획하였고, 스타트업 경진대회 본선에 진출하며 아이디어의 사업성과 실현 가능성을 인정받았습니다.",
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      status: 'In Progress',
      image: '/projects/conanai.png',
      github: '#',
      demo: '#',
      hasModal: false,
      hasVideo: true,
    },
    {
      title: '네오위즈 IR팀 인턴',
      description: '기업의 지배구조에 관심을 갖고 네오위즈 IR팀에서 6개월간 근무했습니다. 주주총회 기획부터 공시 자료 작성, 애널리스트 미팅 지원까지 IR의 핵심 프로세스를 경험했습니다.',
      technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Socket.io'],
      status: 'Completed',
      image: '/projects/네오위즈.png',
      github: '#',
      demo: '#',
      hasModal: false,
      isNeowizProject: true,
    },
    {
      title: '미래정치연구소 연구보조원',
      description: '동유럽 5개국의 시민-정당 관계 동향을 추적, 분석하여 월간 보고서를 작성했습니다. 핵심 이슈를 구조화하고 데이터 기반의 인사이트를 도출했으며 이를 월례 발표회에서 전달했습니다.',
      technologies: ['Research', 'Excel', 'Word', 'Policy Analysis'],
      status: 'Completed',
      image: '/projects/미래정치연구소.png',
      github: '#',
      demo: '#',
      hasModal: false,
    },
    {
      title: '파스타집 사업 개선 제안서',
      description: '단순한 아르바이트 경험에 그치지 않고 매장의 성장을 위해 사업 개선안을 기획 및 제안했습니다. 마케팅 전략, 운영 효율화 방안, 주변 상권 및 경쟁사 분석을 포함한 자료를 통해 문제점을 진단하고 해결책을 제시했습니다.',
      technologies: ['Business Plan', 'Marketing', 'Analysis'],
      status: 'Completed',
      image: '/projects/쏘어_사업계획서.png',
      github: '#',
      demo: '#',
      hasModal: true,
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

  const handleCardClick = (project: typeof projects[0]) => {
    if (project.isNeowizProject) {
      window.location.href = '/projects/neowiz';
    } else if (project.hasVideo) {
      setSelectedVideo({ url: '/projects/ConanAI 소개영상(자막).mp4', title: project.title });
      setVideoModalOpen(true);
    } else if (project.hasModal && pdfMap[project.title]) {
      setSelectedPDF({ url: pdfMap[project.title], title: project.title });
      setPdfModalOpen(true);
    } else if (pdfMap[project.title]) {
      setSelectedPDF({ url: pdfMap[project.title], title: project.title });
      setPdfModalOpen(true);
    }
  };

  const closePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedPDF(null);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedVideo(null);
  };

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>Projects</span>
          </div>
          <h2 className={styles.cardTitle}>Projects</h2>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <a href="#" className={styles.actionButton} style={{ width: 'auto', maxWidth: 180 }}>
              <i className='bx bx-plus bx-fade-down-hover'></i>
              <span>New Project</span>
            </a>
          </div>
        </div>
        <div className={styles.projectGrid}>
          {projects.map((project, index) => (
            <div key={index} className={styles.projectCard} onClick={() => handleCardClick(project)}>
              <div className={styles.projectImageWrapper}>
                <Image 
                  src={project.image} 
                  alt={project.title}
                  width={400}
                  height={200}
                  className={styles.projectImage}
                />
              </div>
              <div className={styles.projectInfo}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <div className={styles.projectBadges}>
                  <span className={styles.badge + ' ' + (project.status === 'Completed' ? styles.badgeGreen : styles.badgeYellow)}>{project.status}</span>
                  {project.hasModal && <span className={styles.badge + ' ' + styles.badgeBlue}>PDF 뷰어</span>}
                </div>
                <p className={styles.projectDesc}>{project.description}</p>
                <div className={styles.projectTechList}>
                  {project.technologies.map((tech, techIndex) => (
                    <span key={techIndex} className={styles.projectTech}>{tech}</span>
                  ))}
                </div>
                <div className={styles.projectLinks}>
                  <a href={project.github} className={styles.projectLink}><i className='bx bxl-github'></i>GitHub</a>
                  <a href={project.demo} className={styles.projectLink}><i className='bx bx-link-external'></i>Live Demo</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* PDF 모달 */}
        {pdfModalOpen && selectedPDF && (
          <PDFModal
            isOpen={pdfModalOpen}
            onClose={closePdfModal}
            pdfUrl={selectedPDF.url}
            title={selectedPDF.title}
          />
        )}

        {/* Video 모달 */}
        {videoModalOpen && selectedVideo && (
          <VideoModal
            isOpen={videoModalOpen}
            onClose={closeVideoModal}
            videoUrl={selectedVideo.url}
            title={selectedVideo.title}
          />
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage; 