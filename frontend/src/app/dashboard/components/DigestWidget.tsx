"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.scss';

// Mock data for demo purposes
const mockKPIData = [
  {
    title: "주간 최고 수익률",
    value: "+12.4%",
    subtitle: "네오위즈 (지난 주 대비)",
    icon: "bx bx-trending-up",
    color: "#27ae60",
    trend: "up" as const
  },
  {
    title: "총 공시 건수",
    value: "47건",
    subtitle: "이번 주 신규 공시",
    icon: "bx bx-file-blank",
    color: "#3498db",
    trend: "neutral" as const
  },
  {
    title: "이슈 알림",
    value: "8건",
    subtitle: "긍정적 이슈 증가",
    icon: "bx bx-bell",
    color: "#f39c12",
    trend: "up" as const
  },
  {
    title: "분석 완료",
    value: "156개",
    subtitle: "게임 기업 분석 완료",
    icon: "bx bx-chart",
    color: "#9b59b6",
    trend: "neutral" as const
  }
];

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color, trend }) => {
  const getTrendIcon = () => {
    switch(trend) {
      case 'up': return 'bx bx-trending-up';
      case 'down': return 'bx bx-trending-down';
      default: return 'bx bx-minus';
    }
  };

  const getTrendColor = () => {
    switch(trend) {
      case 'up': return '#27ae60';
      case 'down': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const cardStyle = {
    '--card-color': color,
    '--card-bg': color + '20'
  } as React.CSSProperties;

  return (
    <div className={styles.kpiCard} style={cardStyle}>
      <div className={styles.colorBar}></div>
      <div className={styles.cardContent}>
        <div className={styles.textWrapper}>
          <div className={styles.title}>{title}</div>
          <div className={styles.value}>{value}</div>
          <div className={styles.subtitle}>
            <i className={`${getTrendIcon()} ${styles.trendIcon}`} style={{ color: getTrendColor() }}></i>
            {subtitle}
          </div>
        </div>
        <div className={styles.iconWrapper}>
          <i className={`${icon} ${styles.icon}`}></i>
        </div>
      </div>
    </div>
  );
};

const DigestWidget: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    // Set last update time
    const now = new Date();
    setLastUpdate(now.toLocaleString('ko-KR'));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdate(new Date().toLocaleString('ko-KR'));
    }, 1000);
  };

  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>
          <i className="bx bx-pie-chart-alt-2"></i>
          시장 동향 요약
        </h3>
        <p className={styles.widgetDescription}>
          게임 업계 주요 지표와 실시간 동향을 한눈에 확인하세요
        </p>
      </div>

      <div className={styles.widgetContent}>
        <div className={styles.kpiGrid}>
          {mockKPIData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: '8px', 
          padding: '12px', 
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          <i className="bx bx-time"></i>
          최근 업데이트: {lastUpdate}
        </div>
      </div>

      <div className={styles.widgetFooter}>
        <button 
          className={`${styles.actionButton} ${styles.primary}`}
          onClick={handleRefresh}
          disabled={isLoading}
          style={{ width: 'auto', padding: '8px 16px', margin: 0 }}
        >
          <i className={isLoading ? "bx bx-loader bx-spin" : "bx bx-refresh"}></i>
          새로고침
        </button>
        
        <Link href="/dashboard/digest" className={styles.widgetLink}>
          전체 동향 보기
          <i className="bx bx-right-arrow-alt"></i>
        </Link>
      </div>
    </div>
  );
};

export default DigestWidget; 