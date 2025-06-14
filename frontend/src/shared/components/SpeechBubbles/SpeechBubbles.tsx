// SpeechBubbles.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './SpeechBubbles.module.scss';

interface BubbleData {
  id: string;
  label: string;
  position: string;
  color: string;
  href: string;
}

const SpeechBubbles: React.FC = () => {
  const router = useRouter();

  const bubbles: BubbleData[] = [
    {
      id: 'DSD',
      label: 'DSD',
      position: 'circle',
      color: '#f0e6ff',
      href: '/dashboard/dsd',
    },
    {
      id: 'Validation',
      label: 'Validation',
      position: 'oval',
      color: '#fff8e6',
      href: '/dashboard/validation',
    },
    {
      id: 'Trends',
      label: 'Trends',
      position: 'circleRight',
      color: '#ffe6f0',
      href: '/dashboard/trends',
    },
    {
      id: 'Digest',
      label: 'Digest',
      position: 'ovalRight',
      color: '#e6fff2',
      href: '/dashboard/digest',
    },
  ];

  const handleBubbleClick = (bubble: BubbleData, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(bubble.href);
  };

  return (
    <div className={styles.wrapper}>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`${styles.bubble} ${styles[bubble.position]}`}
          onClick={(e) => handleBubbleClick(bubble, e)}
          style={{ backgroundColor: bubble.color, zIndex: 1001, cursor: 'pointer' }}
        >
          <span className={styles.bubbleText}>{bubble.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SpeechBubbles;
