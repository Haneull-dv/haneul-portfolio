"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './PDFModal.module.scss';

// PDF.js worker 설정
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

const PDFModal: React.FC<PDFModalProps> = ({ isOpen, onClose, pdfUrl, title }) => {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [loading, setLoading] = useState(true);
  const [isScaling, setIsScaling] = useState(false);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setNumPages(0);
      setLoading(true);
    }
  }, [isOpen, pdfUrl]);

  // 반응형 크기 설정
  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      if (w < 640) {
        // 모바일
        setContainerWidth(w - 16);
        setScale(0.5);
      } else if (w < 1024) {
        // 태블릿
        setContainerWidth(w - 32);
        setScale(0.7);
      } else {
        // 데스크탑
        setContainerWidth(Math.min(w - 64, 900));
        setScale(0.9);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF 로딩 에러:', error);
    setLoading(false);
  };

  // 디바운스된 스케일 변경 함수
  const handleScaleChange = (newScale: number) => {
    setIsScaling(true);
    setScale(newScale);
    
    // 스케일링 완료 후 상태 리셋
    setTimeout(() => {
      setIsScaling(false);
    }, 300);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} title="닫기">✕</button>
        </div>
        {/* 툴바 */}
        <div className={styles.toolbar}>
          <span className={styles.pageInfo}>{numPages > 0 ? `총 ${numPages}페이지` : '로딩 중...'}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleScaleChange(Math.max(0.5, scale - 0.1))} disabled={scale <= 0.5} style={{ fontSize: 18, padding: '2px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fafbfc', cursor: 'pointer' }}>-</button>
            <span style={{ minWidth: 36, textAlign: 'center', color: '#374151', fontWeight: 500 }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => handleScaleChange(Math.min(2, scale + 0.1))} disabled={scale >= 2} style={{ fontSize: 18, padding: '2px 8px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fafbfc', cursor: 'pointer' }}>+</button>
          </div>
        </div>
        {/* PDF 컨텐츠 */}
        <div className={styles.content}>
          <div className={styles.pdfDocument} style={{ width: containerWidth }}>
            {loading ? (
              <div className={styles.loading}>PDF 문서를 불러오는 중...</div>
            ) : (
              Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} className={styles.pdfPage}>
                  <Page pageNumber={index + 1} scale={scale} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFModal;
