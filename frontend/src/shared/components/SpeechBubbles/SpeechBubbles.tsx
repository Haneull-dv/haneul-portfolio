// SpeechBubbles.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './SpeechBubbles.module.scss';

interface BubbleData {
  id: string;
  label: string;
  position: string;
  color: string;
  description: string;
}

const SpeechBubbles: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const bubbles: BubbleData[] = [
    {
      id: 'DSD',
      label: 'DSD',
      position: 'circle',
      color: '#f0e6ff',
      description:
        '기존 엑셀 기반 재무제표를 버튼 클릭 한 번으로 전자공시용 DSD 양식으로 자동 변환합니다. 별도의 편집 없이 즉시 활용 가능합니다.',
    },
    {
      id: 'Validation',
      label: 'Validation',
      position: 'oval',
      color: '#fff8e6',
      description:
        '재무제표의 자산·부채·자본 합계 일치 여부를 자동 검증하며, 전기 보고서를 불러와 비교 대조 기능을 통해 금액 변동을 손쉽게 확인할 수 있습니다.',
    },
    {
      id: 'Trends',
      label: 'Trends',
      position: 'circleRight',
      color: '#ffe6f0',
      description:
        '산업별 시가총액 상위 기업의 주가 변동, 주요 공시, 실적 발표 동향을 정리해 드립니다. PDF 리포트 형식으로 다운로드도 가능합니다.',
    },
    {
      id: 'Digest',
      label: 'Digest',
      position: 'ovalRight',
      color: '#e6fff2',
      description:
        '애널리스트 리포트의 핵심 내용을 요약 제공하여, 투자 포인트와 산업 이슈를 빠르고 효율적으로 파악할 수 있습니다.',
    },
  ];

  const handleBubbleClick = (bubble: BubbleData, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveTooltip((prev) => (prev === bubble.id ? null : bubble.id));
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setActiveTooltip(null);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`${styles.bubble} ${styles[bubble.position]} ${
            activeTooltip === bubble.id ? styles.active : ''
          }`}
          onClick={(e) => handleBubbleClick(bubble, e)}
          style={{ backgroundColor: bubble.color, zIndex: 1001 }}
        >
          <span className={styles.bubbleText}>{bubble.label}</span>
        </div>
      ))}

      {activeTooltip && (
        <div className={styles.tooltip} style={{ zIndex: 2000 }}>
          <div className={styles.tooltipContent}>
            <h4 className={styles.tooltipTitle}>
              {bubbles.find((b) => b.id === activeTooltip)?.label}
            </h4>
            <p className={styles.tooltipDescription}>
              {bubbles.find((b) => b.id === activeTooltip)?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechBubbles;
