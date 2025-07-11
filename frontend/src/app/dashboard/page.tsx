"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import DigestWidget from './components/DigestWidget';
import TrendsWidget from './components/TrendsWidget';
import ValidationWidget from './components/ValidationWidget';
import DSDWidget from './components/DSDWidget';
import headerStyles from '../dashboard/validation/validation.module.scss';
import styles from './digest/digest.module.scss';
import Modal from '@/shared/components/Modal/Modal';

const DashboardPage: React.FC = () => {
  const [guideOpen, setGuideOpen] = useState(false);
  return (
    <Layout>
      <div className={headerStyles.pageWrapper}>
        <div className={headerStyles.card} style={{ display: 'flex', flexDirection: 'column', minHeight: 140, justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={headerStyles.breadcrumbs}>
              <span className={headerStyles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
              <span className={headerStyles.breadcrumbSeparator}>/</span>
              <span className={headerStyles.breadcrumbCurrent}>Home</span>
            </div>
            <h2 className={headerStyles.cardTitle}>Dashboard</h2>
            <p>재무팀·IR팀을 위한 자동화 실무 툴킷</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              style={{background: '#472a03', color: '#fff', width: 'auto', padding: '8px 16px', marginTop: 16, fontWeight: 600, fontSize: 15, border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: 'none', outline: 'none', minWidth: 0, minHeight: 0}}
              onClick={() => setGuideOpen(true)}
            >
              <i className='bx bx-help-circle bx-fade-down-hover'></i>
              <span className="text">Guide</span>
            </button>
          </div>
        </div>
        <div className={styles.dashboardWidgetGrid}>
          <div className={styles.dashboardWidget}><DigestWidget /></div>
          <div className={styles.dashboardWidget}><TrendsWidget /></div>
          <div className={styles.dashboardWidget}><ValidationWidget /></div>
          <div className={styles.dashboardWidget}><DSDWidget /></div>
        </div>
        <Modal
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          title="실무자별 활용 가이드"
        >
          <div style={{ fontSize: 16, color: '#222', lineHeight: 1.7, whiteSpace: 'normal', textAlign: 'left', padding: 0 }}>
            <div style={{ borderLeft: '3px solid #e5e7eb', paddingLeft: 14, marginBottom: 18 }}>
              <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: 0.2, color: '#222', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{marginRight: 4}} xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="14" height="14" rx="3" stroke="#173e92" strokeWidth="1.5" fill="#f8fafc"/></svg>
                IR팀 실무자 흐름
              </span>
              <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none', color: '#444', fontSize: 15 }}>
                <li style={{ marginBottom: 4 }}>- KPI 비교로 경쟁사 재무지표 분석</li>
                <li style={{ marginBottom: 4 }}>- 주요 공시 이슈 확인</li>
                <li>- IR 전략 수립 및 투자자 대응을 위한 분석 요약 확보</li>
              </ul>
            </div>
            <div style={{ borderLeft: '3px solid #e5e7eb', paddingLeft: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: 0.2, color: '#222', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{marginRight: 4}} xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="14" height="14" rx="3" stroke="#173e92" strokeWidth="1.5" fill="#f8fafc"/><rect x="7" y="7" width="6" height="6" rx="1" stroke="#173e92" strokeWidth="1.2" fill="#fff"/></svg>
                재무팀 실무자 흐름
              </span>
              <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none', color: '#444', fontSize: 15 }}>
                <li style={{ marginBottom: 4 }}>- 재무제표 엑셀 업로드 및 정합성 검증</li>
                <li style={{ marginBottom: 4 }}>- 포맷 자동 변환으로 공시 양식화</li>
                <li>- DART 전자공시 제출용 재무제표 생성 완료</li>
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default DashboardPage;
  