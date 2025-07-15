// frontend/src/app/dashboard/page.tsx

"use client";

import React, { useState } from 'react';

import DigestWidget from './components/DigestWidget';
import TrendsWidget from './components/TrendsWidget';
import ValidationWidget from './components/ValidationWidget';
import DSDWidget from './components/DSDWidget';
import Modal from '@/shared/components/Modal/Modal';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

// 기존의 복잡한 import를 그대로 둡니다. (디자인 유지를 위해)
import headerStyles from '../dashboard/validation/validation.module.scss';
import styles from './digest/digest.module.scss';
// 이름 충돌을 피하기 위해 다른 이름으로 import (실제 사용은 X)
import dashboardStyles from './dashboard.module.scss'; 

const DashboardPage: React.FC = () => {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className={styles.pageWrapper}>
      <PageHeader
        title="Dashboard"
        description="재무제표 검토부터 시장 비교 분석까지, 실무의 흐름을 간소화합니다."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard', active: false },
          { label: 'Home', href: '/dashboard', active: true }
        ]}
        className={styles.card}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            style={{
              background: '#472a03',
              color: '#fff',
              width: 'auto',
              maxWidth: 180,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: 'none',
              outline: 'none',
              minWidth: 0,
              minHeight: 0
            }}
            onClick={() => setGuideOpen(true)}
          >
            <i className='bx bx-help-circle bx-fade-down-hover'></i>
            <span className="text">Guide</span>
          </button>
        </div>
      </PageHeader>
      <div className={styles.dashboardWidgetGrid} style={{ marginTop: 25 }}>
        <div className={styles.dashboardWidget}><DigestWidget /></div>
        <div className={styles.dashboardWidget}><TrendsWidget /></div>
        <div className={styles.dashboardWidget}><ValidationWidget /></div>
        <div className={styles.dashboardWidget}><DSDWidget /></div>
      </div>
      <Modal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title={
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>📘실무자 활용 가이드</span>
          </span>
        }
        hideFooter={true}
      >
        <div style={{ fontSize: 16, color: '#222', lineHeight: 1.7, whiteSpace: 'normal', textAlign: 'left', padding: 0, minWidth: 320 }}>
          {/* 재무 데이터 검토 자동화 */}
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#222', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, color: '#222', marginRight: 2 }}>■</span>
              재무 데이터 검토 자동화
            </span>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', color: '#444', fontSize: 15 }}>
              <li style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2346a9', fontSize: 17, marginRight: 2 }}>☑</span>재무제표 합계 및 계정명 자동 검증
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2346a9', fontSize: 17, marginRight: 2 }}>☑</span>전기 공시자료와 수치 비교 검증
              </li>
            </ul>
          </div>
          {/* 공시 작성 효율화 */}
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#222', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, color: '#222', marginRight: 2 }}>■</span>
              공시 작성 효율화
            </span>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', color: '#444', fontSize: 15 }}>
              <li style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2346a9', fontSize: 17, marginRight: 2 }}>☑</span>엑셀 파일을 DART 공시용으로 변환
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2346a9', fontSize: 17, marginRight: 2 }}>☑</span>표 자동 변환으로 공시용 편집기 사용 최소화
              </li>
            </ul>
          </div>
          {/* 보고·대응 자료 요약 */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#222', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, color: '#222', marginRight: 2 }}>■</span>
              보고·대응 자료 요약
            </span>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', color: '#444', fontSize: 15 }}>
              <li style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2346a9', fontSize: 17, marginRight: 2 }}>☑</span>동종업계 시장 동향 및 공시 요약
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2346a9', fontSize: 17, marginRight: 2 }}>☑</span>동종업계 재무지표 비교 및 분석
              </li>
            </ul>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setGuideOpen(false)}
              style={{
                background: '#2346a9',
                color: '#fff',
                fontWeight: 700,
                fontSize: 17,
                border: 'none',
                borderRadius: 2,
                padding: '10px 0',
                width: '100%',
                maxWidth: 320,
                cursor: 'pointer',
                margin: '0 auto',
                boxShadow: 'none',
                outline: 'none',
                letterSpacing: 0.5
              }}
            >
              확인
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;