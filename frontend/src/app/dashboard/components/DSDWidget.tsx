"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import styles from '../dashboard.module.scss';

const DEFAULT_EXCEL_FILE_NAME = '[주식회사네오위즈]사업보고서_재무제표(2025.03.19)_ko.xlsx';

const DSDWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [conversionResult, setConversionResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load default file on component mount (네오위즈 엑셀)
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
    setLoading(true);
    setConversionResult('');
    setTimeout(() => {
      setConversionResult('done');
      setLoading(false);
    }, 500);
  };

  return (
    <div className={styles.widgetCard} style={{background: '#f7f8fa', border: '1px solid #e5e7eb', borderRadius: 0, minHeight: 320, padding: 24, boxShadow: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
      <div className={styles.widgetHeader}>
        <h3 className={styles.widgetTitle}>
          DART 데이터 변환
        </h3>
        <p className={styles.widgetDescription} style={{ fontSize: '12px', margin: 0, marginBottom: 13 }}>
          엑셀 파일을 DART 공시 형식으로 변환하여 표준화된 데이터 생성
        </p>
      </div>

      <div className={styles.widgetContent} style={{ marginBottom: 0, paddingBottom: 0 }}>
        <div
          className={styles.uploadArea}
          onClick={handleUploadAreaClick}
          style={{
            background: '#fff',
            border: '1px dashed #d1d5db',
            borderRadius: 0,
            minHeight: 70,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 12,
            padding: 12,
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className={styles.fileInput}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <i className="bx bx-cloud-upload" style={{ fontSize: 22, color: '#60a5fa' }}></i>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>엑셀 파일을 선택하거나 드래그하세요.</span>
            {file && (
              <span style={{ fontSize: 11, color: '#222', marginTop: 4 }}>{file.name}</span>
            )}
          </div>
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
          disabled={loading}
          style={{ borderRadius: 0 }}
        >
          <i className={loading ? "bx bx-loader bx-spin" : "bx bx-transfer"}></i>
          {loading ? '변환 중...' : '업로드 및 변환'}
        </button>
        {conversionResult && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            borderRadius: 0,
            padding: '12px',
            fontSize: '14px',
            marginTop: '12px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            데이터가 성공적으로 변환되었습니다!
          </div>
        )}
        {/* Move gray update/status box to bottom of card for consistency */}
        <div className={styles.dashboardStatusBox}>

        </div>
      </div>
      <div className={styles.widgetFooter} style={{ marginTop: 0, paddingTop: 0 }}>
        <div style={{ fontSize: '12px', color: '#666', marginTop: -40, marginBottom: 0 }}>
          <i className="bx bx-info-circle"></i>
          DART 표준 형식 지원
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 42 }}>
          <Link href="/dashboard/dsd" className={styles.widgetLink} style={{ width: 'auto', padding: '8px 16px', margin: 0, fontWeight: 600, fontSize: 15, border: 'none', background: '#173e92', color: '#fff', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            상세 변환 도구
            <i className="bx bx-right-arrow-alt"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DSDWidget; 