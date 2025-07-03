"use client";

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import * as XLSX from 'xlsx';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import styles from './trends.module.scss';

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
  reports: Report[];
  kpiData: KpiResponse | null;
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
              onClick={() => handleCompanySelect(company)}
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

const SelectedCompaniesPanel: React.FC<{
  selectedCompanies: Company[];
  onRemove: (company: Company) => void;
  onAnalyze: () => void;
}> = ({ selectedCompanies, onRemove, onAnalyze }) => {
  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3>
          <i className='bx bxs-analyse'></i>
          선택된 기업 ({selectedCompanies.length}/5)
        </h3>
        <p>분석할 기업을 선택하고 KPI 분석을 시작하세요</p>
      </div>

      {selectedCompanies.length > 0 && (
        <div className={styles.selectedCompanies}>
          {selectedCompanies.map((company) => (
            <div key={company.corp_code} className={styles.selectedCompany}>
              <span className={styles.companyName}>{company.corp_name}</span>
              <button
                onClick={() => onRemove(company)}
                className={styles.removeButton}
                title="제거"
              >
                <i className='bx bx-x'></i>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.analyzeActions}>
        <button
          onClick={onAnalyze}
          disabled={selectedCompanies.length === 0}
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

  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3>
          <i className='bx bxs-radar'></i>
          재무건전성 종합 분석
        </h3>
        <p>성장성, 수익성, 안정성 3개 영역 종합 평가</p>
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
                fillOpacity={0.1}
                strokeWidth={2}
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
}> = ({ analysisData, activeCategory }) => {
  
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
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h3>
          <i className='bx bxs-report'></i>
          {activeCategory} KPI 상세 분석
        </h3>
        <button onClick={exportToExcel} className={styles.exportButton}>
          <i className='bx bxs-download'></i>
          엑셀 저장
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.kpiTable}>
          <thead>
            <tr>
              <th>재무지표</th>
              {companiesWithData.map(({ company }) => (
                <th key={company.corp_code}>{company.corp_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpiItems.map((kpiItem, index) => (
              <tr key={index}>
                <td className={styles.kpiName}>
                  <div className={styles.kpiInfo}>
                    <span>{kpiItem.kpi_name}</span>
                    <span className={styles.kpiUnit}>{kpiItem.unit}</span>
                  </div>
                </td>
                {companiesWithData.map(({ company, kpiData }) => {
                  const companyKpi = kpiData?.categories[activeCategory]?.find(k => k.kpi_name === kpiItem.kpi_name);
                  const value = companyKpi ? formatKpiValue(companyKpi.value, companyKpi.unit) : 'N/A';
                  const isValid = !value.includes('N/A') && !value.includes('데이터');
                  
                  return (
                    <td key={company.corp_code} className={`${styles.kpiValue} ${isValid ? styles.valid : styles.invalid}`}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AnalysisDashboard: React.FC<{
  analysisData: CompanyAnalysisData[];
  onBack: () => void;
}> = ({ analysisData, onBack }) => {
  // 1. 보고서 목록 상태
  const [reportsMap, setReportsMap] = useState<Record<string, Report[]>>({});
  // 2. 공통 연도 목록
  const [commonYears, setCommonYears] = useState<string[]>([]);
  // 3. 선택된 연도
  const [selectedYear, setSelectedYear] = useState<string>('');
  // 4. KPI 데이터 상태
  const [kpiDataMap, setKpiDataMap] = useState<Record<string, KpiResponse | null>>({});
  const [loading, setLoading] = useState(false);

  // 1. 보고서 목록 fetch (최초 1회)
  React.useEffect(() => {
    const fetchAllReports = async () => {
      const map: Record<string, Report[]> = {};
      for (const { company } of analysisData) {
        try {
          const reports = await fetchReports(company.corp_code);
          map[company.corp_code] = reports.filter(r => r.report_nm.includes('사업보고서'));
        } catch {
          map[company.corp_code] = [];
        }
      }
      setReportsMap(map);
    };
    fetchAllReports();
  }, [analysisData]);

  // 2. 공통 연도 추출
  React.useEffect(() => {
    const allYears = Object.values(reportsMap).map(reports =>
      new Set(reports.map(r => r.rcept_dt.substring(0, 4)))
    );
    if (allYears.length === 0 || allYears.some(set => set.size === 0)) {
      setCommonYears([]);
      setSelectedYear('');
      return;
    }
    // 교집합
    let intersection = [...allYears[0]];
    for (let i = 1; i < allYears.length; i++) {
      intersection = intersection.filter(y => allYears[i].has(y));
    }
    intersection.sort((a, b) => b.localeCompare(a)); // 최신 연도 우선
    setCommonYears(intersection);
    setSelectedYear(intersection[0] || '');
  }, [reportsMap]);

  // 3. 연도 선택 시 KPI fetch
  React.useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    const fetchAllKpi = async () => {
      const newMap: Record<string, KpiResponse | null> = {};
      await Promise.all(
        analysisData.map(async ({ company }) => {
          const reports = reportsMap[company.corp_code] || [];
          const report = reports.find(r => r.rcept_dt.startsWith(selectedYear));
          if (!report) {
            newMap[company.corp_code] = null;
            return;
          }
          try {
            const kpi = await fetchKpi(company.corp_code, report.rcept_no, selectedYear, '11011');
            newMap[company.corp_code] = kpi;
          } catch {
            newMap[company.corp_code] = null;
          }
        })
      );
      setKpiDataMap(newMap);
      setLoading(false);
    };
    fetchAllKpi();
  }, [selectedYear, reportsMap, analysisData]);

  // KPI 데이터 변환
  const kpiAnalysisData: CompanyAnalysisData[] = analysisData.map(({ company }) => ({
    company,
    reports: reportsMap[company.corp_code] || [],
    kpiData: kpiDataMap[company.corp_code] || null,
  }));

  const categories = [
    { key: 'Growth', label: '성장성', icon: 'bx-trending-up' },
    { key: 'Profitability', label: '수익성', icon: 'bxs-coin' },
    { key: 'Stability', label: '안정성', icon: 'bxs-shield' },
    { key: 'Activity', label: '활동성', icon: 'bx-refresh' },
    { key: 'Cashflow', label: '현금흐름', icon: 'bxs-bank' }
  ];
  const [activeCategory, setActiveCategory] = useState('Growth');

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.analysisHeader}>
        <button onClick={onBack} className={styles.backButton}>
          <i className='bx bx-arrow-back'></i>
          기업 선택으로 돌아가기
        </button>
        <h2>
          <i className='bx bxs-bar-chart-alt-2'></i>
          게임업계 KPI 분석 결과
        </h2>
        <div className={styles.analysisSubject}>
          {analysisData.map(({ company }) => company.corp_name).join(', ')} 비교분석
        </div>
      </div>
      {/* 보고서 연도 선택 드롭다운 */}
      <div className={styles.reportSelectorCard}>
        <div className={styles.selectorWrapper}>
          <label htmlFor="report-year">분석 기준 연도:</label>
          <select
            id="report-year"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            disabled={commonYears.length === 0}
          >
            {commonYears.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          {commonYears.length === 0 && <p>공통 사업보고서 연도가 없습니다.</p>}
        </div>
      </div>
      {/* KPI 데이터 로딩/표시 */}
      {loading ? (
        <div className={styles.loading}>
          <i className='bx bx-loader-alt bx-spin'></i>
          <h3>KPI 데이터를 불러오는 중...</h3>
        </div>
      ) : (
        <>
          <RadarChartAnalysis analysisData={kpiAnalysisData} />
          <div className={styles.categoryTabs}>
            {categories.map(({ key, label, icon }) => (
              <button
                key={key}
                className={`${styles.categoryTab} ${activeCategory === key ? styles.active : ''}`}
                onClick={() => setActiveCategory(key)}
              >
                <i className={`bx ${icon}`}></i>
                {label}
              </button>
            ))}
          </div>
          <KpiTable analysisData={kpiAnalysisData} activeCategory={activeCategory} />
        </>
      )}
    </div>
  );
};

// Main Component with Query Support
const TrendsPageContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'selection' | 'analysis'>('selection');
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [analysisData, setAnalysisData] = useState<CompanyAnalysisData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Financial Trends', active: true }
  ];

  // 기업 목록 조회
  const { data: companiesData, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  const handleCompanySelect = (company: Company) => {
    setSelectedCompanies(prev => [...prev, company]);
  };

  const handleCompanyRemove = (company: Company) => {
    setSelectedCompanies(prev => prev.filter(c => c.corp_code !== company.corp_code));
  };

  const handleAnalyze = async () => {
    if (selectedCompanies.length === 0) return;
    
    setIsAnalyzing(true);
    setCurrentView('analysis');
    
    try {
      const analysisResults: CompanyAnalysisData[] = await Promise.all(
        selectedCompanies.map(async (company) => {
          try {
            const reports = await fetchReports(company.corp_code);
            
            // 가장 최근 사업보고서 선택
            const businessReports = reports.filter(r => r.report_nm.includes('사업보고서'));
            let kpiData = null;
            
            if (businessReports.length > 0) {
              const latestReport = businessReports[0];
              try {
                kpiData = await fetchKpi(
                  company.corp_code, 
                  latestReport.rcept_no, 
                  latestReport.rcept_dt.substring(0, 4), 
                  '11011'
                );
              } catch (kpiError) {
                console.warn(`KPI 데이터 로딩 실패: ${company.corp_name}`, kpiError);
              }
            }
            
            return {
              company,
              reports,
              kpiData,
            };
          } catch (error) {
            console.error(`기업 데이터 로딩 실패: ${company.corp_name}`, error);
            return {
              company,
              reports: [],
              kpiData: null,
              error: `데이터 로딩 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
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
      <PageHeader title="Financial Trends" breadcrumbs={breadcrumbs} />

      <div className={styles.container}>
        {currentView === 'selection' && (
          <>
            <div className={styles.pageIntro}>
              <div className={styles.card}>
                <div className={styles.introContent}>
                  <div className={styles.introText}>
                    <h1>
                      <i className='bx bxs-bar-chart-alt-2'></i>
                      게임업계 재무 분석 플랫폼
                    </h1>
                    <p>
                      DART 공시 데이터를 기반으로 게임업계 상장기업의 재무건전성을 종합 분석합니다.
                      성장성, 수익성, 안정성 등 핵심 KPI를 통해 객관적인 재무 비교가 가능합니다.
                    </p>
                  </div>
                  <div className={styles.introStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statNumber}>{companiesData?.companies?.length || 0}</span>
                      <span className={styles.statLabel}>분석 대상 기업</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statNumber}>9</span>
                      <span className={styles.statLabel}>핵심 재무지표</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statNumber}>5</span>
                      <span className={styles.statLabel}>분석 카테고리</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.sectionHeader}>
                <h3>
                  <i className='bx bx-search'></i>
                  기업 검색 및 선택
                </h3>
                <p>분석할 게임회사를 검색하고 선택하세요 (최대 5개)</p>
              </div>

              <AutoCompleteSearch
                onCompanySelect={handleCompanySelect}
                selectedCompanies={selectedCompanies}
                companies={companiesData?.companies || []}
              />
            </div>

            <SelectedCompaniesPanel
              selectedCompanies={selectedCompanies}
              onRemove={handleCompanyRemove}
              onAnalyze={handleAnalyze}
            />
          </>
        )}

        {currentView === 'analysis' && (
          <AnalysisDashboard
            analysisData={analysisData}
            onBack={handleBack}
          />
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
