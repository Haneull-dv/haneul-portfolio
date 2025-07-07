"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from '../dashboard.module.scss';

const DEFAULT_EXCEL_FILE_NAME = '[주식회사네오위즈]사업보고서_재무제표(2025.03.19)_ko.xlsx';

const ValidationWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load default file on component mount
  useEffect(() => {
    const loadDefaultFile = async () => {
      try {
        const response = await fetch(`/${DEFAULT_EXCEL_FILE_NAME}`);
        if (!response.ok) throw new Error('기본 파일 로드 실패');
        const blob = await response.blob();
        const defaultFile = new File([blob], DEFAULT_EXCEL_FILE_NAME, { type: blob.type });
        setFile(defaultFile);
      } catch (error) {
        console.error('기본 파일 로드 실패:', error);
      }
    };
    loadDefaultFile();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setValidationResult('');
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleValidation = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setValidationResult('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8086/api/v1/dsdfooting/check-footing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('검증 요청 실패');
      }

      const result = await response.json();
      
      if (result.mismatch_count === 0) {
        setValidationResult('✅ 모든 항목이 정확합니다!');
      } else {
        setValidationResult(`⚠️ ${result.mismatch_count}개의 불일치 항목이 발견되었습니다.`);
      }
    } catch (error) {
      setValidationResult('❌ 검증 중 오류가 발생했습니다.');
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>
          <i className="bx bx-shield-check"></i>
          재무제표 검증
        </h3>
        <p className={styles.widgetDescription}>
          엑셀 파일의 계정과목 푸팅 검증을 통해 데이터 정확성을 확인
        </p>
      </div>

      <div className={styles.widgetContent}>
        <div className={styles.uploadArea} onClick={handleUploadAreaClick}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className={styles.fileInput}
          />
          <div className={styles.uploadLabel}>
            <i className="bx bx-cloud-upload"></i>
            <span>엑셀 파일 업로드</span>
          </div>
          {file && (
            <div className={styles.fileInfo}>
              <i className="bx bx-file"></i>
              <span>{file.name}</span>
            </div>
          )}
        </div>

        <button
          className={`${styles.actionButton} ${styles.primary}`}
          onClick={handleValidation}
          disabled={loading || !file}
        >
          <i className={loading ? "bx bx-loader bx-spin" : "bx bx-check-circle"}></i>
          {loading ? '검증 중...' : '검증 시작하기'}
        </button>

        {validationResult && (
          <div style={{ 
            background: validationResult.includes('✅') ? '#d4edda' : 
                      validationResult.includes('⚠️') ? '#fff3cd' : '#f8d7da',
            color: validationResult.includes('✅') ? '#155724' : 
                   validationResult.includes('⚠️') ? '#856404' : '#721c24',
            borderRadius: '8px', 
            padding: '12px', 
            fontSize: '14px',
            marginTop: '12px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {validationResult}
          </div>
        )}
      </div>

      <div className={styles.widgetFooter}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <i className="bx bx-info-circle"></i>
          네오위즈 표준 양식 지원
        </div>
        
        <Link href="/dashboard/validation" className={styles.widgetLink}>
          상세 검증 결과
          <i className="bx bx-right-arrow-alt"></i>
        </Link>
      </div>
    </div>
  );
};

export default ValidationWidget; 