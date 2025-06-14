"use client";

import React, { useState } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import styles from './validation.module.scss';

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

const ValidationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [corpName, setCorpName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'footing' | 'comparison' | null>(null);
  const [footingResults, setFootingResults] = useState<FootingResponse | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[] | null>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Validation', active: true }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Reset results when new file is uploaded
      setFootingResults(null);
      setComparisonResults(null);
      setActiveTab(null);
    }
  };

  const handleFootingValidation = async () => {
    if (!file) {
      alert('엑셀 파일을 먼저 업로드해주세요.');
      return;
    }

    setLoading(true);
    setActiveTab('footing');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/v1/dsdfooting/check-footing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('검증 요청이 실패했습니다.');
      }

      const result: FootingResponse = await response.json();
      setFootingResults(result);
    } catch (error) {
      console.error('Error:', error);
      alert('검증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleComparison = async () => {
    if (!file) {
      alert('엑셀 파일을 먼저 업로드해주세요.');
      return;
    }
    if (!corpName.trim()) {
      alert('기업명을 입력해주세요.');
      return;
    }

    setLoading(true);
    setActiveTab('comparison');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('corp_name', corpName);
      formData.append('year', year.toString());

      const response = await fetch('http://localhost:8000/compare', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('대사 요청이 실패했습니다.');
      }

      const result: ComparisonResult[] = await response.json();
      setComparisonResults(result);
    } catch (error) {
      console.error('Error:', error);
      alert('대사 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
                <p>자산·부채·자본 합계 일치 여부를 자동 검증합니다.</p>
                <button 
                  onClick={handleFootingValidation}
                  disabled={loading}
                  className={`${styles.actionButton} ${styles.primary}`}
                >
                  {loading && activeTab === 'footing' ? (
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
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    placeholder="기업명 (예: LG화학)"
                    value={corpName}
                    onChange={(e) => setCorpName(e.target.value)}
                    className={styles.textInput}
                  />
                  <input
                    type="number"
                    placeholder="연도"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className={styles.numberInput}
                    min="2000"
                    max="2030"
                  />
                </div>
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
        {(footingResults || comparisonResults) && (
          <div className={styles.resultsSection}>
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
    </Layout>
  );
};

export default ValidationPage; 