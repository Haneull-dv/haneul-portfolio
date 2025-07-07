"use client";

import React from 'react';
import Link from 'next/link';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import styles from '../dashboard.module.scss';

// Mock data for demo purposes
const mockAnalysisData = [
  {
    metric: '성장성',
    네오위즈: 85,
    펄어비스: 72,
  },
  {
    metric: '수익성',
    네오위즈: 78,
    펄어비스: 88,
  },
  {
    metric: '안정성',
    네오위즈: 92,
    펄어비스: 85,
  },
  {
    metric: '혁신성',
    네오위즈: 88,
    펄어비스: 90,
  },
  {
    metric: '시장점유율',
    네오위즈: 65,
    펄어비스: 82,
  }
];

const TrendsWidget: React.FC = () => {
  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>
          <i className="bx bx-line-chart"></i>
          기업 분석 차트
        </h3>
        <p className={styles.widgetDescription}>
          주요 게임 기업의 성과 지표를 레이더 차트로 비교 분석
        </p>
      </div>

      <div className={styles.widgetContent}>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={mockAnalysisData}>
              <PolarGrid />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fontSize: 11, fill: '#666' }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#666' }}
              />
              <Radar
                name="네오위즈"
                dataKey="네오위즈"
                stroke="#3498db"
                fill="#3498db"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="펄어비스"
                dataKey="펄어비스"
                stroke="#e74c3c"
                fill="#e74c3c"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: '8px', 
          padding: '12px', 
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          <i className="bx bx-info-circle"></i>
          2024년 연간 보고서 기준 분석 데이터
        </div>
      </div>

      <div className={styles.widgetFooter}>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          fontSize: '12px',
          color: '#666'
        }}>
          <span>
            <i className="bx bx-circle" style={{ color: '#3498db' }}></i>
            네오위즈
          </span>
          <span>
            <i className="bx bx-circle" style={{ color: '#e74c3c' }}></i>
            펄어비스
          </span>
        </div>
        
        <Link href="/dashboard/trends" className={styles.widgetLink}>
          상세 분석 리포트
          <i className="bx bx-right-arrow-alt"></i>
        </Link>
      </div>
    </div>
  );
};

export default TrendsWidget; 