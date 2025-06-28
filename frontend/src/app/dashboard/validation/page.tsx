"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import styles from './validation.module.scss';

// VALIDATION_RULES from backend - 백엔드의 validation_rules.py와 동일한 구조
const VALIDATION_RULES = {
  "연결재무상태표": {
    "__special_checks__": {
      "자산부채자본일치": {
        "항목1": "자산총계",
        "항목2": ["부채총계", "자본총계"],
        "연산자": "="
      },
      "부채자본합계일치": {
        "항목1": "자본과부채총계",
        "항목2": ["부채총계", "자본총계"],
        "연산자": "="
      }
    },
    
    // 최상위 검증 규칙
    "자본과부채총계": ["부채총계", "자본총계"],
    "자산총계": ["유동자산", "비유동자산"],
    "부채총계": ["유동부채", "비유동부채"],
    "자본총계": ["지배기업의소유지분", "비지배지분"],
    
    // 자산 섹션
    "유동자산": [
      "유동자산 > 현금및현금성자산",
      "유동자산 > 매출채권및기타채권",
      "유동자산 > 당기법인세자산",
      "유동자산 > 금융자산",
      "유동자산 > 기타자산",
      "유동자산 > 재고자산",
      "유동자산 > 매각예정비유동자산"
    ],
    
    "비유동자산": [
      "비유동자산 > 매출채권및기타채권",
      "비유동자산 > 관계기업투자",
      "비유동자산 > 유형자산",
      "비유동자산 > 사용권자산",
      "비유동자산 > 투자부동산",
      "비유동자산 > 무형자산",
      "비유동자산 > 금융자산",
      "비유동자산 > 순확정급여자산",
      "비유동자산 > 기타자산",
      "비유동자산 > 이연법인세자산"
    ],
    
    // 부채 섹션
    "유동부채": [
      "유동부채 > 매입채무및기타채무",
      "유동부채 > 금융부채",
      "유동부채 > 리스부채",
      "유동부채 > 당기법인세부채",
      "유동부채 > 충당부채",
      "유동부채 > 매각예정비유동부채",
      "유동부채 > 기타부채"
    ],
    
    "비유동부채": [
      "비유동부채 > 매입채무및기타채무",
      "비유동부채 > 금융부채",
      "비유동부채 > 리스부채",
      "비유동부채 > 충당부채",
      "비유동부채 > 기타부채",
      "비유동부채 > 순확정급여부채",
      "비유동부채 > 이연법인세부채"
    ],
    
    // 자본 섹션
    "지배기업의소유지분": [
      "지배기업의소유지분 > 자본금",
      "지배기업의소유지분 > 주식발행초과금",
      "지배기업의소유지분 > 이익잉여금",
      "지배기업의소유지분 > 기타자본"
    ]
  }
};

interface ValidationResult {
  item: string;
  expected: number;
  actual: number;
  is_match: boolean;
  children?: ValidationResult[];
}

interface FootingResponse {
  total_sheets: number;
  mismatch_count: number;
  results: Array<{
    sheet: string;
    title: string;
    results_by_year: Record<string, ValidationResult[]>;
  }>;
}

interface ComparisonResult {
  fs_div: string;
  sj_div: string;
  account_nm: string;
  excel_amount: number;
  dart_amount: number;
  is_match: boolean;
  difference: number;
}

// 확장된 FinancialRowData 인터페이스
interface FinancialRowData {
  account_name: string;
  path: string;
  indent_level: number;
  amounts: Record<string, number | null>;
  validation_status: Record<string, boolean | null>;
  is_parent?: boolean; // 이 행이 VALIDATION_RULES의 key에 해당하는가?
  child_paths?: string[]; // is_parent가 true일 경우, 하위 계정들의 path 목록
}

interface FinancialStatementData {
  sheet_name: string;
  title: string;
  years: string[];
  rows: FinancialRowData[];
  validation_summary: Record<string, { total: number; match: number; mismatch: number }>;
}

// 툴팁 컴포넌트
interface TooltipProps {
  parentAccount: string;
  childAccounts: string[];
  position: { x: number; y: number };
}

