"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import * as XLSX from 'xlsx';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import styles from './trends.module.scss';
import PrimaryButton from '@/shared/components/PrimaryButton';

// Types
interface Company {
  corp_name: string;
  corp_code: string;
}

interface CompaniesResponse {
  companies: Company[];
}

interface KpiItem {
  kpi_name: string;
  value: string;
  unit: string;
  category: string;
  formula: string;
}

interface KpiResponse {
  company_name: string;
  corp_code: string;
  bsns_year: string;
  reprt_code: string;
  categories: Record<string, KpiItem[]>;
  total_kpi_count: number;
}

interface Report {
  rcept_no: string;
  corp_cls: string;
  corp_name: string;
  corp_code: string;
  stock_code: string;
  report_nm: string;
  rcept_dt: string;
  flr_nm: string;
  rm: string;
}

interface CompanyAnalysisData {
  company: Company;
  kpiData: KpiResponse | null;
  selectedReport: Report;
  error?: string;
}

interface SelectedInfo {
  company: Company;
  reports: Report[];
  selectedReport: Report | null;
  isLoadingReports: boolean;
  error?: string;
}

// API Functions
const API_BASE_URL = 'http://localhost:9007';

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const fetchCompanies = async (): Promise<CompaniesResponse> => {
  const response = await fetch(`${API_BASE_URL}/kpi/companies`);
  if (!response.ok) {
    throw new Error('백엔드 서버에 연결할 수 없습니다. KPI 비교 서버가 실행 중인지 확인해주세요.');
  }
  return response.json();
};

