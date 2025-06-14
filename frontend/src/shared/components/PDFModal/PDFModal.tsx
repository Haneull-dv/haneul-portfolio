"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

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
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: window.innerWidth < 640 ? '8px' : '16px'
      }}
      onClick={handleOverlayClick}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: window.innerWidth < 640 ? '12px' : '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e5e7eb',
          maxWidth: '80rem',
          width: '100%',
          maxHeight: window.innerWidth < 640 ? '95vh' : '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 - 제목과 닫기 버튼 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: window.innerWidth < 640 ? '12px' : '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white',
          borderTopLeftRadius: window.innerWidth < 640 ? '12px' : '16px',
          borderTopRightRadius: window.innerWidth < 640 ? '12px' : '16px'
        }}>
          <h2 style={{
            fontSize: window.innerWidth < 640 ? '16px' : '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0,
            paddingRight: '16px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: window.innerWidth < 640 ? '28px' : '32px',
              height: window.innerWidth < 640 ? '28px' : '32px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: window.innerWidth < 640 ? '18px' : '20px'
            }}
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* PDF 툴바 - 상단 고정 */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: window.innerWidth < 640 ? '8px 12px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: window.innerWidth < 640 ? 'wrap' : 'nowrap',
          gap: window.innerWidth < 640 ? '8px' : '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: window.innerWidth < 640 ? '8px' : '16px',
            order: window.innerWidth < 640 ? 2 : 1,
            width: window.innerWidth < 640 ? '100%' : 'auto',
            justifyContent: window.innerWidth < 640 ? 'center' : 'flex-start'
          }}>
            <span style={{
              fontSize: window.innerWidth < 640 ? '12px' : '14px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {numPages > 0 ? `총 ${numPages}페이지` : '로딩 중...'}
            </span>
          </div>

          {/* 줌 컨트롤 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: window.innerWidth < 640 ? '6px' : '8px',
            order: window.innerWidth < 640 ? 1 : 2
          }}>
            <button
              onClick={() => handleScaleChange(Math.max(0.4, scale - 0.1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: window.innerWidth < 640 ? '32px' : '36px',
                height: window.innerWidth < 640 ? '32px' : '36px',
                backgroundColor: scale <= 0.4 ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: scale <= 0.4 ? 'not-allowed' : 'pointer',
                fontSize: window.innerWidth < 640 ? '16px' : '18px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                opacity: isScaling ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (scale > 0.4 && window.innerWidth >= 640) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (scale > 0.4 && window.innerWidth >= 640) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                }
              }}
              title="축소"
              disabled={scale <= 0.4 || isScaling}
            >
              −
            </button>
            
            <span style={{
              fontSize: window.innerWidth < 640 ? '12px' : '14px',
              color: '#374151',
              fontWeight: '500',
              minWidth: window.innerWidth < 640 ? '40px' : '50px',
              textAlign: 'center'
            }}>
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => handleScaleChange(Math.min(2.0, scale + 0.1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: window.innerWidth < 640 ? '32px' : '36px',
                height: window.innerWidth < 640 ? '32px' : '36px',
                backgroundColor: scale >= 2.0 ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: scale >= 2.0 ? 'not-allowed' : 'pointer',
                fontSize: window.innerWidth < 640 ? '16px' : '18px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                opacity: isScaling ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (scale < 2.0 && window.innerWidth >= 640) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (scale < 2.0 && window.innerWidth >= 640) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                }
              }}
              title="확대"
              disabled={scale >= 2.0 || isScaling}
            >
              +
            </button>
          </div>
        </div>

        {/* PDF 컨테이너 - 스크롤 영역 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f9fafb',
          padding: window.innerWidth < 640 ? '12px' : '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: window.innerWidth < 640 ? '16px' : '24px'
        }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: window.innerWidth < 640 ? '24px' : '48px',
              color: '#6b7280'
            }}>
              <div style={{
                width: window.innerWidth < 640 ? '24px' : '32px',
                height: window.innerWidth < 640 ? '24px' : '32px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <span style={{ 
                marginLeft: '12px', 
                fontSize: window.innerWidth < 640 ? '14px' : '16px', 
                fontWeight: '500' 
              }}>
                PDF 로딩 중...
              </span>
            </div>
          )}
          
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            key={pdfUrl}
            error={
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: window.innerWidth < 640 ? '24px' : '48px',
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                borderRadius: '12px',
                border: '1px solid #fecaca',
                textAlign: 'center',
                margin: window.innerWidth < 640 ? '0 8px' : '0'
              }}>
                <div>
                  <div style={{ fontSize: window.innerWidth < 640 ? '36px' : '48px', marginBottom: '16px' }}>⚠️</div>
                  <p style={{ 
                    fontSize: window.innerWidth < 640 ? '16px' : '18px', 
                    fontWeight: '600', 
                    margin: '0 0 8px 0' 
                  }}>
                    PDF를 불러올 수 없습니다
                  </p>
                  <p style={{ 
                    fontSize: window.innerWidth < 640 ? '12px' : '14px', 
                    color: '#991b1b', 
                    margin: 0 
                  }}>
                    파일 경로를 확인해주세요
                  </p>
                </div>
              </div>
            }
          >
            {/* 모든 페이지를 세로로 나열 */}
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} style={{ 
                marginBottom: window.innerWidth < 640 ? '16px' : '24px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  maxWidth: '100%'
                }}>
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={!isScaling}
                    renderAnnotationLayer={!isScaling}
                    key={`${index + 1}-${scale}`}
                    width={window.innerWidth < 640 ? Math.min(containerWidth - 24, 400) : undefined}
                  />
                </div>
                <div style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: window.innerWidth < 640 ? '12px' : '14px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  페이지 {index + 1}
                </div>
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFModal;
