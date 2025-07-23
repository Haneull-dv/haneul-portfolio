"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import styles from '../validation/validation.module.scss';
import PrimaryButton from '@/shared/components/PrimaryButton';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

const DEFAULT_EXCEL_FILE_NAME = '[주식회사네오위즈]사업보고서_재무제표(2025.03.19)_ko.xlsx';

const DSDPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'원' | '백만원'>('원');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleUploadAreaClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      setFile(f);
      setResult(null);
      setError(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        setSheetNames(workbook.SheetNames);
        setSheetName(workbook.SheetNames[0] || '');
      };
      reader.readAsBinaryString(f);
    }
  };

  const handleUpload = () => {
    if (!file || !sheetName) {
      setError('엑셀 파일과 시트를 선택해주세요.');
      return;
    }
    handleUploadWithParams(file, sheetName);
  };
  

  // 단위 변환 함수
  const convertUnit = (value: string | number) => {
    let num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return value;
    if (unit === '백만원') num = Math.round(num / 1_000_000);
    return num.toLocaleString();
  };

  // 단위 선택 및 복사 버튼 UI (완전 좌우 끝 정렬, 복사 메시지 버튼 위치)
  const renderTableHeader = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
      maxWidth: 700,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setUnit('원')} disabled={unit === '원'} className={styles.actionButton} style={{ minWidth: 80, marginRight: 8 }}>
            ₩ 원
          </button>
          <button type="button" onClick={() => setUnit('백만원')} disabled={unit === '백만원'} className={styles.actionButton} style={{ minWidth: 100 }}>
            ₩ 백만원
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          onClick={handleCopyTable}
          className={styles.actionButton}
          style={{
            minWidth: 100,
            background: copyMsg ? '#e3f2fd' : undefined,
            color: copyMsg ? '#1976d2' : undefined,
            border: copyMsg ? '1.5px solid #1976d2' : undefined,
            transition: 'all 0.2s',
            fontWeight: 600
          }}
          disabled={!!copyMsg}
        >
          {copyMsg ? '표가 복사되었습니다.' : '복사하기'}
        </button>
      </div>
    </div>
  );

  // 표 복사 함수 (Clipboard API 사용, execCommand 제거)
  const handleCopyTable = async () => {
    if (!result || !result.sheets || !sheetName) return;
    const table = document.getElementById('dart-table');
    if (table) {
      const html = table.outerHTML;
      try {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([table.innerText], { type: 'text/plain' }),
          }),
        ]);
        setCopyMsg('표가 복사되었습니다!');
        setTimeout(() => setCopyMsg(null), 1000);
      } catch {
        setCopyMsg('복사에 실패했습니다.');
        setTimeout(() => setCopyMsg(null), 1000);
      }
    }
  };

  // 계정명 indent 계산 (예: 계정명에 포함된 . 또는 Ⅰ, Ⅱ 등으로 들여쓰기)
  const getIndent = (name: string) => {
    // 숫자/로마자/점/공백 등으로 구분
    const match = name.match(/^(\s*[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ0-9]+[\.|\s]*)+/);
    if (match) {
      const level = (match[0].match(/[0-9ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/g) || []).length;
      return level * 16;
    }
    return 0;
  };

  // 업로드 카드: validation과 동일하게 (간격 개선)
  const buttonStyle = {
    background: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontWeight: 600,
    fontSize: 16,
    minWidth: 120,
    height: 48,
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    boxShadow: '0 2px 8px rgba(33,150,243,0.08)'
  };
  const renderUploadCard = () => (
    <div className={styles.uploadSection}>
      <h3 style={{ marginBottom: 24 }}>엑셀 파일 업로드</h3>
      <div className={styles.uploadArea} style={{ marginBottom: 24 }} onClick={handleUploadAreaClick}>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className={styles.fileInput}
          id="file-upload"
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-upload" className={styles.uploadLabel} style={{ pointerEvents: 'none' }}>
          <i className='bx bx-cloud-upload'></i>
          <span>엑셀 파일을 선택하거나 드래그하세요.</span>
        </label>
        {file && (
          <div className={styles.fileInfo}>
            <i className='bx bx-file'></i>
            <span>{file.name}</span>
          </div>
        )}
      </div>
      {sheetNames.length > 0 && (
        <div style={{ margin: '20px 0' }}>
          <select
            value={sheetName}
            onChange={e => setSheetName(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 0, border: '1px solid #222', fontSize: '16px', background: '#fff', color: '#222' }}
          >
            {sheetNames.filter(name => name !== 'Index' && name !== '공시기본정보').map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}
      <button onClick={handleUpload} disabled={!isReady || loading} className={styles.actionButton}>
        {loading ? '업로드 중...' : '업로드 및 변환'}
      </button>
      {error && <div style={{ color: '#e74c3c', marginTop: 18, fontWeight: 500 }}>{error}</div>}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px 16px', 
        background: '#f8f9fa', 
        borderRadius: '0',
        border: '1px solid #e9ecef'
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '13px', 
          color: '#6b7280', 
          lineHeight: '1.5',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <i className='bx bx-info-circle' style={{ 
            fontSize: '14px', 
            color: '#3b82f6',
            marginTop: '1px',
            flexShrink: 0
          }}></i>
          <span style={{ flex: 1, minWidth: '200px' }}>편리한 시연을 위해 네오위즈 재무제표 샘플 파일이 미리 준비되어 있습니다. 바로 변환 버튼을 눌러보세요!</span>
        </p>
      </div>
    </div>
  );

  // 표 렌더링 (DART 전자공시 dry 스타일, 나머지 UI는 넓고 modern하게 유지)
  const renderTable = () => {
    if (!result || !result.sheets || !sheetName) return null;
    let rows: any[] = Array.isArray(result.sheets[sheetName]) ? result.sheets[sheetName] : [];
    if (!rows || rows.length === 0) return <div style={{ color: '#888', marginTop: 16 }}>데이터가 없습니다. (엑셀 시트 구조를 확인하세요)</div>;
    // 계정명 컬럼명 찾기
    const accountCol = Object.keys(rows[0]).find(k => k.includes('계정') || k.toLowerCase().includes('account')) || Object.keys(rows[0])[0];
    const yearCols = Object.keys(rows[0]).filter(k => k !== accountCol);
    if (yearCols.length === 0) return <div style={{ color: '#888', marginTop: 16 }}>연도별 금액 컬럼이 없습니다. (엑셀 시트 구조를 확인하세요)</div>;
    // 불필요한 행(재무상태표, 개요 등) 자동 필터링
    const filterKeywords = ['재무상태표', '개요', 'index', 'Index'];
    rows = rows.filter(row => {
      const val = (row[accountCol] || '').toString().trim();
      // 완전히 빈 행, index, 재무상태표, 개요 등 포함시 제외
      if (!val) return false;
      return !filterKeywords.some(keyword => val.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').toLowerCase().includes(keyword.toLowerCase()));
    });
    if (rows.length === 0) return <div style={{ color: '#888', marginTop: 16 }}>표시할 데이터가 없습니다. (엑셀 시트 구조를 확인하세요)</div>;
    return (
      <div style={{ marginTop: 32 }}>
        {renderTableHeader()}
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #222', borderRadius: 0 }}>
          <table id="dart-table" style={{ borderCollapse: 'collapse', width: '100%', fontFamily: 'Malgun Gothic, Dotum, Arial, sans-serif', fontSize: 14, background: '#fff', color: '#222' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #222', padding: '6px 8px', background: '#fff', fontWeight: 700, textAlign: 'left', minWidth: 180 }}></th>
                {yearCols.map(col => (
                  <th key={col} style={{ border: '1px solid #222', padding: '6px 8px', background: '#fff', fontWeight: 700, textAlign: 'right' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #222', padding: '6px 8px', textAlign: 'left', fontWeight: 400, background: '#fff', whiteSpace: 'pre', paddingLeft: getIndent(row[accountCol]), minWidth: 180 }}>{row[accountCol]}</td>
                  {yearCols.map(col => (
                    <td key={col} style={{ border: '1px solid #222', padding: '6px 8px', textAlign: 'right', background: '#fff', fontWeight: 400, fontFamily: 'inherit' }}>
                      {convertUnit(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // DSD 페이지용 브레드크럼
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'DSD 데이터 생성', active: true }
  ];

  const [isReady, setIsReady] = useState(false); // ✅ 새 상태 추가

  useEffect(() => {
    const loadDefaultFile = async () => {
      setLoading(true);
      try {
        const encodedFileName = encodeURIComponent(DEFAULT_EXCEL_FILE_NAME);
        const defaultUrl = `/${encodedFileName}`;
        const response = await fetch(defaultUrl);
        if (!response.ok) return;
        const blob = await response.blob();
        const defaultFile = new File([blob], DEFAULT_EXCEL_FILE_NAME, { type: blob.type });

        const reader = new FileReader();
        reader.onload = (evt) => {
          const data = evt.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheet = workbook.SheetNames[0] || '';
          setFile(defaultFile);
          setSheetNames(workbook.SheetNames);
          setSheetName(sheet);
          setIsReady(true); // ✅ 기존 코드 유지
        
          // ✅ 여기서 업로드 함수 수동 호출 (sheetName이 아직 비어있을 수 있으니 직접 넘김)
          setTimeout(() => {
            handleUploadWithParams(defaultFile, sheet);
          }, 0);
        };
        reader.readAsBinaryString(defaultFile);
      } catch (e) {
        // handle error if needed
      } finally {
        setLoading(false);
      }
    };
    loadDefaultFile();
  }, []);

  const handleUploadWithParams = async (fileParam: File, sheetParam: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', fileParam);
      formData.append('sheet_name', sheetParam);
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL_DART_CONVERTER}/dart_converter/upload`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
   
  useEffect(() => {
    if (file && sheetName) {
      handleUploadWithParams(file, sheetName);
    }
  }, [sheetName]);
  
  return (
    <div className={styles.pageWrapper}>
      <PageHeader
        title="DART Converter"
        description="엑셀 파일을 DART 공식 형식으로 변환하여 표준화된 데이터를 생성하세요."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'DART Converter', active: true }
        ]}
        className={styles.card}
      />
      {/* 업로드 카드 */}
      <div className={styles.card}>
        {renderUploadCard()}
      </div>
      {renderTable()}
    </div>
  );
};

export default DSDPage; 