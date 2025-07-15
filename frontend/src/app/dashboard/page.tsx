// frontend/src/app/dashboard/page.tsx

"use client";

import React, { useState } from 'react';

import DigestWidget from './components/DigestWidget';
import TrendsWidget from './components/TrendsWidget';
import ValidationWidget from './components/ValidationWidget';
import DSDWidget from './components/DSDWidget';
import Modal from '@/shared/components/Modal/Modal';

// 기존의 복잡한 import를 그대로 둡니다. (디자인 유지를 위해)
import headerStyles from '../dashboard/validation/validation.module.scss';
import styles from './digest/digest.module.scss';
// 이름 충돌을 피하기 위해 다른 이름으로 import (실제 사용은 X)
import dashboardStyles from './dashboard.module.scss'; 

const DashboardPage: React.FC = () => {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    // ❌ <Layout> 제거
    // ✅ 모든 것을 감싸는 최상위 "방어막" div 추가
    <div>
      {/* 기존의 모든 콘텐츠는 그대로 유지합니다. */}
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
        {/* 모달에 들어갈 내용을 여기에 작성 */}
        <div>
          가이드 내용을 여기에 작성하세요.
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;