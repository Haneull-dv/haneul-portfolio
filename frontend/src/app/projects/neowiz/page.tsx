"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import PDFModal from '@/shared/components/PDFModal/PDFModal';
import styles from '../projects.module.scss';

const researchCards = [
  {
    title: '게임업계 블록체인 플랫폼 리서치',
    image: '/neowiz/blockchain_research.png',
    type: '리서치',
    description: '게임업계의 블록체인 플랫폼 동향을 정리한 리서치 자료입니다.',
    pdf: '/projects/pdfs/blockchainplatform.pdf',
    hasModal: true,
  },
  {
    title: '가상자산 공시 리서치',
    image: '/neowiz/virtual_asset_research.png',
    type: '리서치',
    description: '가상자산 관련 공시 사례와 규제 동향을 조사한 리서치입니다.',
    pdf: '/projects/pdfs/cryptoasset_disclosure_research.pdf',
    hasModal: true,
  },
  {
    title: '동종업계(게임) 신작 리서치',
    image: '/neowiz/new_games_research.png',
    type: '리서치',
    description: '동종 게임업계의 신작 출시 동향을 정리한 리서치입니다.',
    pdf: '/projects/pdfs/1Q23_conferencecall_newproduct.pdf',
    hasModal: true,
  },
  {
    title: '국내외 게임업체 주요 공시 및 실적 보고서',
    image: '/neowiz/major_reports.png',
    type: '보고서',
    description: '국내외 주요 게임업체의 공시 및 실적을 정리한 보고서입니다.',
    pdf: '/projects/pdfs/아직안함major_reports.pdf',
    hasModal: true,
  },
  {
    title: '23년 게임업계 주주총회 현황',
    image: '/neowiz/shareholder_meeting_2023.png',
    type: '보고서',
    description: '2023년도 게임업계들의 주주총회 일정 및 안건 정리와 주요 메시지 및 주주들과의 Q&A를 정리한 보고서입니다.',
    pdf: '/projects/pdfs/General_Meeting_of_Shareholders23_research.pdf',
    hasModal: true,
  },
  {
    title: '애널리스트 리포트 요약',
    image: '/neowiz/analyst_report_summary.png',
    type: '보고서',
    description: '애널리스트 리포트 발간 시 투자의견, 실적 전망, 주요내용 들을 요약한 보고서입니다.',
    pdf: '/projects/pdfs/아직안함analyst_report_summary.pdf',
    hasModal: true,
  }
];

const NeowizProjectsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<{url: string, title: string} | null>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: '네오위즈 IR팀 인턴', active: true }
  ];

  const handleCardClick = (card: typeof researchCards[0]) => {
    if (card.hasModal) {
      setSelectedPDF({ url: card.pdf, title: card.title });
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPDF(null);
  };

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Projects</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>네오위즈 IR팀 인턴</span>
          </div>
          <h2 className={styles.cardTitle}>네오위즈 IR팀 인턴 리서치/보고서</h2>
        </div>
        <div className={styles.projectGrid}>
          {researchCards.map((card, idx) => (
            <div key={idx} className={styles.projectCard} onClick={() => handleCardClick(card)}>
              <div className={styles.projectImageWrapper}>
                <Image 
                  src={card.image}
                  alt={card.title}
                  width={400}
                  height={180}
                  className={styles.projectImage}
                />
              </div>
              <div className={styles.projectInfo}>
                <h3 className={styles.projectTitle}>{card.title}</h3>
                <div className={styles.projectBadges}>
                  <span className={styles.badge + ' ' + (card.type === '리서치' ? styles.badgeBlue : styles.badgeYellow)}>{card.type}</span>
                  {card.hasModal && <span className={styles.badge + ' ' + styles.badgeGreen}>PDF 뷰어</span>}
                </div>
                <p className={styles.projectDesc}>{card.description}</p>
              </div>
            </div>
          ))}
        </div>
        {/* PDF 모달 */}
        {modalOpen && selectedPDF && (
          <PDFModal
            isOpen={modalOpen}
            onClose={closeModal}
            pdfUrl={selectedPDF.url}
            title={selectedPDF.title}
          />
        )}
      </div>
    </Layout>
  );
};

export default NeowizProjectsPage; 
