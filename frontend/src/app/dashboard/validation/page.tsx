// --- 파일명: src/app/dashboard/validation/page.tsx (최종 디테일 수정 버전) ---

"use client";

import React, { useState, useMemo } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import styles from './validation.module.scss';
import * as XLSX from 'xlsx'; // 엑셀 생성을 위한 라이브러리 import

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

const accountStructure = [
    { key: "자산 [개요]", name: "자산 [개요]", indent: 0, isBold: true },
    { key: "유동자산", name: "    유동자산", indent: 1, isBold: false },
    { key: "현금및현금성자산", name: "        현금및현금성자산", indent: 2, isBold: false },
    { key: "매출채권및기타채권", name: "        매출채권및기타채권", indent: 2, isBold: false },
    { key: "당기법인세자산", name: "        당기법인세자산", indent: 2, isBold: false },
    { key: "금융자산", name: "        금융자산", indent: 2, isBold: false },
    { key: "기타자산", name: "        기타자산", indent: 2, isBold: false },
    { key: "재고자산", name: "        재고자산", indent: 2, isBold: false },
    { key: "매각예정비유동자산", name: "        매각예정비유동자산", indent: 2, isBold: false },
    { key: "비유동자산", name: "    비유동자산", indent: 1, isBold: false },
    { key: "매출채권및기타채권-1", name: "        매출채권및기타채권", indent: 2, isBold: false },
    { key: "관계기업투자", name: "        관계기업투자", indent: 2, isBold: false },
    { key: "유형자산", name: "        유형자산", indent: 2, isBold: false },
    { key: "사용권자산", name: "        사용권자산", indent: 2, isBold: false },
    { key: "투자부동산", name: "        투자부동산", indent: 2, isBold: false },
    { key: "무형자산", name: "        무형자산", indent: 2, isBold: false },
    { key: "금융자산-1", name: "        금융자산", indent: 2, isBold: false },
    { key: "순확정급여자산", name: "        순확정급여자산", indent: 2, isBold: false },
    { key: "기타자산-1", name: "        기타자산", indent: 2, isBold: false },
    { key: "이연법인세자산", name: "        이연법인세자산", indent: 2, isBold: false },
    { key: "자산총계", name: "    자산총계", indent: 1, isBold: true },
    { key: "부채 [개요]", name: "부채 [개요]", indent: 0, isBold: true },
    { key: "유동부채", name: "    유동부채", indent: 1, isBold: false },
    { key: "매입채무및기타채무", name: "        매입채무및기타채무", indent: 2, isBold: false },
    { key: "금융부채", name: "        금융부채", indent: 2, isBold: false },
    { key: "리스부채", name: "        리스부채", indent: 2, isBold: false },
    { key: "당기법인세부채", name: "        당기법인세부채", indent: 2, isBold: false },
    { key: "충당부채", name: "        충당부채", indent: 2, isBold: false },
    { key: "매각예정비유동부채", name: "        매각예정비유동부채", indent: 2, isBold: false },
    { key: "기타부채", name: "        기타부채", indent: 2, isBold: false },
    { key: "비유동부채", name: "    비유동부채", indent: 1, isBold: false },
    { key: "매입채무및기타채무-1", name: "        매입채무및기타채무", indent: 2, isBold: false },
    { key: "금융부채-1", name: "        금융부채", indent: 2, isBold: false },
    { key: "리스부채-1", name: "        리스부채", indent: 2, isBold: false },
    { key: "충당부채-1", name: "        충당부채", indent: 2, isBold: false },
    { key: "기타부채-1", name: "        기타부채", indent: 2, isBold: false },
    { key: "순확정급여부채", name: "        순확정급여부채", indent: 2, isBold: false },
    { key: "이연법인세부채", name: "        이연법인세부채", indent: 2, isBold: false },
    { key: "부채총계", name: "    부채총계", indent: 1, isBold: true },
    { key: "자본 [개요]", name: "자본 [개요]", indent: 0, isBold: true },
    { key: "지배기업의소유지분", name: "    지배기업의소유지분", indent: 1, isBold: false },
    { key: "자본금", name: "        자본금", indent: 2, isBold: false },
    { key: "주식발행초과금", name: "        주식발행초과금", indent: 2, isBold: false },
    { key: "이익잉여금", name: "        이익잉여금", indent: 2, isBold: false },
    { key: "기타자본", name: "        기타자본", indent: 2, isBold: false },
    { key: "비지배지분", name: "    비지배지분", indent: 1, isBold: false },
    { key: "자본총계", name: "    자본총계", indent: 1, isBold: true },
    { key: "자본과부채총계", name: "자본과부채총계", indent: 0, isBold: true }
];

