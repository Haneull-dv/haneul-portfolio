"use client";

import React, { useEffect, useRef } from 'react';
import styles from './FloatingChatbot.module.scss';

interface FloatingChatbotProps {
  onClick: () => void;
  style?: React.CSSProperties;
  hideBackground?: boolean;
  hideTooltip?: boolean;
}

const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ onClick, style = {}, hideBackground = false, hideTooltip = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<SVGSVGElement>(null);
  const eyeLeftRef = useRef<SVGPathElement>(null);
  const eyeRightRef = useRef<SVGPathElement>(null);
  const eyebrowLeftRef = useRef<SVGPathElement>(null);
  const eyebrowRightRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let animationId: number;
    let xPosition = 0;
    let yPosition = 0;
    let storedXPosition = 0;
    let storedYPosition = 0;
    let height = window.innerHeight;
    let width = window.innerWidth;

    const percentage = (partialValue: number, totalValue: number) => {
      return (100 * partialValue) / totalValue;
    };

    const updateScreenCoords = (event: MouseEvent) => {
      xPosition = event.clientX;
      yPosition = event.clientY;
    };

    const updateWindowSize = () => {
      height = window.innerHeight;
      width = window.innerWidth;
    };

    const animateFace = () => {
      if (!xPosition) return;
      if (storedXPosition === xPosition && storedYPosition === yPosition) return;

      // 기준점: 얼굴 중앙(약 105, 90) 기준, 눈동자/눈썹 최대 이동량(px)
      const maxEyeMove = 3;
      const maxBrowMove = 1.5;
      const x = percentage(xPosition, width) - 50;
      const y = percentage(yPosition, height) - 50;
      const moveEyeX = Math.max(-maxEyeMove, Math.min(maxEyeMove, x / 20));
      const moveEyeY = Math.max(-maxEyeMove, Math.min(maxEyeMove, y / 28));
      const moveBrowX = Math.max(-maxBrowMove, Math.min(maxBrowMove, x / 40));
      const moveBrowY = Math.max(-maxBrowMove, Math.min(maxBrowMove, y / 56));

      if (eyeLeftRef.current) {
        eyeLeftRef.current.setAttribute('transform', `translate(${moveEyeX},${moveEyeY})`);
      }
      if (eyeRightRef.current) {
        eyeRightRef.current.setAttribute('transform', `translate(${moveEyeX},${moveEyeY})`);
      }
      if (eyebrowLeftRef.current) {
        eyebrowLeftRef.current.setAttribute('transform', `translate(${moveBrowX},${moveBrowY})`);
      }
      if (eyebrowRightRef.current) {
        eyebrowRightRef.current.setAttribute('transform', `translate(${moveBrowX},${moveBrowY})`);
      }

      storedXPosition = xPosition;
      storedYPosition = yPosition;
    };

    const animate = () => {
      animateFace();
      animationId = requestAnimationFrame(animate);
    };

    const safeToAnimate = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    
    if (safeToAnimate) {
      window.addEventListener('mousemove', updateScreenCoords);
      animate();
    }

    return () => {
      window.removeEventListener('mousemove', updateScreenCoords);
      window.removeEventListener('resize', updateWindowSize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={styles.floatingContainer}
      style={style}
      onClick={onClick}
    >
      <svg 
        ref={characterRef}
        viewBox="0 10 211.73 180" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={styles.characterSvg}
      >
        <defs>
          <clipPath id="floating-background-clip">
            <path d="M39 153.73s31.57 19.71 77.26 15.21 90.18-37.23 90.36-72.33-8.82-80.28-33.59-86.29C136.84-6.57 114.13-5.82 88-2.82S34.73 11.45 16.71 48.24C-1.5 66.64-4.88 125.2 39 153.73z" fill="none" />
          </clipPath>

          <linearGradient id="floating-linear-gradient" x1="102.94" y1="154.47" x2="102.94" y2="36.93" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff5cc" />
            <stop offset="0.01" stopColor="#faf0c8" />
            <stop offset="0.19" stopColor="#c2b599" />
            <stop offset="0.35" stopColor="#998977" />
            <stop offset="0.47" stopColor="#806f62" />
            <stop offset="0.54" stopColor="#77655a" />
            <stop offset="0.6" stopColor="#77655a" />
            <stop offset="1" stopColor="#77655a" />
          </linearGradient>
        </defs>
        
        {/* 민트색 배경 */}
        {!hideBackground && (
          <path 
            className={styles.bg} 
            d="M39 153.73s31.57 19.71 77.26 15.21 90.18-37.23 90.36-72.33-10.51-57-35.28-63-50.22 17-76.31 20-60.12-15.88-78.32 2.51S-4.88 125.2 39 153.73z" 
            fill="rgb(174, 206, 236)" 
          />
        )}
        
        <g clipPath="url(#floating-background-clip)">
          <g className={styles.me}>
            <g className={styles.body}>
              <path 
                className={styles.shadow} 
                d="M129.86,48.47s6.76,4.91,10,12.07,7,29.06,11.71,39.82,9.06,22.5,9.91,26.42,1.57,5-2.52,10.2-14.63,12-14.63,12l-11.47,6.8s14.87,9.67,17.68,19.32a71.16,71.16,0,0,1,4.34,18.79l-21.39,4.54L113.2,164.85l-13-11.1L90.31,75.37Z" 
                opacity="0.09" 
                style={{isolation: 'isolate'}} 
              />
              <path 
                className={styles.shadow} 
                d="M69.44,54A23.64,23.64,0,0,0,58.91,64.27c-4.39,7.87-4.1,30.52-7.61,41.23S40.76,124.26,41.93,135s2.64,12.27,2.64,12.27a66.65,66.65,0,0,1,14.93,1.88c7,1.89,18.42,5.48,18.42,5.48S63.6,166.53,61.84,176a67.23,67.23,0,0,0-2.34,18.26l20.89,1.9,16.19-34,11.42-12L109.91,75Z" 
                opacity="0.09" 
                style={{isolation: 'isolate'}} 
              />
              <path 
                className={`${styles.hairBack} ${styles.hair}`} 
                d="M127.63,45.17c2.65,1.35,11.15,4.2,16.07,23.12,2.88,20.58,3.79,26.07,4.68,30.6s1.2,11.6,6.3,21.15.85,14.65.85,14.65l-7.63,7.08s3.45-12.65-2.63-18.13c0,0,2,14,0,17s-8.75,6.92-8.75,6.92-2.48-4.53-5.06-9.64,2.78,11,.08,12.09-18.82,6.25-30.6,3.86-21.53-5-24-5.79c0,0,2.75-1.37.77-7.62s-1-7.59-1.52-7-2.1,3-1,7.49a7.45,7.45,0,0,1-1.92,7.18s-7.11-4.65-12.77-5.21A51.35,51.35,0,0,1,51,141.14s-5-11.43-.4-23.56S58,104.1,58.32,88.87s2.41-34.66,20.41-45S116.87,35.4,127.63,45.17Z" 
                fill="url(#floating-linear-gradient)" 
              />
              <path className={styles.neck} d="M114.26 143.16v-14a9.22 9.22 0 10-18.43 0v14c-15.27 2.84-24.74 15.08-24.74 27.33H139c0-12.24-9.5-24.49-24.74-27.33z" fill="#ede3d1" />
              <path className={styles.top} d="M105.61 167c-30.17 0-25.36-40-25.36 15.84h25.35l25-2.14c-.05-55.79 5.17-13.7-24.99-13.7z" fill="#fff" stroke="#404040" strokeWidth=".5" />
              <path className={styles.shoulder} d="M95.82 142.87c-16 1.84-29.37 19.5-29.37 40h29.37z" fill="#f8f8f0" />
              <path className={styles.shoulder} d="M114.23 142.67c15.76 1.85 29 19.6 29 40.2h-29z" fill="#f8f8f0" />
            </g>
            <path 
              className={styles.shadow} 
              d="M95.82 122.36h18.41v14.31s-10.5 5.54-18.41 0z" 
              fill="#efceb9" 
            />
            <g className={styles.head}>
              <g className={`${styles.earLeft} ${styles.ear}`}>
                <path d="M63.52 105.14A8.21 8.21 0 0072 113.2a8.36 8.36 0 008.51-8.1A8.21 8.21 0 0072 97a8.36 8.36 0 00-8.48 8.14z" fill="#ede3d1" />
                <path d="M68.54 104.48a17 17 0 014.14.41c1.07.31 1.94 1 3 1.31a.39.39 0 00.43-.57c-1.15-2.38-5.49-1.86-7.58-1.67a.26.26 0 000 .52z" fill="#b5aa9a" />
              </g>
              <g className={`${styles.earRight} ${styles.ear}`}>
                <path d="M144.37 105.24a8.2 8.2 0 01-8.37 8.06 8.35 8.35 0 01-8.51-8.1 8.21 8.21 0 018.42-8.06 8.35 8.35 0 018.46 8.1z" fill="#ede3d1" />
                <path d="M139.6 104c-2.1-.19-6.43-.72-7.59 1.67a.39.39 0 00.44.57c1.07-.26 1.92-1 3-1.31a17.51 17.51 0 014.15-.41.26.26 0 000-.52z" fill="#b5aa9a" />
              </g>
              <g className={styles.face}>
                <rect x="73.99" y="48.26" width="61.54" height="80.49" rx="26.08" transform="rotate(180 104.76 88.5)" fill="#ede3d1" />
                <g className={styles.innerFace}>
                  <path className={styles.eyebrowRight} d="M120.73 79a9 9 0 00-4-1.22 9.8 9.8 0 00-4.19.87" fill="none" stroke="#b5aa9a" strokeWidth="1.04" ref={eyebrowRightRef} />
                  <path className={styles.eyebrowLeft} d="M97.12 79.41a9.53 9.53 0 00-4-1.11 10.58 10.58 0 00-4.2.76" fill="none" stroke="#b5aa9a" strokeWidth="1.04" ref={eyebrowLeftRef} />
                  <path className={styles.mouth} d="M97 107.52s7.06 4.62 14 1.59" fill="none" stroke="#b5aa9a" strokeWidth="1.04" />
                  <g className={styles.eyes}>
                    <path 
                      className={`${styles.eyeLeft} ${styles.eye}`}
                      d="M89.48 87.37c-.07 2.08 1.25 3.8 2.94 3.85s3.1-1.59 3.16-3.67-1.25-3.8-2.94-3.85-3.1 1.59-3.16 3.67z"
                      fill="#2b343b"
                      ref={eyeLeftRef}
                    />
                    <path 
                      className={`${styles.eyeRight} ${styles.eye}`}
                      d="M113.67 87.37c-.07 2.08 1.25 3.8 2.94 3.85s3.1-1.59 3.16-3.67-1.25-3.8-2.94-3.85-3.1 1.59-3.16 3.67z"
                      fill="#2b343b"
                      ref={eyeRightRef}
                    />
                  </g>
                  <path className={styles.nose} d="M102.39 98.13s3.09 1.55 5.78 0" fill="none" stroke="#e0d5c1" />
                  <path className={`${styles.blushLeft} ${styles.eye}`} d="M89.9 98.17a2.66 2.66 0 01-1.55-.93 3.73 3.73 0 01-.76-3.12 3 3 0 011-1.56 2 2 0 011.4-.42 3 3 0 012.5 2.72.76.76 0 010 .21 3.19 3.19 0 01.11.91 2.1 2.1 0 01-1.77 2.21 2.07 2.07 0 01-.93-.02zM89.34 96v-.05s-.04.05 0 .05z" fill="#efceb9" fillRule="evenodd" />
                  <path className={`${styles.blushRight} ${styles.eye}`} d="M118.93 98.19a2.09 2.09 0 01-1.77-2.19 3.58 3.58 0 01.1-.91v-.21a3 3 0 012.51-2.72 2 2 0 011.4.42 3 3 0 011 1.56 3.73 3.73 0 01-.76 3.12 2.66 2.66 0 01-1.55.93 2.08 2.08 0 01-.93 0zm1.53-2.2v.05c0 .05.05-.04 0-.04z" fill="#efceb9" fillRule="evenodd" />
                </g>
                <path 
                  className={styles.hairFront} 
                  d="M134.1,57.61C129.22,51.79,118,45,115.33,44.84s-13-1.87-20.65,0-16,4.51-18.77,8.26-6.17,18-4.77,24.41c0,0,3-3.09,10.46-5.73h0s.74-6.33,1.45-7.18a32.29,32.29,0,0,0-.1,6.73,59.67,59.67,0,0,1,8.22-2,37,37,0,0,1,.25-8.11,67.11,67.11,0,0,0,.54,8c2-.32,4.18-.59,6.52-.78h0s.18-2.82.61-5.5c0,0,.28,3.33.6,5.42,1.78-.12,3.64-.19,5.62-.21a76.76,76.76,0,0,1,9.11.45c-.05-2.15,0-6.82-.22-7.36s1.07,2.06,1.54,7.52a51.14,51.14,0,0,1,8.84,1.92c.23-2.37.41-5.93-.3-7.88,0,0,2.1,5,1.9,8.42h0c8.36,3,11.06,7.25,11.06,7.25S139,63.43,134.1,57.61Z" 
                  fill="#77655a" 
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
      
      {!hideTooltip && (
        <div className={styles.tooltip}>
          <span>💬 채팅하기</span>
        </div>
      )}
    </div>
  );
};

export default FloatingChatbot;