const searchCompanies = async (query: string) => {
  const response = await fetch(`${API_BASE_URL}/kpi/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('기업 검색에 실패했습니다.');
  }
  return response.json();
};

const fetchReports = async (corpCode: string): Promise<Report[]> => {
  const response = await fetch(`${API_BASE_URL}/kpi/${corpCode}/reports`);
  if (!response.ok) {
    throw new Error(`보고서 데이터를 불러올 수 없습니다: ${corpCode}`);
  }
  return response.json();
};

const fetchKpi = async (corpCode: string, rceptNo: string, bsnsYear: string, reprtCode: string): Promise<KpiResponse> => {
  const response = await fetch(`${API_BASE_URL}/kpi/${corpCode}/report/${rceptNo}/kpi?bsns_year=${bsnsYear}&reprt_code=${reprtCode}`);
  if (!response.ok) {
    throw new Error(`KPI 데이터를 불러올 수 없습니다: ${corpCode}`);
  }
  return response.json();
};

// Utility Functions
const calculateFinancialScores = (kpiData: KpiResponse) => {
  const getKpiValue = (category: string, kpiName: string): number => {
    const items = kpiData.categories[category] || [];
    const item = items.find(kpi => kpi.kpi_name.includes(kpiName));
    if (!item || item.value.includes('N/A') || item.value.includes('데이터')) return 0;
    
    const numValue = parseFloat(item.value.replace(/,/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  };

  // 성장성 점수 (0-100)
  const revenueGrowth = getKpiValue('Growth', '매출액증가율');
  const operatingGrowth = getKpiValue('Growth', '영업이익증가율');
  const growthScore = Math.max(0, Math.min(100, ((revenueGrowth + operatingGrowth) / 2) + 50));

  // 수익성 점수 (0-100)  
  const operatingMargin = getKpiValue('Profitability', '영업이익률');
  const netMargin = getKpiValue('Profitability', '순이익률');
  const roe = getKpiValue('Profitability', 'ROE');
  const profitabilityScore = Math.max(0, Math.min(100, (operatingMargin + netMargin + roe / 2) * 2));

  // 안정성 점수 (0-100)
  const debtRatio = getKpiValue('Stability', '부채비율');
  const currentRatio = getKpiValue('Stability', '유동비율');
  const stabilityScore = Math.max(0, Math.min(100, (200 - debtRatio / 2 + currentRatio / 2) / 2));

  return {
    growth: Math.round(growthScore),
    profitability: Math.round(profitabilityScore),
    stability: Math.round(stabilityScore),
  };
};

const formatKpiValue = (value: string, unit: string): string => {
  if (value.includes('N/A') || value.includes('데이터')) return value;
  
  const numValue = parseFloat(value.replace(/,/g, ''));
  if (isNaN(numValue)) return value;
  
  if (unit === '%') {
    return `${numValue.toFixed(2)}%`;
  } else if (unit === '백만원') {
    return `${(numValue/1000).toFixed(0)}억원`;
  } else if (unit === '회') {
    return `${numValue.toFixed(2)}회`;
  }
  
  return `${numValue.toLocaleString()}${unit}`;
};

// 한글 초성 추출 함수
const getInitialConsonant = (char: string): string => {
  const code = char.charCodeAt(0) - 44032;
  if (code < 0 || code > 11171) return char;
  const initial = Math.floor(code / 588);
  const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  return initials[initial];
};

// Components
const AutoCompleteSearch: React.FC<{
  onCompanySelect: (company: Company) => void;
  selectedCompanies: Company[];
  companies: Company[];
}> = ({ onCompanySelect, selectedCompanies, companies }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const filterCompanies = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredCompanies([]);
      return;
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    const results = companies.filter(company => {
      const name = company.corp_name.toLowerCase();
      
      // 일반 텍스트 검색
      if (name.includes(normalizedQuery)) return true;
      
      // 초성 검색
      if (normalizedQuery.length === 1) {
        const queryInitial = normalizedQuery;
        const nameInitials = company.corp_name.split('').map(getInitialConsonant).join('');
        if (nameInitials.includes(queryInitial)) return true;
      }
      
      return false;
    });

    setFilteredCompanies(results.slice(0, 10)); // 최대 10개 결과
  }, [companies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    filterCompanies(value);
    setIsOpen(true);
  };

  const handleCompanySelect = (company: Company) => {
    if (selectedCompanies.length >= 5) {
      alert('최대 5개 기업까지만 선택할 수 있습니다.');
      return;
    }
    
    if (selectedCompanies.some(c => c.corp_code === company.corp_code)) {
      alert('이미 선택된 기업입니다.');
      return;
    }

    onCompanySelect(company);
    setQuery('');
    setFilteredCompanies([]);
    setIsOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <i className='bx bx-search'></i>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="기업명 검색 (예: ㄴ, 네이버, 넥슨...)"
          className={styles.searchInput}
        />
      </div>
      
      {isOpen && filteredCompanies.length > 0 && (
        <div className={styles.searchDropdown}>
          {filteredCompanies.map((company) => (
            <div
              key={company.corp_code}
              className={styles.searchItem}
              onClick={() => {
                handleCompanySelect(company);
                setIsOpen(false);
              }}
            >
              <div className={styles.companyDetails}>
                <span className={styles.companyName}>{company.corp_name}</span>
                <span className={styles.companyCode}>{company.corp_code}</span>
              </div>
              <span className={styles.gameLabel}>게임</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReportSelectionPanel: React.FC<{
  selectedEntries: SelectedInfo[];
  onReportSelect: (corpCode: string, rceptNo: string) => void;
}> = ({ selectedEntries, onReportSelect }) => {
  if (selectedEntries.length === 0) {
    return null;
  }

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3>
          <i className='bx bxs-file-doc'></i>
          사업보고서 선택
        </h3>
        <p>분석을 원하는 기업별 사업보고서를 선택하세요.</p>
      </div>
      <div className={styles.reportSelectionList}>
        {selectedEntries.map((entry, idx) => (
          <div key={entry.selectedReport ? entry.company.corp_code + '_' + entry.selectedReport.rcept_no : entry.company.corp_code + '_none_' + idx} className={styles.reportSelectionItem}>
            <span className={styles.reportSelectionCompany}>{entry.company.corp_name}</span>
            <div className={styles.reportSelectionDropdown}>
              {entry.isLoadingReports ? (
                <div className={styles.reportLoading}>
                  <i className='bx bx-loader-alt bx-spin'></i>
                  <span>보고서 로딩중...</span>
                </div>
              ) : entry.error ? (
                <span className={styles.reportError}>{entry.error}</span>
              ) : entry.reports.length > 0 ? (
                <select
                  value={entry.selectedReport?.rcept_no || ''}
                  onChange={(e) => onReportSelect(entry.company.corp_code, e.target.value)}
                  className={styles.reportSelect}
                  style={{ width: 220, minWidth: 220, maxWidth: 220 }}
                >
                  <option value="" disabled>사업보고서를 선택하세요</option>
                  {entry.reports.map(report => {
                    const businessYearMatch = report.report_nm.match(/\((\d{4})/);
                    const businessYear = businessYearMatch ? businessYearMatch[1] : 'N/A';
                    const reportTitle = report.report_nm.split('(')[0].trim();

                    return (
                      <option key={report.rcept_no} value={report.rcept_no}>
                        {`${reportTitle} (${businessYear}.12)`}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <span>사용 가능한 사업보고서가 없습니다.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SelectedCompaniesPanel: React.FC<{
  selectedEntries: SelectedInfo[];
  onRemove: (idx: number) => void;
  onAnalyze: () => void;
}> = ({ selectedEntries, onRemove, onAnalyze }) => {
  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3>
          <i className='bx bxs-analyse'></i>
          선택된 분석 항목 ({selectedEntries.length}/5)
        </h3>
        <p>분석할 기업과 보고서를 확인하고 분석을 시작하세요</p>
      </div>

      {selectedEntries.length > 0 && (
        <div className={styles.selectedCompanies}>
          {selectedEntries.map((entry, idx) => {
            const businessYearMatch = entry.selectedReport?.report_nm.match(/\((\d{4})/);
            const displayYear = businessYearMatch ? ` (${businessYearMatch[1]}.12)` : '';

            return (
              <div key={entry.selectedReport ? entry.company.corp_code + '_' + entry.selectedReport.rcept_no : entry.company.corp_code + '_none_' + idx} className={styles.selectedCompany}>
                <span className={styles.companyName}>
                  {entry.company.corp_name}
                  {displayYear}
                </span>
                <button
                  onClick={() => onRemove(idx)}
                  className={styles.removeButton}
                  title="제거"
                >
                  <i className='bx bx-x'></i>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.analyzeActions}>
        <button
          onClick={onAnalyze}
          disabled={selectedEntries.length === 0 || selectedEntries.some(e => !e.selectedReport)}
          className={styles.analyzeButton}
        >
          <i className='bx bxs-bar-chart-alt-2'></i>
          KPI 분석 시작
        </button>
      </div>
    </div>
  );
};

const RadarChartAnalysis: React.FC<{
  analysisData: CompanyAnalysisData[];
}> = ({ analysisData }) => {
  const chartData = useMemo(() => {
    const metrics = ['성장성', '수익성', '안정성'];
    return metrics.map(metric => {
      const dataPoint: any = { metric };
      
      analysisData.forEach(({ company, kpiData }) => {
        if (kpiData) {
          const scores = calculateFinancialScores(kpiData);
          switch(metric) {
            case '성장성': dataPoint[company.corp_name] = scores.growth; break;
            case '수익성': dataPoint[company.corp_name] = scores.profitability; break;
            case '안정성': dataPoint[company.corp_name] = scores.stability; break;
          }
        }
      });
      
      return dataPoint;
    });
  }, [analysisData]);

  const colors = [
    '#173e92', // Navy
    '#c0392b', // Deep Red
    '#218c5a', // Deep Green
    '#b9770e', // Deep Orange
    '#5e548e', // Deep Purple
  ];

  const tooltipContent = (
    <>
      <strong>종합 평가 기준:</strong>
      <br />
      각 점수는 0점에서 100점 사이로 환산됩니다.
      <br /><br />
      - <strong>성장성:</strong> 매출액증가율과 영업이익증가율을 기반으로 평가합니다.
      <br />
      - <strong>수익성:</strong> 영업이익률, 순이익률, 자기자본이익률(ROE)을 종합하여 평가합니다.
      <br />
      - <strong>안정성:</strong> 부채비율과 유동비율을 바탕으로 재무 구조의 안정성을 평가합니다.
    </>
  );

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3>
          <i className='bx bxs-radar'></i>
          재무건전성 종합 분석
        </h3>
        <div className={styles.sectionDescription}>
          <p>성장성, 수익성, 안정성 3개 영역 종합 평가</p>
          <div className={styles.infoTooltipContainer}>
            <i className='bx bx-help-circle'></i>
            <div className={styles.infoTooltip}>{tooltipContent}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={false}
            />
            {analysisData.filter(item => item.kpiData).map(({ company }, index) => (
              <Radar
                key={company.corp_code}
                name={company.corp_name}
                dataKey={company.corp_name}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
                strokeWidth={2.5}
              />
            ))}
            <RechartsTooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const KpiTable: React.FC<{
  analysisData: CompanyAnalysisData[];
  activeCategory: string;
  selectedEntries: SelectedInfo[];
}> = ({ analysisData, activeCategory, selectedEntries }) => {
  
  const exportToExcel = () => {
    const companiesWithData = analysisData.filter(item => item.kpiData);
    if (companiesWithData.length === 0) return;

    const kpiItems = companiesWithData[0].kpiData?.categories[activeCategory] || [];
    
    const excelData = kpiItems.map(kpiItem => {
      const row: any = { '재무지표': kpiItem.kpi_name };
      
      companiesWithData.forEach(({ company, kpiData }) => {
        const companyKpi = kpiData?.categories[activeCategory]?.find(k => k.kpi_name === kpiItem.kpi_name);
        row[company.corp_name] = companyKpi ? formatKpiValue(companyKpi.value, companyKpi.unit) : 'N/A';
      });
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${activeCategory} KPI`);
    
    const fileName = `게임업계_${activeCategory}_KPI분석_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const companiesWithData = analysisData.filter(item => item.kpiData);
  if (companiesWithData.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.noData}>
          <i className='bx bx-info-circle'></i>
          <p>분석할 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  const kpiItems = companiesWithData[0].kpiData?.categories[activeCategory] || [];

  return (
    <div className={styles.card} style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#173e92' }}>KPI 상세 분석</div>
        <PrimaryButton small onClick={exportToExcel}>엑셀 저장</PrimaryButton>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, color: '#374151' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: '#173e92', borderBottom: '1px solid #e9ecef' }}>카테고리</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: '#173e92', borderBottom: '1px solid #e9ecef' }}>재무지표</th>
            {companiesWithData.map(entry => (
              <th key={entry.company.corp_code} style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: '#173e92', borderBottom: '1px solid #e9ecef' }}>{entry.company.corp_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['Growth', 'Profitability', 'Stability', 'Activity', 'Cashflow'].map(category => (
            kpiCategoryRows(category, selectedEntries, analysisData)
          ))}
        </tbody>
      </table>
    </div>
  );
};

function kpiCategoryRows(
  category: string,
  selectedEntries: SelectedInfo[],
  analysisData: CompanyAnalysisData[]
) {
  const categoryLabels: Record<string, string> = {
    Growth: '성장성',
    Profitability: '수익성',
    Stability: '안정성',
    Activity: '활동성',
    Cashflow: '현금흐름',
  };
  const kpiNames: string[] = (analysisData[0]?.kpiData?.categories[category] || []).map((kpi: KpiItem) => kpi.kpi_name);
  if (!kpiNames.length) return null;
  return [
    <tr key={category + '-header'} style={{ background: '#f9fafb' }}>
      <td colSpan={2 + selectedEntries.length} style={{ fontWeight: 700, color: '#374151', padding: '10px 12px', borderBottom: '1px solid #e9ecef' }}>{categoryLabels[category]}</td>
    </tr>,
    ...kpiNames.map((kpiName: string, idx: number) => (
      <tr key={category + '-' + kpiName}>
        <td style={{ padding: '10px 12px', borderBottom: '1px solid #e9ecef' }}></td>
        <td style={{ padding: '10px 12px', borderBottom: '1px solid #e9ecef', color: '#374151', fontWeight: 400 }}>{kpiName}</td>
        {selectedEntries.map((entry: SelectedInfo) => {
          const kpi = analysisData.find((d: CompanyAnalysisData) => d.company.corp_code === entry.company.corp_code)?.kpiData?.categories[category]?.find((k: KpiItem) => k.kpi_name === kpiName);
          return (
            <td key={entry.selectedReport ? entry.company.corp_code + '_' + entry.selectedReport.rcept_no : entry.company.corp_code + '_none_' + idx} style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid #e9ecef', color: '#173e92', fontWeight: 600 }}>
              {kpi ? formatKpiValue(kpi.value, kpi.unit) : '-'}
            </td>
          );
        })}
      </tr>
    ))
  ]; 
}

const AnalysisDashboard: React.FC<{
  analysisData: CompanyAnalysisData[];
  selectedEntries: SelectedInfo[];
  setCurrentView: (view: 'selection' | 'analysis') => void;
}> = ({ analysisData, selectedEntries, setCurrentView }) => {
  const categories = [
    { key: 'Growth', label: '성장성', icon: 'bx-trending-up' },
    { key: 'Profitability', label: '수익성', icon: 'bxs-coin' },
    { key: 'Stability', label: '안정성', icon: 'bxs-shield' },
    { key: 'Activity', label: '활동성', icon: 'bx-refresh' },
    { key: 'Cashflow', label: '현금흐름', icon: 'bxs-bank' }
  ];
  const [activeCategory, setActiveCategory] = useState('Growth');

  const analysisSubjects = analysisData.map(({ company, selectedReport }) => {
    const businessYearMatch = selectedReport.report_nm.match(/\((\d{4})/);
    const displayYear = businessYearMatch ? `(${businessYearMatch[1]}.12)` : '';
    return `${company.corp_name} ${displayYear}`;
  }).join(', ');

  return (
    <div className={styles.analysisContainer}>
      <div style={{
        background: '#fff',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(16,24,40,0.06)',
        borderRadius: 0,
        padding: '22px 32px 18px 32px',
        marginBottom: 0,
        maxWidth: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <button
            onClick={() => setCurrentView('selection')}
            aria-label="뒤로가기"
            style={{ background: 'none', border: 'none', padding: 0, marginRight: 12, cursor: 'pointer', verticalAlign: 'middle', display: 'flex', alignItems: 'center' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 20L8 12L16 4" stroke="#173e92" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontSize: '1.7rem', fontWeight: 800, color: '#222', marginLeft: 2 }}>KPI Trends</span>
        </div>
        <div style={{ color: '#374151', fontSize: '1rem', fontWeight: 400, marginBottom: 0, marginLeft: 36 }}>
          {selectedEntries.map((entry, idx) => {
            const businessYearMatch = entry.selectedReport?.report_nm.match(/\((\d{4})/);
            const displayYear = businessYearMatch ? ` (${businessYearMatch[1]}.12)` : '';
            return (
              <span key={entry.selectedReport ? entry.company.corp_code + '_' + entry.selectedReport.rcept_no : entry.company.corp_code + '_none_' + idx} style={{ color: '#173e92', fontWeight: 600, fontSize: 15, padding: '6px 14px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                {entry.company.corp_name}{displayYear}
              </span>
            );
          })}
        </div>
      </div>
      
      {analysisData.filter(d => d.kpiData).length === 0 ? (
        <div className={styles.noData}>
          <i className='bx bx-info-circle'></i>
          <p>분석할 데이터가 없습니다.</p>
          <p>선택하신 보고서의 KPI 데이터를 불러오지 못했습니다.</p>
        </div>
      ) : (
        <>
          <RadarChartAnalysis analysisData={analysisData} />
          <KpiTable analysisData={analysisData} activeCategory={activeCategory} selectedEntries={selectedEntries} />
        </>
      )}
    </div>
  );
};

// Main Component with Query Support
const TrendsPageContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'selection' | 'analysis'>('selection');
  const [selectedEntries, setSelectedEntries] = useState<SelectedInfo[]>([]);
  const [analysisData, setAnalysisData] = useState<CompanyAnalysisData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Financial Trends', active: true }
  ];

  // 기업 목록 조회
  const { data: companiesData, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  // State for search input and filtered companies
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter companies logic (from AutoCompleteSearch)
  const filterCompanies = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFilteredCompanies([]);
      return;
    }
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const results = (companiesData?.companies || []).filter(company => {
      const name = company.corp_name.toLowerCase();
      if (name.includes(normalizedQuery)) return true;
      if (normalizedQuery.length === 1) {
        const queryInitial = normalizedQuery;
        const nameInitials = company.corp_name.split('').map(getInitialConsonant).join('');
        if (nameInitials.includes(queryInitial)) return true;
      }
      return false;
    });
    setFilteredCompanies(results.slice(0, 10));
  }, [companiesData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    filterCompanies(value);
    setIsSearchOpen(true);
  };

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render search results inline
  function renderSearchResults() {
    if (!isSearchOpen || filteredCompanies.length === 0) return null;
    return (
      <div style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        background: '#fff',
        border: '1px solid #e9ecef',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(16,24,40,0.06)',
        borderRadius: 0,
        maxHeight: 240,
        overflowY: 'auto',
      }}>
        {filteredCompanies.map(company => (
          <div
            key={company.corp_code}
            style={{ padding: '12px 16px', cursor: 'pointer', color: '#374151', fontSize: 15, borderBottom: '1px solid #f3f4f6' }}
            onClick={() => {
              handleCompanySelect(company);
              setIsSearchOpen(false);
              setSearchQuery(company.corp_name);
            }}
          >
            {company.corp_name}
          </div>
        ))}
      </div>
    );
  }

  // Render report selection inline
  function renderReportSelection() {
    if (selectedEntries.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {selectedEntries.map((entry, idx) => (
          <div key={entry.selectedReport ? entry.company.corp_code + '_' + entry.selectedReport.rcept_no : entry.company.corp_code + '_none_' + idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#173e92', fontWeight: 600, fontSize: 15, minWidth: 80 }}>{entry.company.corp_name}</span>
            {entry.isLoadingReports ? (
              <span style={{ color: '#374151', fontSize: 15 }}>보고서 로딩중...</span>
            ) : entry.error ? (
              <span style={{ color: '#e74c3c', fontSize: 15 }}>{entry.error}</span>
            ) : entry.reports.length > 0 ? (
              <select
                value={entry.selectedReport?.rcept_no || ''}
                onChange={(e) => handleReportSelect(idx, e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 0, fontSize: 15, color: '#374151', background: '#fff', width: 220, minWidth: 220, maxWidth: 220 }}
              >
                <option value="" disabled>사업보고서를 선택하세요</option>
                {entry.reports.map(report => {
                  const businessYearMatch = report.report_nm.match(/\((\d{4})/);
                  const businessYear = businessYearMatch ? businessYearMatch[1] : 'N/A';
                  const reportTitle = report.report_nm.split('(')[0].trim();
                  return (
                    <option key={report.rcept_no} value={report.rcept_no}>
                      {`${reportTitle} (${businessYear}.12)`}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span style={{ color: '#374151', fontSize: 15 }}>사용 가능한 사업보고서가 없습니다.</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render selected analysis inline
  function renderSelectedAnalysis() {
    if (selectedEntries.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {selectedEntries.map((entry, idx) => {
          const businessYearMatch = entry.selectedReport?.report_nm.match(/\((\d{4})/);
          const displayYear = businessYearMatch ? ` (${businessYearMatch[1]}.12)` : '';
          return (
            <span key={entry.selectedReport ? entry.company.corp_code + '_' + entry.selectedReport.rcept_no : entry.company.corp_code + '_none_' + idx} style={{ background: '#f3f4f6', color: '#173e92', fontWeight: 600, fontSize: 15, padding: '6px 14px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              {entry.company.corp_name}{displayYear}
            </span>
          );
        })}
      </div>
    );
  }

  const handleCompanySelect = async (company: Company) => {
    if (selectedEntries.length >= 5) {
      setShowLimitModal(true);
      return;
    }
    // prevent duplicate null entry for same company
    if (selectedEntries.some(e => e.company.corp_code === company.corp_code && !e.selectedReport)) {
      setShowDuplicateModal(true);
      return;
    }
    let reports: Report[] = [];
    try {
      reports = await fetchReports(company.corp_code);
    } catch (error) {
      setSelectedEntries(prev => [...prev, {
        company,
        reports: [],
        selectedReport: null,
        isLoadingReports: false,
        error: '보고서를 불러올 수 없습니다.'
      }]);
      return;
    }
    const businessReports = reports.filter(r => {
      if (!r.report_nm.includes('사업보고서')) return false;
      const match = r.report_nm.match(/\((\d{4})/);
      if (!match) return false;
      const businessYear = parseInt(match[1], 10);
      const currentYear = new Date().getFullYear();
      return businessYear < currentYear;
    });
    if (businessReports.length === 0) {
      setSelectedEntries(prev => [...prev, {
        company,
        reports: [],
        selectedReport: null,
        isLoadingReports: false,
        error: '사업보고서가 없습니다.'
      }]);
      return;
    }
    const defaultReport = businessReports[0];
    const key = company.corp_code + '_' + defaultReport.rcept_no;
    if (selectedEntries.some(e => e.company.corp_code + '_' + (e.selectedReport?.rcept_no || 'none') === key)) {
      setShowDuplicateModal(true);
      return;
    }
    setSelectedEntries(prev => [...prev, {
      company,
      reports: businessReports,
      selectedReport: defaultReport,
      isLoadingReports: false
    }]);
  };

  const handleCompanyRemove = (idx: number) => {
    setSelectedEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleReportSelect = (entryIdx: number, rceptNo: string) => {
    setSelectedEntries(prev => {
      const entry = prev[entryIdx];
      const selectedReport = entry.reports.find(r => r.rcept_no === rceptNo) || null;
      const newKey = entry.company.corp_code + '_' + (selectedReport?.rcept_no || 'none');
      // 중복 체크
      if (prev.some((e, idx) => idx !== entryIdx && e.company.corp_code + '_' + (e.selectedReport?.rcept_no || 'none') === newKey)) {
        setShowDuplicateModal(true);
        return prev;
      }
      // update only this entry
      return prev.map((e, idx) => idx === entryIdx ? { ...e, selectedReport } : e);
    });
  };

  const handleAnalyze = async () => {
    if (selectedEntries.some(e => !e.selectedReport)) {
      alert('모든 기업의 분석할 사업보고서를 선택해주세요.');
      return;
    }
    setIsAnalyzing(true);
    setCurrentView('analysis');
    try {
      const analysisResults: CompanyAnalysisData[] = await Promise.all(
        selectedEntries.map(async (entry) => {
          if (!entry.selectedReport) {
            // This case should not be reached due to the check above, but for type safety
            return {
              company: entry.company,
              kpiData: null,
              selectedReport: {} as Report,
              error: `보고서가 선택되지 않았습니다.`
            };
          }
          try {
            const businessYearMatch = entry.selectedReport.report_nm.match(/\((\d{4})/);
            const businessYear = businessYearMatch ? businessYearMatch[1] : entry.selectedReport.rcept_dt.substring(0, 4);
            const kpiData = await fetchKpi(
              entry.company.corp_code, 
              entry.selectedReport.rcept_no, 
              businessYear, 
              '11011'
            );
            return {
              company: entry.company,
              kpiData,
              selectedReport: entry.selectedReport,
            };
          } catch (kpiError) {
            console.warn(`KPI 데이터 로딩 실패: ${entry.company.corp_name}`, kpiError);
            return {
              company: entry.company,
              kpiData: null,
              selectedReport: entry.selectedReport,
              error: `KPI 데이터 로딩 실패`
            };
          }
        })
      );
      setAnalysisData(analysisResults);
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setCurrentView('selection');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setCurrentView('selection');
    setAnalysisData([]);
  };

  if (isLoading) {
    return (
      <Layout>
        <PageHeader title="Financial Trends" breadcrumbs={breadcrumbs} />
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className='bx bx-loader-alt bx-spin'></i>
            <h3>게임업계 기업 데이터를 불러오는 중...</h3>
            <p>잠시만 기다려주세요</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageHeader title="Financial Trends" breadcrumbs={breadcrumbs} />
        <div className={styles.container}>
          <div className={styles.error}>
            <i className='bx bx-error'></i>
            <div>
              <h3>서버 연결 오류</h3>
              <p>KPI 비교 서버(localhost:9007)에 연결할 수 없습니다.</p>
              <p>백엔드 서버가 실행 중인지 확인해주세요.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isAnalyzing) {
    return (
      <Layout>
        <PageHeader title="Financial Trends" breadcrumbs={breadcrumbs} />
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className='bx bx-loader-alt bx-spin'></i>
            <h3>재무 데이터를 분석하는 중...</h3>
            <p>DART 공시 데이터를 기반으로 KPI를 계산하고 있습니다.</p>
            <p>최대 1분 정도 소요될 수 있습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        {currentView === 'selection' && (
          <>
            {/* Header Card with Breadcrumbs */}
            <div className={styles.card} style={{ marginTop: 8 }}>
              <div className={styles.breadcrumbs}>
                <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>KPI Trends</span>
              </div>
              <h2 className={styles.cardTitle} style={{ color: '#222' }}>KPI Trends</h2>
              <p style={{ color: '#374151', fontSize: 16 }}>
                게임업계 상장기업의 재무건전성을 종합 분석합니다. 성장성, 수익성, 안정성 등 핵심 KPI를 통해 객관적인 재무 비교가 가능합니다.
              </p>
              <div style={{ display: 'flex', gap: 32, marginTop: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#173e92' }}>{companiesData?.companies?.length || 0}</span><br/>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>분석 대상 기업</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#173e92' }}>9</span><br/>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>핵심 재무지표</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#173e92' }}>5</span><br/>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>분석 카테고리</span>
                </div>
              </div>
            </div>

            {/* 3-card vertical stack, all with unified design */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 0 }}>
              {/* 기업 검색 및 선택 */}
              <div className={styles.card} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                  <h3 style={{ color: '#173e92', fontWeight: 700, fontSize: 20, margin: 0 }}>기업 검색 및 선택</h3>
                  <span style={{ color: '#374151', fontSize: 15, fontWeight: 400 }}>분석할 게임회사를 검색하고 선택하세요 (최대 5개)</span>
                </div>
                <div style={{ position: 'relative' }} ref={searchRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="기업명 검색 (예: ㄴ, 네이버, 넥슨...)"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e9ecef',
                      borderRadius: 0,
                      fontSize: 15,
                      color: '#374151',
                      marginBottom: 0,
                      outline: 'none',
                      fontWeight: 400,
                      background: '#fff',
                      boxSizing: 'border-box',
                      marginTop: 8
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                  />
                  {/* 검색 결과 드롭다운 */}
                  {isSearchOpen && filteredCompanies.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #e9ecef',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(16,24,40,0.06)',
                      borderRadius: 0,
                      maxHeight: 240,
                      overflowY: 'auto',
                    }}>
                      {filteredCompanies.map(company => (
                        <div
                          key={company.corp_code}
                          style={{ padding: '12px 16px', cursor: 'pointer', color: '#374151', fontSize: 15, borderBottom: '1px solid #f3f4f6' }}
                          onClick={() => {
                            handleCompanySelect(company);
                            setIsSearchOpen(false);
                            setSearchQuery(company.corp_name);
                          }}
                        >
                          {company.corp_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* 사업보고서 선택 */}
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                  <h3 style={{ color: '#173e92', fontWeight: 700, fontSize: 20, margin: 0 }}>사업보고서 선택</h3>
                  <span style={{ color: '#374151', fontSize: 15, fontWeight: 400 }}>분석을 원하는 기업별 사업보고서를 선택하세요.</span>
                </div>
                {renderReportSelection()}
              </div>
              {/* 선택된 분석 항목 */}
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                  <h3 style={{ color: '#173e92', fontWeight: 700, fontSize: 20, margin: 0 }}>선택된 분석 항목 ({selectedEntries.length}/5)</h3>
                  <span style={{ color: '#374151', fontSize: 15, fontWeight: 400 }}>분석할 기업과 보고서를 확인하고 분석을 시작하세요</span>
                </div>
                {renderSelectedAnalysis()}
                <button
                  onClick={handleAnalyze}
                  disabled={selectedEntries.length === 0 || selectedEntries.some(e => !e.selectedReport)}
                  style={{
                    background: '#173e92',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 0,
                    fontWeight: 600,
                    fontSize: 15,
                    padding: '12px 24px',
                    marginTop: 16,
                    cursor: selectedEntries.length === 0 || selectedEntries.some(e => !e.selectedReport) ? 'not-allowed' : 'pointer',
                    opacity: selectedEntries.length === 0 || selectedEntries.some(e => !e.selectedReport) ? 0.5 : 1,
                    boxShadow: selectedEntries.length === 0 || selectedEntries.some(e => !e.selectedReport) ? 'none' : '0 2px 8px rgba(16,24,40,0.06)'
                  }}
                >KPI 분석 시작</button>
              </div>
            </div>
          </>
        )}
        {currentView === 'analysis' && (
          <div className={styles.card} style={{ marginTop: 32 }}>
            <div className={styles.breadcrumbs}>
              <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>Dashboard</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbLink} style={{ color: '#6b7280', fontWeight: 500 }}>KPI Trends</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>분석 결과</span>
            </div>
            <AnalysisDashboard
              analysisData={analysisData}
              selectedEntries={selectedEntries}
              setCurrentView={setCurrentView}
            />
          </div>
        )}
        {showLimitModal && (
          <div style={{
            position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(16,24,40,0.12)', padding: '32px 36px', minWidth: 320, textAlign: 'center', border: '1px solid #e9ecef' }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#173e92', marginBottom: 12 }}>기업 선택 안내</div>
              <div style={{ color: '#374151', fontSize: 16, marginBottom: 24 }}>
                기업은 최대 5개까지 선택 가능합니다.<br/>
                추가로 선택하시려면 기존 선택 중 일부를 해제해 주세요.<br/>
                항상 관심을 가져주셔서 감사드립니다.
              </div>
              <button onClick={() => setShowLimitModal(false)} style={{ background: '#173e92', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 15, padding: '10px 28px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,24,40,0.06)' }}>
                확인
              </button>
            </div>
          </div>
        )}
        {showDuplicateModal && (
          <div style={{
            position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(16,24,40,0.12)', padding: '32px 36px', minWidth: 320, textAlign: 'center', border: '1px solid #e9ecef' }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#173e92', marginBottom: 12 }}>중복 선택 안내</div>
              <div style={{ color: '#374151', fontSize: 16, marginBottom: 24 }}>
                동일한 기업과 사업연도 조합은 한 번만 선택할 수 있습니다.<br/>
                다른 연도의 사업보고서를 선택하거나 기존 선택을 해제해 주세요.<br/>
                감사합니다.
              </div>
              <button onClick={() => setShowDuplicateModal(false)} style={{ background: '#173e92', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 15, padding: '10px 28px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,24,40,0.06)' }}>
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Wrapper Component with QueryClientProvider
const TrendsPage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TrendsPageContent />
    </QueryClientProvider>
  );
};

export default TrendsPage;
