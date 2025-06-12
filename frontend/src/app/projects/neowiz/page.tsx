"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import CardContainer from '@/shared/components/CardContainer/CardContainer';
import Card from '@/shared/components/Card/Card';

const researchCards = [
  {
    title: '게임업계 블록체인 플랫폼 리서치',
    image: '/neowiz/blockchain_research.png',
    type: '리서치',
    description: '게임업계의 블록체인 플랫폼 동향을 정리한 리서치 자료입니다.',
    pdf: '/projects/pdfs/블록체인플랫폼리서치.pdf',
  },
  {
    title: '가상자산 공시 리서치',
    image: '/neowiz/virtual_asset_research.png',
    type: '리서치',
    description: '가상자산 관련 공시 사례와 규제 동향을 조사한 리서치입니다.',
    pdf: '/projects/pdfs/가상자산 공시 리서치.pdf',
  },
  {
    title: '동종업계(게임) 신작 리서치',
    image: '/neowiz/new_games_research.png',
    type: '리서치',
    description: '동종 게임업계의 신작 출시 동향을 정리한 리서치입니다.',
    pdf: '/projects/pdfs/1Q23 컨퍼런스콜 신작.pdf',
  },
  {
    title: '국내외 게임업체 주요 공시 및 실적 보고서',
    image: '/neowiz/major_reports.png',
    type: '보고서',
    description: '국내외 주요 게임업체의 공시 및 실적을 정리한 보고서입니다.',
    pdf: '/projects/pdfs/major_reports.pdf',
  },
  {
    title: '23년 게임업계 주주총회 현황',
    image: '/neowiz/shareholder_meeting_2023.png',
    type: '보고서',
    description: '2023년도 게임업계들의 주주총회 일정 및 안건 정리와 주요 메시지 및 주주들과의 Q&A를 정리한 보고서입니다.',
    pdf: '/projects/pdfs/23년 게임사 주주총회.pdf',
  },
  {
    title: '애널리스트 리포트 요약',
    image: '/neowiz/analyst_report_summary.png',
    type: '보고서',
    description: '애널리스트 리포트 발간 시 투자의견, 실적 전망, 주요내용 들을 요약한 보고서입니다.',
    pdf: '/projects/pdfs/analyst_report_summary.pdf',
  }
];

const NeowizProjectsPage: React.FC = () => {
  const [openedIdx, setOpenedIdx] = useState<null | number>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: '네오위즈 IR팀 인턴', active: true }
  ];

  return (
    <Layout>
      <PageHeader 
        title="네오위즈 IR팀 인턴 리서치/보고서"
        breadcrumbs={breadcrumbs}
      />
      <CardContainer columns={2} gap="large">
        {researchCards.map((card, idx) => (
          <div key={idx}>
            <Card
              title={card.title}
              onClick={() => setOpenedIdx(openedIdx === idx ? null : idx)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <img 
                  src={card.image}
                  alt={card.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    style={{
                      padding: '4px 12px',
                      backgroundColor: card.type === '리서치' ? '#2196f3' : '#ffc107',
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {card.type}
                  </span>
                </div>
                <p style={{ color: 'var(--dark-grey)', lineHeight: '1.6', margin: 0 }}>{card.description}</p>
              </div>
            </Card>
            {openedIdx === idx && (
              <div style={{ marginTop: 16, width: '100%' }}>
                <iframe
                  src={card.pdf}
                  title={card.title + ' PDF'}
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

export default NeowizProjectsPage; 