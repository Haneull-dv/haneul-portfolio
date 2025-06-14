"use client";

import React, { useState } from 'react';
import FloatingChatbot from '@/shared/components/FloatingChatbot';
import SpeechBubbles from '@/speechbubbles';
import styles from './BirthdayCake.module.scss';

const BirthdayCake: React.FC = () => {
  const [isLit, setIsLit] = useState(true);

  const handleFlameClick = () => {
    setIsLit(!isLit);
  };

  const handleCharacterClick = () => {
    // 캐릭터 클릭 시 아무 동작 안함 (케이크와 분리)
  };

  return (
    <div className={styles.container}>
      {/* 말풍선 */}
      <SpeechBubbles />
      
      {/* 캐릭터 (뒤) */}
      <div className={styles.characterWrapper}>
        <FloatingChatbot 
          onClick={handleCharacterClick}
          hideBackground={true}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            maxWidth: '400px',
            maxHeight: '400px',
            zIndex: 1
          }}
        />
      </div>
      
      {/* 케이크 (앞) */}
      <div className={styles.cakeWrapper}>
        <div className={styles.cake}>
          <div className={styles.candle}>
            <div 
              id="flame" 
              className={`${styles.flame} ${isLit ? styles.lit : styles.out}`}
              onClick={handleFlameClick}
            />
          </div>
          <div className={styles.plate}></div>
        </div>
      </div>
    </div>
  );
};

export default BirthdayCake; 