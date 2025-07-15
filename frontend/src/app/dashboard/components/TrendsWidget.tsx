"use client";

import React from 'react';
import Link from 'next/link';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import styles from '../dashboard.module.scss';

// Mock data for demo purposes
const mockAnalysisData = [
  {
    metric: '성장성',
    넥슨게임즈: 85,
    엔씨소프트: 66,
  },
  {
    metric: '수익성',
    넥슨게임즈: 83,
    엔씨소프트: 89,
    
  },
  {
    metric: '안정성',
    넥슨게임즈: 86,
    엔씨소프트: 84,
    
  },
  {
    metric: '혁신성',
    넥슨게임즈: 80,
    엔씨소프트: 85,
    
  },
  {
    metric: '시장점유율',
    넥슨게임즈: 87,
    엔씨소프트: 77,
    
  }
];

const TrendsWidget: React.FC = () => {
  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>
          기업 분석 차트
        </h3>
        <p className={styles.widgetDescription} style={{ fontSize: '12px', margin: 0 }}>
          게임 기업의 성과 지표를 레이더 차트로 비교 분석
        </p>
      </div>

      <div className={styles.widgetContent}>
        <div className={styles.chartContainer} style={{ marginTop: -15 }}>
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
                name="넥슨게임즈"
                dataKey="넥슨게임즈"
                stroke="#960505" // 톤다운 레드
                fill="#960505"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name="엔씨소프트"
                dataKey="엔씨소프트"
                stroke="#094cb1" // 톤다운 블루
                fill="#094cb1"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', marginTop: '-50px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 0}}>
          <Link href="/dashboard/trends" className={styles.widgetLink} style={{ width: 'auto', padding: '8px 16px', margin: 0, fontWeight: 600, fontSize: 15, border: 'none', background: '#173e92', color: '#fff', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            상세 분석 리포트
            <i className="bx bx-right-arrow-alt"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrendsWidget; 