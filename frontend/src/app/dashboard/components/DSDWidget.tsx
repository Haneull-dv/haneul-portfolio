"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import styles from '../dashboard.module.scss';

const DSDWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [conversionResult, setConversionResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const f = event.target.files[0];
      setFile(f);
      setConversionResult('');
      
      // Read Excel file to get sheet names
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        setSheetNames(workbook.SheetNames);
        setSelectedSheet(workbook.SheetNames[0] || '');
      };
      reader.readAsBinaryString(f);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleConversion = async () => {
    if (!file || !selectedSheet) {
      alert('파일과 시트를 선택해주세요.');
      return;
    }

    setLoading(true);
    setConversionResult('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheet_name', selectedSheet);
      
      const response = await fetch('http://localhost:8085/dsdgen/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('변환 요청 실패');
      }

      const result = await response.json();
      
      if (result.success) {
        setConversionResult('✅ DART 데이터 변환이 완료되었습니다!');
      } else {
        setConversionResult('⚠️ 변환 중 일부 오류가 발생했습니다.');
      }
    } catch (error) {
      setConversionResult('❌ 변환 중 오류가 발생했습니다.');
      console.error('Conversion error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.widgetCard}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>
          <i className="bx bx-transfer"></i>
          DART 데이터 변환
        </h3>
        <p className={styles.widgetDescription}>
          엑셀 파일을 DART 공시 형식으로 변환하여 표준화된 데이터 생성
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

        {sheetNames.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {sheetNames.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className={`${styles.actionButton} ${styles.orange}`}
          onClick={handleConversion}
          disabled={loading || !file || !selectedSheet}
        >
          <i className={loading ? "bx bx-loader bx-spin" : "bx bx-transfer"}></i>
          {loading ? '변환 중...' : '업로드 및 변환'}
        </button>

        {conversionResult && (
          <div style={{ 
            background: conversionResult.includes('✅') ? '#d4edda' : 
                      conversionResult.includes('⚠️') ? '#fff3cd' : '#f8d7da',
            color: conversionResult.includes('✅') ? '#155724' : 
                   conversionResult.includes('⚠️') ? '#856404' : '#721c24',
            borderRadius: '8px', 
            padding: '12px', 
            fontSize: '14px',
            marginTop: '12px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {conversionResult}
          </div>
        )}
      </div>

      <div className={styles.widgetFooter}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <i className="bx bx-info-circle"></i>
          DART 표준 형식 지원
        </div>
        
        <Link href="/dashboard/dsd" className={styles.widgetLink}>
          상세 변환 도구
          <i className="bx bx-right-arrow-alt"></i>
        </Link>
      </div>
    </div>
  );
};

export default DSDWidget; 