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
  '파스타집 사업 개선 제안서': '/projects/pdfs/soar.pdf',
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
      period: '2025.04 ~ 2025.05',
      description: "IR팀 인턴으로 일하며 느낀 업무의 비효율을 해결하는 솔루션 Conan AI를 기획·설계했습니다. 스타트업 경진대회 본선 진출과 회계법인의 미팅 요청을 통해 실무성과와 시장성을 검증받았습니다.",
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
      period: '2022.12 ~ 2023.06',
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
      period: '2020.10 ~ 2021.03',
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
      period: '2022.10',
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
        <PageHeader
          title="Projects"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projects', active: true }
          ]}
          className={styles.card}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <a href="#" className={styles.actionButton} style={{ width: 'auto', maxWidth: 180 }}>
              <i className='bx bx-plus bx-fade-down-hover'></i>
              <span>New Project</span>
            </a>
          </div>
        </PageHeader>
        <div className={styles.projectGrid}>
          {projects.map((project, index) => (
            <div key={index} className={styles.projectCard} onClick={() => handleCardClick(project)}>
              <div className={styles.projectImageWrapper} style={{ height: 200, overflow: 'hidden' }}>
                <Image 
                  src={project.image} 
                  alt={project.title}
                  width={400}
                  height={200}
                  className={styles.projectImage}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
              <div className={styles.projectContent}>
                <div className={styles.projectTitleRow}>
                  <div className={styles.projectTitle}>{project.title}</div>
                  <div className={styles.projectDate}>{project.period}</div>
                </div>
                <div className={styles.projectDescription}>{project.description}</div>
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