// --- Main Component ---
const ValidationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [footingResponse, setFootingResponse] = useState<FootingResponse | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<string | null>(null);

  const breadcrumbs = [ { label: 'Dashboard', href: '/dashboard' }, { label: 'Validation', active: true }];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFootingResponse(null);
      setActiveResultTab(null);
    }
  };

  const handleFootingValidation = async () => {
    if (!file) { alert('엑셀 파일을 먼저 업로드해주세요.'); return; }
    setLoading(true);
    setFootingResponse(null);
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

  const processedData = useMemo(() => {
    if (!footingResponse) return null;
    const processed: Record<string, { headers: string[], rows: any[] }> = {};

    for (const sheetResult of footingResponse.results) {
        const yearHeaders = Object.keys(sheetResult.results_by_year);
        const headers = ["", ...yearHeaders];
        
        const validationData: FootingResultItem[] = [];
        const flatten = (items: FootingResultItem[]) => {
            for (const item of items) {
                validationData.push(item);
                if (item.children) flatten(item.children);
            }
        };
        if (yearHeaders.length > 0) {
            flatten(sheetResult.results_by_year[yearHeaders[0]]);
        }
        
        const rows = validationData.slice(0, accountStructure.length).map((item, index) => {
            const accountInfo = accountStructure[index] || { name: item.item, indent: 0, isBold: false };
            const row: Record<string, any> = { 
                '': accountInfo.name,
                'indent': accountInfo.indent,
                'isBold': accountInfo.isBold
            };
            for (const year of yearHeaders) {
                const yearData = sheetResult.results_by_year[year];
                let validationItem: FootingResultItem | undefined;
                const findItem = (items: FootingResultItem[], targetIndex: number, currentIndex: {val: number}): FootingResultItem | undefined => {
                    for(const i of items) {
                        if(currentIndex.val === targetIndex) return i;
                        currentIndex.val++;
                        if(i.children) {
                            const found = findItem(i.children, targetIndex, currentIndex);
                            if(found) return found;
                        }
                    }
                };
                validationItem = findItem(yearData, index, {val: 0});

                row[year] = {
                    value: validationItem?.actual ?? null,
                    status: validationItem ? (validationItem.is_match ? 'match' : 'mismatch') : 'none',
                };
            }
            return row;
        });
        
        processed[sheetResult.sheet] = { headers, rows };
    }
    return processed;
  }, [footingResponse]);

  const formatValueForDisplay = (value: any) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toLocaleString('ko-KR');
    }
    return '';
  };

  const formatValueForExport = (value: any): string | number => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    return '';
  };

  const getCleanTableData = (sheet: string) => {
    const data = processedData?.[sheet];
    if (!data) return { headers: [], data: [] };

    const cleanHeaders = data.headers.map(h => h === '' ? '계정과목' : h);
    const cleanData = data.rows.map(row => {
        const newRow: Record<string, any> = {};
        data.headers.forEach(header => {
            const key = header === '' ? '계정과목' : header;
            const cellValue = row[header];
            newRow[key] = header === '' ? row[''] : formatValueForExport(cellValue?.value);
        });
        return newRow;
    });
    return { headers: cleanHeaders, data: cleanData };
  };

  const copyTableToClipboard = (sheet: string) => {
    const { headers, data } = getCleanTableData(sheet);
    const tsv = [
      headers.join('\t'),
      ...data.map(row => headers.map(h => row[h]).join('\t'))
    ].join('\n');
    navigator.clipboard.writeText(tsv).then(() => alert('표가 클립보드에 복사되었습니다.'));
  };

  const downloadTableAsXLSX = (sheet: string) => {
    const { headers, data } = getCleanTableData(sheet);
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers, skipHeader: true });
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet);
    XLSX.writeFile(workbook, `${sheet}.xlsx`);
  };

  return (
    <Layout>
      <PageHeader title="재무제표 검증" breadcrumbs={breadcrumbs} />
      <div className={styles.container}>
        {/* ... (Upload, Action Section은 동일) ... */}
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
          <div className={styles.actionItem}>
            <h4>재무제표 합계검증</h4>
            <p>업로드된 엑셀 파일의 재무상태표 시트에 대해 합계 일치 여부를 자동 검증합니다.</p>
            <button onClick={handleFootingValidation} disabled={loading || !file} className={`${styles.actionButton} ${styles.primary}`}>
              {loading ? '검증 중...' : '검증 시작하기'}
            </button>
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
              {/* ⭐️ FIX: 내보내기 버튼 기능 추가 */}
              <div className={styles.exportButtons}>
                <button onClick={() => copyTableToClipboard(activeResultTab!)} className={styles.exportButton}>
                  <i className='bx bx-copy'></i> 표 복사
                </button>
                <button onClick={() => downloadTableAsXLSX(activeResultTab!)} className={styles.exportButton}>
                  <i className='bx bxs-file-export'></i> 엑셀로 내보내기
                </button>
              </div>
            </div>
            <div className={styles.resultTabs}>
              {footingResponse.results.map(result => (
                <button key={result.sheet} className={`${styles.tabButton} ${activeResultTab === result.sheet ? styles.active : ''}`} onClick={() => setActiveResultTab(result.sheet)}>
                  {result.title} ({result.sheet})
                </button>
              ))}
            </div>
            {footingResponse.results.map(sheetResult => {
              const currentSheetData = processedData[sheetResult.sheet];
              if (!currentSheetData || activeResultTab !== sheetResult.sheet) return null;

              return (
                <div key={sheetResult.sheet} className={styles.tableContainer}>
                  <table className={styles.resultTable}>
                    <thead>
                      <tr>
                        {currentSheetData.headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSheetData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {currentSheetData.headers.map((header, colIndex) => {
                            const isFirstColumn = colIndex === 0;
                            const cellData = row[header];
                            return (
                              <td 
                                key={`${header}-${colIndex}`} 
                                style={isFirstColumn ? { paddingLeft: `${row.indent * 20 + 10}px` } : {}}
                                className={isFirstColumn ? (row.isBold ? styles.boldCell : '') : `${styles.numberCell} ${cellData ? styles[cellData.status] : ''}`}
                              >
                                {isFirstColumn ? cellData : formatValueForDisplay(cellData.value)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ValidationPage;