const Tooltip: React.FC<TooltipProps> = ({ parentAccount, childAccounts, position }) => {
  const formula = `${parentAccount} = ${childAccounts.join(' + ')}`;
  
  return (
    <div 
      className={styles.tooltip}
      style={{ 
        left: position.x, 
        top: position.y,
        position: 'fixed',
        zIndex: 1000
      }}
    >
      <div className={styles.tooltipContent}>
        <strong>합계 공식:</strong>
        <div className={styles.formula}>{formula}</div>
        <div className={styles.childList}>
          <strong>구성 항목:</strong>
          <ul>
            {childAccounts.map((child, index) => (
              <li key={index}>{child}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ValidationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'footing' | 'comparison' | 'financial' | null>(null);
  const [footingResults, setFootingResults] = useState<FootingResponse | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [financialData, setFinancialData] = useState<FinancialStatementData | null>(null);
  
  // 호버 상태 관리 - 수정된 로직
  const [hoveredParentAccount, setHoveredParentAccount] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    parentAccount: string;
    childAccounts: string[];
    position: { x: number; y: number };
  }>({ show: false, parentAccount: '', childAccounts: [], position: { x: 0, y: 0 } });

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Validation', active: true }
  ];

  // 상위 계정인지 판별하는 함수
  const isParentAccount = (accountName: string): boolean => {
    const rules = VALIDATION_RULES["연결재무상태표"];
    return Object.keys(rules).includes(accountName) && accountName !== "__special_checks__";
  };

  // 하위 계정 목록을 가져오는 함수
  const getChildAccounts = (parentAccount: string): string[] => {
    const rules = VALIDATION_RULES["연결재무상태표"] as Record<string, any>;
    return rules[parentAccount] || [];
  };

  // 특정 행이 현재 호버된 상위 계정의 하위 계정인지 확인하는 함수
  const isChildOfHoveredParent = (row: FinancialRowData): boolean => {
    if (!hoveredParentAccount) return false;
    
    const childAccounts = getChildAccounts(hoveredParentAccount);
    return childAccounts.some(childName => 
      row.account_name === childName || 
      row.path.includes(childName) ||
      row.account_name.includes(childName.replace(/^.*> /, '')) // "유동자산 > 현금및현금성자산" -> "현금및현금성자산"
    );
  };

  // 마우스 호버 핸들러 - 수정된 로직
  const handleRowHover = (row: FinancialRowData, event: React.MouseEvent) => {
    if (isParentAccount(row.account_name)) {
      const childAccounts = getChildAccounts(row.account_name);
      
      setHoveredParentAccount(row.account_name);
      
      // 툴팁 표시
      setTooltipData({
        show: true,
        parentAccount: row.account_name,
        childAccounts: childAccounts,
        position: { x: event.clientX + 10, y: event.clientY + 10 }
      });
    }
  };

  // 마우스 벗어남 핸들러 - 수정된 로직
  const handleRowLeave = () => {
    setHoveredParentAccount(null);
    setTooltipData(prev => ({ ...prev, show: false }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Reset results when new file is uploaded
      setFootingResults(null);
      setComparisonResults(null);
      setFinancialData(null);
      setActiveTab(null);
    }
  };

  const handleFootingValidation = async () => {
    if (!file) {
      alert('엑셀 파일을 먼저 업로드해주세요.');
      return;
    }

    setLoading(true);
    setActiveTab('financial');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // 재무상태표 원본 데이터 가져오기 - 포트 8001로 변경
      const response = await fetch('http://localhost:8086/api/v1/dsdfooting/get-financial-data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 0 || !response.status) {
          throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        }
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }

      const result: FinancialStatementData = await response.json();
      
      // 각 행에 대해 is_parent와 child_paths 설정
      const enhancedRows = result.rows.map(row => {
        const isParent = isParentAccount(row.account_name);
        const childPaths = isParent ? getChildAccounts(row.account_name) : [];
        
        return {
          ...row,
          is_parent: isParent,
          child_paths: childPaths
        };
      });
      
      setFinancialData({
        ...result,
        rows: enhancedRows
      });
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('백엔드 서버에 연결할 수 없습니다.\n\n해결 방법:\n1. conanai_dsdcheck 폴더에서 서버를 실행해주세요\n2. 터미널에서: uvicorn app.main:app --host 0.0.0.0 --port 8001');
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`검증 중 오류가 발생했습니다: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleComparison = async () => {
    if (!file) {
      alert('엑셀 파일을 먼저 업로드해주세요.');
      return;
    }
    setLoading(true);
    setActiveTab('comparison');
    try {
      const formData = new FormData();
      formData.append('file', file);
      // compare-auto는 corp_name, year를 파일명에서 추출하므로 네오위즈/2024로 고정됨
      const response = await fetch('http://localhost:8086/compare-auto', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        if (response.status === 0 || !response.status) {
          throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
        }
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }
      const result: ComparisonResult[] = await response.json();
      setComparisonResults(result);
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('백엔드 서버에 연결할 수 없습니다.\n\n해결 방법:\n1. conanai_dsdcheck 폴더에서 서버를 실행해주세요\n2. 터미널에서: uvicorn app.main:app --host 0.0.0.0 --port 8001');
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`대사 중 오류가 발생했습니다: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getValidationStatusColor = (status: boolean | null) => {
    if (status === null) return '';
    return status ? styles.validMatch : styles.validMismatch;
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString();
  };

  const renderValidationItem = (item: ValidationResult, level: number = 0) => {
    return (
      <React.Fragment key={`${item.item}-${level}`}>
        <tr className={`${styles.validationRow} ${!item.is_match ? styles.mismatch : styles.match}`}>
          <td style={{ paddingLeft: `${level * 20 + 10}px` }}>
            {level > 0 && '└ '}{item.item}
          </td>
          <td className={styles.numberCell}>
            {item.expected?.toLocaleString() || '-'}
          </td>
          <td className={styles.numberCell}>
            {item.actual?.toLocaleString() || '-'}
          </td>
          <td className={styles.statusCell}>
            <span className={`${styles.status} ${item.is_match ? styles.success : styles.error}`}>
              {item.is_match ? '일치' : '불일치'}
            </span>
          </td>
        </tr>
        {item.children?.map(child => renderValidationItem(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <Layout>
      <PageHeader 
        title="Validation" 
        breadcrumbs={breadcrumbs}
        actions={
          <a href="#" className="btn-download">
            <i className='bx bxs-cloud-download bx-fade-down-hover'></i>
            <span className="text">Get PDF</span>
          </a>
        }
      />

      <div className={styles.container}>
        {/* File Upload Section */}
        <div className={styles.uploadSection}>
          <div className={styles.card}>
            <h3>엑셀 파일 업로드</h3>
            <div className={styles.uploadArea}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className={styles.fileInput}
                id="file-upload"
              />
              <label htmlFor="file-upload" className={styles.uploadLabel}>
                <i className='bx bx-cloud-upload'></i>
                <span>엑셀 파일을 선택하거나 드래그하세요</span>
              </label>
              {file && (
                <div className={styles.fileInfo}>
                  <i className='bx bx-file'></i>
                  <span>{file.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionSection}>
          <div className={styles.card}>
            <div className={styles.actionGrid}>
              <div className={styles.actionItem}>
                <h4>합계검증</h4>
                <p>자산·부채·자본 합계 일치 여부를 자동 검증하고 재무상태표를 시각화합니다.</p>
                <button 
                  onClick={handleFootingValidation}
                  disabled={loading}
                  className={`${styles.actionButton} ${styles.primary}`}
                >
                  {loading && activeTab === 'financial' ? (
                    <>
                      <i className='bx bx-loader-alt bx-spin'></i>
                      검증 중...
                    </>
                  ) : (
                    <>
                      <i className='bx bxs-check-shield'></i>
                      검증 시작하기
                    </>
                  )}
                </button>
              </div>
              <div className={styles.actionItem}>
                <h4>전기보고서 대사</h4>
                <p>DART API를 통해 전분기 보고서와 비교 검증합니다.</p>
                <button 
                  onClick={handleComparison}
                  disabled={loading}
                  className={`${styles.actionButton} ${styles.secondary}`}
                >
                  {loading && activeTab === 'comparison' ? (
                    <>
                      <i className='bx bx-loader-alt bx-spin'></i>
                      대사 중...
                    </>
                  ) : (
                    <>
                      <i className='bx bxs-analyse'></i>
                      대사 시작하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(footingResults || comparisonResults || financialData) && (
          <div className={styles.resultsSection}>
            {financialData && activeTab === 'financial' && (
              <div className={styles.card}>
                <div className={styles.resultHeader}>
                  <h3>재무상태표 및 합계검증 결과</h3>
                  <div className={styles.summary}>
                    <span className={styles.totalSheets}>시트: {financialData.title}</span>
                    <div className={styles.validationSummary}>
                      {Object.entries(financialData.validation_summary).map(([year, summary]) => (
                        <span key={year} className={styles.yearSummary}>
                          {year}: <span className={styles.success}>{summary.match}개 일치</span> / 
                          <span className={styles.error}>{summary.mismatch}개 불일치</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.financialTableContainer}>
                  <table className={styles.financialTable}>
                    <thead>
                      <tr>
                        <th className={styles.accountColumn}>계정과목</th>
                        {financialData.years.map(year => (
                          <th key={year} className={styles.amountColumn}>{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.rows.map((row, index) => (
                        <tr 
                          key={index} 
                          className={`${styles.financialRow}`}
                          onMouseEnter={(e) => handleRowHover(row, e)}
                          onMouseLeave={handleRowLeave}
                        >
                          <td 
                            className={`${styles.accountCell}`}
                            style={{ paddingLeft: `${row.indent_level * 20 + 10}px` }}
                          >
                            {row.account_name}
                          </td>
                          {financialData.years.map(year => (
                            <td 
                              key={year}
                              className={`${styles.amountCell} ${getValidationStatusColor(row.validation_status[year])} ${
                                isParentAccount(row.account_name) ? styles.parentAccountAmount : ''
                              } ${
                                isChildOfHoveredParent(row) ? styles.highlightedChildAmount : ''
                              }`}
                            >
                              {formatNumber(row.amounts[year])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.legend}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.validMatch}`}></div>
                    <span>합계검증 일치</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.validMismatch}`}></div>
                    <span>합계검증 불일치</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.noValidation}`}></div>
                    <span>검증 대상 아님</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.parentAccountLegend}`}></div>
                    <span>상위 계정 (합계) - 마우스 호버 시 하위 항목 표시</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.highlightedChildLegend}`}></div>
                    <span>하위 계정 (구성 항목)</span>
                  </div>
                </div>

                <div className={styles.usageInfo}>
                  <div className={styles.infoCard}>
                    <i className='bx bx-info-circle'></i>
                    <div>
                      <strong>사용법:</strong> 연두색으로 표시된 상위 계정 행에 마우스를 올리면, 
                      해당 계정을 구성하는 하위 계정들의 금액이 연노란색으로 하이라이트되며 
                      합계 공식이 툴팁으로 표시됩니다.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {footingResults && activeTab === 'footing' && (
              <div className={styles.card}>
                <div className={styles.resultHeader}>
                  <h3>재무제표 합계검증 결과</h3>
                  <div className={styles.summary}>
                    <span className={styles.totalSheets}>검증 시트: {footingResults.total_sheets}개</span>
                    <span className={`${styles.mismatchCount} ${footingResults.mismatch_count > 0 ? styles.error : styles.success}`}>
                      불일치 항목: {footingResults.mismatch_count}개
                    </span>
                  </div>
                </div>

                {footingResults.results.map((result, index) => (
                  <div key={index} className={styles.sheetResult}>
                    <h4>{result.title} ({result.sheet})</h4>
                    
                    {Object.entries(result.results_by_year).map(([year, items]) => (
                      <div key={year} className={styles.yearSection}>
                        <h5>{year}</h5>
                        <div className={styles.tableContainer}>
                          <table className={styles.validationTable}>
                            <thead>
                              <tr>
                                <th>계정과목</th>
                                <th>기대값</th>
                                <th>실제값</th>
                                <th>상태</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map(item => renderValidationItem(item))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {comparisonResults && activeTab === 'comparison' && (
              <div className={styles.card}>
                <div className={styles.resultHeader}>
                  <h3>전기보고서 대사 결과</h3>
                  <div className={styles.summary}>
                    <span className={styles.totalItems}>총 {comparisonResults.length}개 항목</span>
                    <span className={`${styles.mismatchCount} ${comparisonResults.filter(r => !r.is_match).length > 0 ? styles.error : styles.success}`}>
                      불일치 항목: {comparisonResults.filter(r => !r.is_match).length}개
                    </span>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.comparisonTable}>
                    <thead>
                      <tr>
                        <th>구분</th>
                        <th>재무제표</th>
                        <th>계정과목</th>
                        <th>업로드 파일</th>
                        <th>DART 데이터</th>
                        <th>차이</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.map((item, index) => (
                        <tr key={index} className={`${styles.comparisonRow} ${!item.is_match ? styles.mismatch : styles.match}`}>
                          <td>{item.fs_div}</td>
                          <td>{item.sj_div}</td>
                          <td>{item.account_nm}</td>
                          <td className={styles.numberCell}>{item.excel_amount?.toLocaleString() || '-'}</td>
                          <td className={styles.numberCell}>{item.dart_amount?.toLocaleString() || '-'}</td>
                          <td className={`${styles.numberCell} ${item.difference !== 0 ? styles.difference : ''}`}>
                            {item.difference?.toLocaleString() || '0'}
                          </td>
                          <td className={styles.statusCell}>
                            <span className={`${styles.status} ${item.is_match ? styles.success : styles.error}`}>
                              {item.is_match ? '일치' : '불일치'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltipData.show && (
        <Tooltip
          parentAccount={tooltipData.parentAccount}
          childAccounts={tooltipData.childAccounts}
          position={tooltipData.position}
        />
      )}
    </Layout>
  );
};

export default ValidationPage; 