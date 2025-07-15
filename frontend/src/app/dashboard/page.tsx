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
        description="재무팀/IR팀을 위한 자동화 실무 툴킷"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard', active: true }
        ]}
        style={{ marginTop: 32, marginBottom: 24 }}
        className={styles.card}
      />
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