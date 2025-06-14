"use client";

import React from 'react';
import styles from './SpeechBubbles.module.scss';

const SpeechBubbles: React.FC = () => {
  const bubbles = [
    { id: 'projects', label: 'Projects', position: 'circle', color: '#f0e6ff' },
    { id: 'skills', label: 'Skills', position: 'oval', color: '#fff8e6' },
    { id: 'about', label: 'About', position: 'circleRight', color: '#ffe6f0' },
    { id: 'contact', label: 'Contact', position: 'ovalRight', color: '#e6fff2' }
  ];

  const handleBubbleClick = (bubble: { id: string; label: string; position: string; color: string }) => {
    console.log(`Clicked on ${bubble.label}`);
    // 아직 라우팅 기능 없음
  };

  return (
    <div className={styles.wrapper}>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`${styles.bubble} ${styles[bubble.position]}`}
          onClick={() => handleBubbleClick(bubble)}
          style={{ backgroundColor: bubble.color }}
          title={bubble.label}
        >
          <span className={styles.bubbleText}>{bubble.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SpeechBubbles; 