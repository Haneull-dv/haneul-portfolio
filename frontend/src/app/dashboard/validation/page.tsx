// --- 파일명: src/app/dashboard/validation/page.tsx (최종 디테일 수정 버전) ---

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import styles from './validation.module.scss';

// --- Interface Definitions ---
interface FootingResultItem {
  item: string;
  expected: number | null;
  actual: number | null;
  is_match: boolean;
  children?: FootingResultItem[];
}

interface YearlyFootingSheetResult {
  sheet: string;
  title: string;
  results_by_year: Record<string, FootingResultItem[]>;
}

interface FootingResponse {
  results: YearlyFootingSheetResult[];
  total_sheets: number;
  mismatch_count: number;
}

interface AccountStructureItem {
  name: string;
  indent: number;
  isBold: boolean;
  path?: string;
}

// --- DART Comparison Interfaces ---
interface MismatchDetail {
  account_nm: string;
  excel_val: number | string | null;
  dart_val: number | string | null;
}

interface ComparisonResult {
  fs_div: string;
  sj_div: string;
  sheet_name: string;
  total_items: number;
  mismatch_items: number;
  mismatches: MismatchDetail[];
}

// ⭐️ FIX: 하드코딩 목록에 들여쓰기 정보와 원본 텍스트를 포함
const accountStructure: AccountStructureItem[] = [
    { name: "자산 [개요]", indent: 0, isBold: true },
    { name: "    유동자산", indent: 1, isBold: false, path: "자산총계 > 유동자산" },
    { name: "        현금및현금성자산", indent: 2, isBold: false, path: "자산총계 > 유동자산 > 현금및현금성자산" },
    { name: "        매출채권및기타채권", indent: 2, isBold: false, path: "자산총계 > 유동자산 > 매출채권및기타채권" },
    { name: "        당기법인세자산", indent: 2, isBold: false, path: "자산총계 > 유동자산 > 당기법인세자산" },
    { name: "        금융자산", indent: 2, isBold: false, path: "자산총계 > 유동자산 > 금융자산" },
    { name: "        기타자산", indent: 2, isBold: false, path: "자산총계 > 유동자산 > 기타자산" },
    { name: "        재고자산", indent: 2, isBold: false, path: "자산총계 > 유동자산 > 재고자산" },
    { name: "        매각예정비유동자산", indent: 2, isBold: false, path: "자산총계 > 유동자산 > 매각예정비유동자산" },
    { name: "    비유동자산", indent: 1, isBold: false, path: "자산총계 > 비유동자산" },
    { name: "        매출채권및기타채권", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 매출채권및기타채권" },
    { name: "        관계기업투자", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 관계기업투자" },
    { name: "        유형자산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 유형자산" },
    { name: "        사용권자산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 사용권자산" },
    { name: "        투자부동산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 투자부동산" },
    { name: "        무형자산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 무형자산" },
    { name: "        금융자산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 금융자산" },
    { name: "        순확정급여자산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 순확정급여자산" },
    { name: "        기타자산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 기타자산" },
    { name: "        이연법인세자산", indent: 2, isBold: false, path: "자산총계 > 비유동자산 > 이연법인세자산" },
    { name: "    자산총계", indent: 1, isBold: true, path: "자산총계" },
    { name: "부채 [개요]", indent: 0, isBold: true },
    { name: "    유동부채", indent: 1, isBold: false, path: "부채총계 > 유동부채" },
    { name: "        매입채무및기타채무", indent: 2, isBold: false, path: "부채총계 > 유동부채 > 매입채무및기타채무" },
    { name: "        금융부채", indent: 2, isBold: false, path: "부채총계 > 유동부채 > 금융부채" },
    { name: "        리스부채", indent: 2, isBold: false, path: "부채총계 > 유동부채 > 리스부채" },
    { name: "        당기법인세부채", indent: 2, isBold: false, path: "부채총계 > 유동부채 > 당기법인세부채" },
    { name: "        충당부채", indent: 2, isBold: false, path: "부채총계 > 유동부채 > 충당부채" },
    { name: "        매각예정비유동부채", indent: 2, isBold: false, path: "부채총계 > 유동부채 > 매각예정비유동부채" },
    { name: "        기타부채", indent: 2, isBold: false, path: "부채총계 > 유동부채 > 기타부채" },
    { name: "    비유동부채", indent: 1, isBold: false, path: "부채총계 > 비유동부채" },
    { name: "        매입채무및기타채무", indent: 2, isBold: false, path: "부채총계 > 비유동부채 > 매입채무및기타채무" },
    { name: "        금융부채", indent: 2, isBold: false, path: "부채총계 > 비유동부채 > 금융부채" },
    { name: "        리스부채", indent: 2, isBold: false, path: "부채총계 > 비유동부채 > 리스부채" },
    { name: "        충당부채", indent: 2, isBold: false, path: "부채총계 > 비유동부채 > 충당부채" },
    { name: "        기타부채", indent: 2, isBold: false, path: "부채총계 > 비유동부채 > 기타부채" },
    { name: "        순확정급여부채", indent: 2, isBold: false, path: "부채총계 > 비유동부채 > 순확정급여부채" },
    { name: "        이연법인세부채", indent: 2, isBold: false, path: "부채총계 > 비유동부채 > 이연법인세부채" },
    { name: "    부채총계", indent: 1, isBold: true, path: "부채총계" },
    { name: "자본 [개요]", indent: 0, isBold: true },
    { name: "    지배기업의소유지분", indent: 1, isBold: false, path: "자본총계 > 지배기업의소유지분" },
    { name: "        자본금", indent: 2, isBold: false, path: "자본총계 > 지배기업의소유지분 > 자본금" },
    { name: "        주식발행초과금", indent: 2, isBold: false, path: "자본총계 > 지배기업의소유지분 > 주식발행초과금" },
    { name: "        이익잉여금", indent: 2, isBold: false, path: "자본총계 > 지배기업의소유지분 > 이익잉여금" },
    { name: "        기타자본", indent: 2, isBold: false, path: "자본총계 > 지배기업의소유지분 > 기타자본" },
    { name: "    비지배지분", indent: 1, isBold: false, path: "자본총계 > 비지배지분" },
    { name: "    자본총계", indent: 1, isBold: true, path: "자본총계" },
    { name: "자본과부채총계", indent: 0, isBold: true, path: "자본과부채총계" }
];

const DEFAULT_EXCEL_FILE_NAME = 'neowiz_report.xlsx';

// --- Main Component ---
const ValidationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [footingResponse, setFootingResponse] = useState<FootingResponse | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<string | null>(null);
  const [corpName, setCorpName] = useState('');
  const [year, setYear] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult[] | null>(null);

  const breadcrumbs = [ { label: 'Dashboard', href: '/dashboard' }, { label: 'Validation', active: true }];

  useEffect(() => {
    // 페이지 로드 시 기본 엑셀 파일을 불러옵니다.
    const loadDefaultFile = async () => {
      try {
        const response = await fetch(`/${DEFAULT_EXCEL_FILE_NAME}`);
        if (!response.ok) {
          throw new Error('기본 엑셀 파일을 불러오는 데 실패했습니다.');
        }
        const blob = await response.blob();
        const defaultFile = new File([blob], DEFAULT_EXCEL_FILE_NAME, { type: blob.type });
        setFile(defaultFile);
      } catch (error) {
        console.error(error);
        // alert(error.message); // 사용자에게 알릴 필요가 있다면 활성화
      }
    };

    loadDefaultFile();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFootingResponse(null);
      setComparisonResult(null);
      setActiveResultTab(null);
    }
  };

  const handleFootingValidation = async () => {
    if (!file) { alert('엑셀 파일을 먼저 업로드해주세요.'); return; }

    if (file.name !== DEFAULT_EXCEL_FILE_NAME) {
      alert('사용자 지정 엑셀 파일은 현재 지원되지 않습니다. 계정과목 체계가 달라 검증을 진행할 수 없습니다.');
      return;
    }

    setLoading(true);
    setFootingResponse(null);
    setComparisonResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('http://localhost:8086/api/v1/dsdfooting/check-footing', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '검증 요청이 실패했습니다.');
      }
      const result: FootingResponse = await response.json();
      setFootingResponse(result);
      if (result.results.length > 0) {
        setActiveResultTab(result.results[0].sheet);
      }
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof Error) {
        alert(`검증 중 오류가 발생했습니다: ${error.message}`);
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDartComparison = async () => {
    alert('해당 기능은 준비중입니다.');
  };

  const processedData = useMemo(() => {
    if (!footingResponse) return null;
    const processed: Record<string, { headers: string[], rows: any[] }> = {};

    // 경로를 기반으로 재귀적으로 검증 항목을 찾는 헬퍼 함수
    const findItemByPath = (items: FootingResultItem[], path: string): FootingResultItem | undefined => {
      const segments = path.split(' > ');
      let currentLevelItems: FootingResultItem[] | undefined = items;
      let foundItem: FootingResultItem | undefined;

      for (const segment of segments) {
        if (!currentLevelItems) return undefined;
        foundItem = currentLevelItems.find(item => item.item.trim() === segment.trim());
        if (!foundItem) return undefined;
        currentLevelItems = foundItem.children;
      }
      return foundItem;
    };

    for (const sheetResult of footingResponse.results) {
        const yearHeaders = Object.keys(sheetResult.results_by_year);
        const headers = ["", ...yearHeaders];
        
        const rows = accountStructure.map(accountInfo => {
            const row: Record<string, any> = { 
                '': accountInfo.name,
                'indent': accountInfo.indent,
                'isBold': accountInfo.isBold
            };

            for (const year of yearHeaders) {
                const validationItem = accountInfo.path 
                    ? findItemByPath(sheetResult.results_by_year[year], accountInfo.path)
                    : undefined;

                row[year] = {
                    value: validationItem?.actual ?? null,
                    status: validationItem ? (validationItem.is_match ? 'match' : 'mismatch') : 'none',
                    expected: validationItem?.expected ?? null,
                };
            }
            return row;
        });
        
        processed[sheetResult.sheet] = { headers, rows };
    }
    return processed;
  }, [footingResponse]);

  const formatNumber = (value: any) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toLocaleString('ko-KR');
    }
    // ⭐️ FIX: '-' 대신 빈 문자열 반환
    return '';
  };

  return (
    <Layout>
      <PageHeader title="재무제표 검증" breadcrumbs={breadcrumbs} />
      <div className={styles.container}>
        <div className={styles.card}>
          <h3>1. 엑셀 파일 업로드</h3>
          <div className={styles.uploadArea}>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className={styles.fileInput} id="file-upload" />
            <label htmlFor="file-upload" className={styles.uploadLabel}>
              <i className='bx bx-cloud-upload'></i>
              <span>엑셀 파일을 선택하거나 드래그하세요</span>
            </label>
            {file && <div className={styles.fileInfo}><i className='bx bxs-file-excel'></i><span>{file.name}</span></div>}
          </div>
        </div>
        <div className={styles.card}>
          <h3>2. 검증 실행</h3>
          <div className={styles.actionContainer}>
            <div className={styles.actionItem}>
              <h4>재무제표 합계검증</h4>
              <p>계정 간 합계를 교차 검증하여 데이터의 수치적 오류를 찾아냅니다.</p>
              <button onClick={handleFootingValidation} disabled={loading || !file} className={`${styles.actionButton} ${styles.primary}`}>
                {loading ? '검증 중...' : '검증 시작하기'}
              </button>
            </div>
            <div className={styles.actionItem}>
              <h4>전기보고서 대사</h4>
              <p>DART 공시자료와 엑셀 데이터를 비교하여 일치여부를 검증합니다.</p>
              <div className={styles.inputGroup}>
                <input type="text" placeholder="기업명 (예: 네오위즈)" value={corpName} onChange={e => setCorpName(e.target.value)} className={styles.formInput} />
                <input type="number" placeholder="사업연도 (예: 2023)" value={year} onChange={e => setYear(e.target.value)} className={styles.formInput} />
              </div>
              <button onClick={handleDartComparison} disabled={!file || !corpName || !year || loading} className={`${styles.actionButton} ${styles.orange}`}>
                대사 시작하기
              </button>
            </div>
          </div>
        </div>

        {footingResponse && processedData && (
          <div className={`${styles.card} ${styles.resultsSection}`}>
            <div className={styles.resultHeader}>
              <h3>3. 검증 결과</h3>
              <div className={styles.summary}>
                <span className={styles.totalSheets}>검증 시트: {footingResponse.total_sheets}개</span>
                <span className={`${styles.mismatchCount} ${footingResponse.mismatch_count > 0 ? styles.error : styles.success}`}>
                  총 불일치 항목: {footingResponse.mismatch_count}개
                </span>
              </div>
            </div>
            <div className={styles.resultTabs}>
              {footingResponse.results.map(result => (
                <button key={result.sheet} className={`${styles.tabButton} ${activeResultTab === result.sheet ? styles.active : ''}`} onClick={() => setActiveResultTab(result.sheet)}>
                  {result.title} ({result.sheet})
                </button>
              ))}
            </div>
            {footingResponse.results.map(sheetResult => (
              activeResultTab === sheetResult.sheet && (
                <div key={sheetResult.sheet} className={styles.tableContainer}>
                  <table className={styles.resultTable}>
                    <thead>
                      <tr>
                        {processedData[sheetResult.sheet].headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {processedData[sheetResult.sheet].rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {processedData[sheetResult.sheet].headers.map((header, colIndex) => {
                            const isFirstColumn = colIndex === 0;
                            const cellData = row[header];
                            const tooltipText =
                              cellData?.status === 'mismatch' && cellData.expected != null
                                ? `기대값: ${formatNumber(cellData.expected)}`
                                : '';

                            return (
                              <td
                                key={`${header}-${colIndex}`}
                                style={isFirstColumn ? { paddingLeft: `${row.indent * 20 + 10}px` } : {}}
                                className={isFirstColumn ? (row.isBold ? styles.boldCell : '') : `${styles.numberCell} ${cellData ? styles[cellData.status] : ''}`}
                                {...(tooltipText && { title: tooltipText })}
                              >
                                {isFirstColumn ? cellData : formatNumber(cellData?.value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ))}
          </div>
        )}

        {comparisonResult && (
          <div className={`${styles.card} ${styles.resultsSection}`}>
            <div className={styles.resultHeader}>
              <h3>3. 검증 결과 (DART 대사)</h3>
            </div>
            {comparisonResult.map((result, index) => (
              <div key={index} className={styles.tableContainer}>
                <h4>{result.sheet_name} ({result.fs_div} {result.sj_div})</h4>
                <p>총 {result.total_items}개 항목 중 {result.mismatch_items}개 불일치</p>
                {result.mismatch_items > 0 && (
                  <table className={styles.resultTable}>
                    <thead>
                      <tr>
                        <th>계정명</th>
                        <th>엑셀 값</th>
                        <th>DART 값</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.mismatches.map((mismatch, i) => (
                        <tr key={i}>
                          <td>{mismatch.account_nm}</td>
                          <td className={styles.numberCell}>{formatNumber(mismatch.excel_val)}</td>
                          <td className={styles.numberCell}>{formatNumber(mismatch.dart_val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ValidationPage;