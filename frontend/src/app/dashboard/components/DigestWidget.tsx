"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.scss';
import { FaArrowUp, FaFileAlt, FaBell, FaChartBar } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

function getDigestKPI() {
  return [
    { title: '주간 최고 수익률', value: '+12.4%', subtitle: '네오위즈 (지난 주 대비)', icon: <FaArrowUp color="#2563eb" size={20} />, color: '#f4f8fb', bar: '#2563eb' },
    { title: '총 공시 건수', value: '47건', subtitle: '이번 주 신규 공시', icon: <FaFileAlt color="#6d28d9" size={20} />, color: '#f4f8fb', bar: '#6d28d9' },
    { title: '이슈 알림', value: '8건', subtitle: '긍정적 이슈 증가', icon: <FaBell color="#fbbf24" size={20} />, color: '#fdf7ed', bar: '#fbbf24' },
    { title: '분석 완료', value: '156개', subtitle: '게임 기업 분석 완료', icon: <FaChartBar color="#a78bfa" size={20} />, color: '#f7f5fa', bar: '#a78bfa' },
  ];
}

const KPI_BAR_COLORS = ['#22c55e', '#2563eb', '#f59e42', '#a78bfa'];

const KPICard: React.FC<{ title: string; value: string; unit?: string; barColor: string; className?: string }> = ({ title, value, unit, barColor, className }) => (
  <div className={className} style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 0,
    minHeight: 60,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '12px 18px 14px 18px',
    boxShadow: 'none',
    position: 'relative',
    overflow: 'hidden',
    color: '#222',
  }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: barColor, borderRadius: 0 }} />
    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: '#222', display: 'flex', alignItems: 'baseline', gap: 4 }}>
      {value}
      {unit && <span style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{unit}</span>}
    </div>
  </div>
);

const DigestWidget: React.FC = () => {
  const [kpiData, setKpiData] = useState([
    { title: '총 상장사', value: '24', unit: '분석 대상' },
    { title: '평균 시가총액', value: '1.2조', unit: 'KRW' },
    { title: '금주 신규 공시', value: '12', unit: '건' },
    { title: '금주 주요 이슈', value: '7', unit: '건' },
  ]);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLastUpdate(new Date().toLocaleString('ko-KR'));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setKpiData([
        { title: '총 상장사', value: '24', unit: '분석 대상' },
        { title: '평균 시가총액', value: '1.2조', unit: 'KRW' },
        { title: '금주 신규 공시', value: '12', unit: '건' },
        { title: '금주 주요 이슈', value: '7', unit: '건' },
      ]);
      setIsLoading(false);
      setLastUpdate(new Date().toLocaleString('ko-KR'));
    }, 1000);
  };

    

  return (
    <div className={styles.widgetCard} style={{ padding: 24 }}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>
          시장 동향 요약
        </h3>
        <p className={styles.widgetDescription} style={{ fontSize: '12px', margin: 0 }}>
          게임 업계 주요 지표와 실시간 동향을 한눈에 확인하세요
        </p>
      </div>
      <div className={styles.widgetContent}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 3, marginTop: 14 }}>
          {kpiData.map((kpi, idx) => (
            <KPICard key={idx} {...kpi} barColor={KPI_BAR_COLORS[idx]} className={styles.digestKpiCard} />
          ))}
        </div>
        <div className={styles.dashboardStatusBox}>
          최근 업데이트: {lastUpdate}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <button
          className={styles.widgetLink}
          style={{ width: 'auto', padding: '8px 16px', margin: 0, fontWeight: 600, fontSize: 15, border: 'none', background: '#173e92', color: '#fff', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <i className={isLoading ? 'bx bx-loader bx-spin' : 'bx bx-refresh'}></i>
          새로고침
        </button>
        <button
          className={styles.widgetLink}
          style={{ width: 'auto', padding: '8px 16px', margin: 0, fontWeight: 600, fontSize: 15, border: 'none', background: '#173e92', color: '#fff', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          onClick={() => router.push('/dashboard/digest')}
        >
          전체 동향 보기
          <i className="bx bx-right-arrow-alt"></i>
        </button>
      </div>
    </div>
  );
};

export default DigestWidget; 