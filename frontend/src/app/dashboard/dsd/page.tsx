"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import * as XLSX from 'xlsx';
import styles from '../validation/validation.module.scss';

const DSDPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'원' | '백만원'>('원');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

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

  const handleUpload = async () => {
    if (!file || !sheetName) {
      setError('엑셀 파일과 시트를 선택해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheet_name', sheetName);
      const response = await fetch('http://localhost:8085/dsdgen/upload', {
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
        <span style={{ fontWeight: 500, fontSize: 16, marginRight: 8 }}>단위</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setUnit('원')}
            style={{
              ...buttonStyle,
              background: unit === '원' ? '#1976d2' : '#e3eaf5',
              color: unit === '원' ? '#fff' : '#1976d2',
              outline: unit === '원' ? '2px solid #1976d2' : 'none',
              boxShadow: unit === '원' ? buttonStyle.boxShadow : 'none',
            }}
            onMouseOver={e => { if (unit !== '원') e.currentTarget.style.background = '#d0e3fa'; }}
            onMouseOut={e => { if (unit !== '원') e.currentTarget.style.background = '#e3eaf5'; }}
          >
            ₩ 원
          </button>
          <button
            type="button"
            onClick={() => setUnit('백만원')}
            style={{
              ...buttonStyle,
              background: unit === '백만원' ? '#1976d2' : '#e3eaf5',
              color: unit === '백만원' ? '#fff' : '#1976d2',
              outline: unit === '백만원' ? '2px solid #1976d2' : 'none',
              boxShadow: unit === '백만원' ? buttonStyle.boxShadow : 'none',
            }}
            onMouseOver={e => { if (unit !== '백만원') e.currentTarget.style.background = '#d0e3fa'; }}
            onMouseOut={e => { if (unit !== '백만원') e.currentTarget.style.background = '#e3eaf5'; }}
          >
            ₩ 백만원
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
        {copyMsg ? (
          <span style={{
            ...buttonStyle,
            background: '#388e3c',
            color: '#fff',
            border: 'none',
            textAlign: 'center',
            pointerEvents: 'none',
            fontWeight: 600,
            fontSize: 16,
            minWidth: 120,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(56,142,60,0.08)'
          }}>{copyMsg}</span>
        ) : (
          <button
            onClick={handleCopyTable}
            style={buttonStyle}
            onMouseOver={e => (e.currentTarget.style.background = '#1251a3')}
            onMouseOut={e => (e.currentTarget.style.background = '#1976d2')}
          >복사하기</button>
        )}
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
      <div className={styles.card}>
        <h3 style={{ marginBottom: 24 }}>엑셀 파일 업로드</h3>
        <div className={styles.uploadArea} style={{ marginBottom: 24 }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className={styles.fileInput}
            id="file-upload"
          />
          <label htmlFor="file-upload" className={styles.uploadLabel}>
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
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' }}
            >
              {sheetNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{ ...buttonStyle, background: loading ? '#90caf9' : '#1976d2', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : buttonStyle.boxShadow }}
        >
          {loading ? '업로드 중...' : '업로드 및 변환'}
        </button>
        {error && <div style={{ color: '#e74c3c', marginTop: 18, fontWeight: 500 }}>{error}</div>}
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

  // 반응형 및 사이드바 겹침/overflow 방지용 스타일 추가
  const containerStyle: React.CSSProperties = {
    padding: '40px 40px 40px 284px', // sidebar(260px) + 24px
    background: '#f8f9fa',
    minHeight: '100vh',
    minWidth: 0,
    overflowX: 'hidden',
  };

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>DART Converter</span>
          </div>
          <h2 className={styles.cardTitle}>DART Converter</h2>
          <p>엑셀 파일을 DART 공시 형식으로 변환하여 표준화된 데이터를 생성하세요.</p>
        </div>
        {renderUploadCard()}
        {renderTable()}
      </div>
    </Layout>
  );
};

export default DSDPage; 