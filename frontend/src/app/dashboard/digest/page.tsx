

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './digest.module.scss';
import clsx from 'clsx';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import * as XLSX from 'xlsx';

// --- 상수 및 인터페이스 정의 ---
const STOCKPRICE_API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL_STOCKPRICE}/stockprice`;
const DISCLOSURE_API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL_DISCLOSURE}/disclosures`;
const ISSUE_API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL_ISSUE}/issue`;

const KOREAN_COMPANIES_MAP: Record<string, string> = {
    "035420": "네이버", "035720": "카카오", "259960": "크래프톤", "036570": "엔씨소프트", "251270": "넷마블",
    "263750": "펄어비스", "293490": "카카오게임즈", "225570": "넥슨게임즈", "112040": "위메이드", "095660": "네오위즈",
    "181710": "NHN", "078340": "컴투스", "192080": "더블유게임즈", "145720": "더블다운인터액티브", "089500": "그라비티",
    "194480": "데브시스터즈", "069080": "웹젠", "217270": "넵튠", "101730": "위메이드맥스", "063080": "컴투스홀딩스",
    "067000": "조이시티", "950190": "미투젠", "123420": "위메이드플레이", "201490": "미투온", "348030": "모비릭스",
    "052790": "액토즈소프트", "331520": "밸로프", "205500": "넥써쓰", "462870": "시프트업", "060240": "네오위즈", "299910": "넷마블",
};
const NAME_TO_CODE_MAP: Record<string, string> = Object.fromEntries(Object.entries(KOREAN_COMPANIES_MAP).map(([code, name]) => [name, code]));

interface WeeklyStockPrice { symbol: string; marketCap: number | null; today: number | null; changeRate: number | null; }
interface GameCompany { symbol: string; name: string; country: string; }
interface WeeklyDisclosure { id: number; stock_code: string; disclosure_title: string; }
interface WeeklyIssue { id: string; corp: string; summary: string; }
interface IntegratedCompanyData { symbol: string; companyName: string; country: string; marketCap: number | null; currentPrice: number | null; changeRate: number | null; marketCapRank?: number; disclosures: WeeklyDisclosure[]; issues: WeeklyIssue[]; }

const apiClient = {
  async getAllStocks(): Promise<{ data: WeeklyStockPrice[] }> {
    const response = await fetch(`${STOCKPRICE_API_BASE}/db/all`);
    if (!response.ok) throw new Error('주가 데이터 로딩 실패');
    return response.json();
  },
  async getDisclosuresWithCompanies(): Promise<{ disclosures: WeeklyDisclosure[], companies: GameCompany[] }> {
    const response = await fetch(`${DISCLOSURE_API_BASE}/recent-with-companies`);
    if (!response.ok) throw new Error('공시 데이터 로딩 실패');
    return response.json();
  },
  async getWeeklyIssues(): Promise<{ data: WeeklyIssue[] }> {
    const response = await fetch(`${ISSUE_API_BASE}/recent`);
    if (!response.ok) throw new Error('이슈 데이터 로딩 실패');
    return response.json();
  },
  
  // 📁 Fallback 데이터 로더
  async loadFallbackIssueData(): Promise<{ data: WeeklyIssue[] }> {
    try {
      console.log('📁 [Fallback] 로컬 이슈 데이터 로딩 시도');
      const response = await fetch('/fallback/issue_data.json');
      if (!response.ok) {
        throw new Error(`Fallback 파일 로딩 실패: ${response.status}`);
      }
      const issueArray: WeeklyIssue[] = await response.json();
      console.log('📁 [Fallback] 로컬 이슈 데이터 로딩 성공:', issueArray.length, '개');
      
      // 백엔드 API 응답 형식에 맞춰 변환
      return { data: issueArray };
    } catch (error) {
      console.error('📁 [Fallback] 로컬 이슈 데이터 로딩 실패:', error);
      return { data: [] };
    }
  },
  
  async loadFallbackStockData(): Promise<{ data: WeeklyStockPrice[] }> {
    try {
      console.log('📁 [Fallback] 로컬 주가 데이터 로딩 시도');
      const response = await fetch('/fallback/stockprice_data.json');
      if (!response.ok) {
        throw new Error(`Fallback 파일 로딩 실패: ${response.status}`);
      }
      const stockArray: WeeklyStockPrice[] = await response.json();
      console.log('📁 [Fallback] 로컬 주가 데이터 로딩 성공:', stockArray.length, '개');
      
      // 백엔드 API 응답 형식에 맞춰 변환
      return { data: stockArray };
    } catch (error) {
      console.error('📁 [Fallback] 로컬 주가 데이터 로딩 실패:', error);
      return { data: [] };
    }
  },

  async loadFallbackDisclosureData(): Promise<{ disclosures: WeeklyDisclosure[], companies: GameCompany[] }> {
    try {
      console.log('📁 [Fallback] 로컬 공시 데이터 로딩 시도');
      const response = await fetch('/fallback/disclosure_data.json');
      if (!response.ok) {
        throw new Error(`Fallback 파일 로딩 실패: ${response.status}`);
      }
      const data = await response.json();
      console.log('📁 [Fallback] 로컬 공시 데이터 로딩 성공:', data.disclosures?.length || 0, '개 공시,', data.companies?.length || 0, '개 기업');
      
      // 백엔드 API 응답 형식에 맞춰 변환
      return {
        disclosures: data.disclosures || [],
        companies: data.companies || []
      };
    } catch (error) {
      console.error('📁 [Fallback] 로컬 공시 데이터 로딩 실패:', error);
      return { disclosures: [], companies: [] };
    }
  }
};

// 시가총액 포맷팅 함수
const formatMarketCap = (marketCap: number | null): string => {
  if (!marketCap || marketCap === 0) return 'N/A';
  
  // 단위: 백만원 기준
  if (marketCap >= 10000) {
    // 1조 이상
    const trillion = marketCap / 10000;
    if (trillion >= 100) {
      return `${Math.round(trillion)}조`;
    } else if (trillion >= 10) {
      return `${trillion.toFixed(1)}조`;
    } else {
      return `${trillion.toFixed(2)}조`;
    }
  } else if (marketCap >= 1000) {
    // 1천억 이상 1조 미만
    const billion = marketCap / 1000;
    return `${billion.toFixed(0)}천억`;
  } else if (marketCap >= 100) {
    // 100억 이상 1천억 미만
    const billion = marketCap / 100;
    return `${billion.toFixed(0)}백억`;
  } else {
    // 100억 미만
    return `${marketCap.toFixed(0)}억`;
  }
};

const KPICard: React.FC<{ title: string; value: string; unit?: string; subtitle?: string; trend?: 'up' | 'down'; companyName?: string }> = ({ title, value, unit, subtitle, trend, companyName }) => {
  const trendIcon = trend === 'up' ? 'bx-trending-up' : 'bx-trending-down';
  const trendColor = trend === 'up' ? styles.textPositive : styles.textNegative;
  return (
    <div className={styles.kpiCard}>
      <div
        style={{
          background: '#f9f9f9',
          border: '1px solid #eee',
          borderRadius: 0,
          padding: '1.5rem',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div className={styles.title}>{title}</div>
        <div className={styles.valueRow}>
          <span className={styles.value}>{value}</span>
          {unit && <span className={styles.unit}>{unit}</span>}
          {companyName && <span className={styles.companyName}>{companyName}</span>}
        </div>
        {subtitle && <div className={clsx(styles.subtitle, trend && trendColor)}>
          {trend && <i className={`bx ${trendIcon}`}></i>}
          <span>{subtitle}</span>
        </div>}
      </div>
    </div>
  );
};

const IntegratedTable: React.FC<{ data: IntegratedCompanyData[], searchTerm: string, onSearch: (v: string) => void }> = ({ data, searchTerm, onSearch }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof IntegratedCompanyData; direction: 'asc' | 'desc' } | null>({ key: 'marketCapRank', direction: 'asc' });

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (searchTerm) {
      sortableData = sortableData.filter(item => item.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [data, searchTerm, sortConfig]);

  const requestSort = (key: keyof IntegratedCompanyData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof IntegratedCompanyData) => {
    if (!sortConfig || sortConfig.key !== key) return 'bx-sort';
    return sortConfig.direction === 'asc' ? 'bx-sort-up' : 'bx-sort-down';
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.integratedTable}>
          <thead>
            <tr>
              <th className={styles.thCheckbox}><input type="checkbox" /></th>
              <th className={styles.thRank} onClick={() => requestSort('marketCapRank')}>순위 <i className={`bx ${getSortIcon('marketCapRank')}`}></i></th>
              <th className={styles.thCompany} onClick={() => requestSort('companyName')}>기업명 <i className={`bx ${getSortIcon('companyName')}`}></i></th>
              <th className={styles.thCountry} onClick={() => requestSort('country')}>국가 <i className={`bx ${getSortIcon('country')}`}></i></th>
              <th className={styles.thNumber} onClick={() => requestSort('currentPrice')}>현재가 <i className={`bx ${getSortIcon('currentPrice')}`}></i></th>
              <th className={styles.thNumber} onClick={() => requestSort('changeRate')}>등락률 <i className={`bx ${getSortIcon('changeRate')}`}></i></th>
              <th className={styles.thNumber} onClick={() => requestSort('marketCap')}>시가총액 <i className={`bx ${getSortIcon('marketCap')}`}></i></th>
              <th className={styles.thDisclosure}>금주 공시</th>
              <th className={styles.thIssue}>금주 이슈</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((company) => (
              <tr key={company.symbol}>
                <td><input type="checkbox" /></td>
                <td className={styles.centerAlign}>{company.marketCapRank || '-'}</td>
                <td>{company.companyName}</td>
                <td className={styles.tdCountry}><span className={styles.countryBadge}>{company.country}</span></td>
                <td className={styles.rightAlign}>{company.currentPrice !== null ? company.currentPrice.toLocaleString() : 'N/A'}</td>
                <td className={clsx(styles.rightAlign, company.changeRate !== null && (company.changeRate > 0 ? styles.textPositive : styles.textNegative))}>
                  {company.changeRate !== null ? `${company.changeRate.toFixed(2)}%` : 'N/A'}
                </td>
                <td className={styles.rightAlign}>{formatMarketCap(company.marketCap)}</td>
                <td className={styles.disclosureCell}>
                  {company.disclosures.length > 0 ?
                    (
                      Array.from(new Set(company.disclosures.map(d => d.disclosure_title)))
                        .slice(0, 2)
                        .map((title, index) => <div key={index} title={title}>{title}</div>)
                    ) : (
                      <span className={styles.noItems}>공시 없음</span>
                    )
                  }
                </td>
                <td className={styles.issueCell}>
                  {company.issues.length > 0 ?
                    (
                      Array.from(new Set(company.issues.map(i => i.summary)))
                        .slice(0, 2)
                        .map((summary, index) => (
                          <div 
                            key={index} 
                            title={summary}
                            style={{ whiteSpace: 'pre-line', lineHeight: '1.4' }}
                          >
                            {summary}
                          </div>
                        ))
                    ) : (
                      <span className={styles.noItems}>이슈 없음</span>
                    )
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DigestPage: React.FC = () => {
  const [integratedData, setIntegratedData] = useState<IntegratedCompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);

  useEffect(() => {
    console.log('📦 Disclosure API Base:', process.env.NEXT_PUBLIC_API_BASE_URL_DISCLOSURE);
    console.log('📦 Stockprice API Base:', process.env.NEXT_PUBLIC_API_BASE_URL_STOCKPRICE);
    console.log('📦 Issue API Base:', process.env.NEXT_PUBLIC_API_BASE_URL_ISSUE);
  }, []);

  const integrateData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowDeployModal(false);
    
    let hasApiError = false;
    
    console.log('🚀 [데이터 로딩 시작] Digest 페이지 초기화');
    
    try {
      // 타임아웃 헬퍼 함수
      const timeoutPromise = (ms: number) => new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`요청 타임아웃 (${ms}ms)`)), ms)
      );

      const safeFetch = async <T,>(fetcher: () => Promise<T>, fallback: T | (() => Promise<T>), timeoutMs: number = 1000): Promise<T> => {
        try { 
          console.log(`⏱️ [API 호출] ${timeoutMs}ms 타임아웃으로 시작`);
          const result = await Promise.race([
            fetcher(),
            timeoutPromise(timeoutMs)
          ]);
          console.log('✅ [API 성공] 정상 응답 받음');
          return result as T;
        } catch (e) { 
          hasApiError = true;
          console.warn('🚨 [API 에러 감지] fallback으로 전환:', e);
          
          // fallback이 함수인 경우(비동기 fallback) 실행
          if (typeof fallback === 'function') {
            try {
              const fallbackResult = await (fallback as () => Promise<T>)();
              console.log('📁 [Fallback 성공] 로컬 데이터 로딩 완료');
              return fallbackResult;
            } catch (fallbackError) {
              console.error('🚨 [Fallback 에러]', fallbackError);
              // fallback도 실패하면 빈 데이터 반환
              return { data: [] } as T;
            }
          }
          
          return fallback as T; 
        }
      };

      const timestamp = Date.now();
      
      // 🚀 병렬 API 호출 (각각 1초 타임아웃)
      console.log('🚀 [병렬 API 호출] 3개 서비스 동시 요청 시작 (각 1초 타임아웃)');
      const [stockRes, disclosureRes, issueRes] = await Promise.all([
        safeFetch(async () => {
          console.log('🔗 [API 요청] STOCKPRICE:', `${STOCKPRICE_API_BASE}/db/all?_t=${timestamp}`);
          const res = await fetch(`${STOCKPRICE_API_BASE}/db/all?_t=${timestamp}`);
          console.log('📥 [API 응답] STOCKPRICE status:', res.status, res.statusText);
          if (!res.ok) {
            throw new Error(`Stockprice API 실패: ${res.status} ${res.statusText}`);
          }
          return res.json();
        }, async () => {
          console.log('📁 [Fallback] 주가 API 실패로 fallback 데이터 로딩');
          return await apiClient.loadFallbackStockData();
        }, 1000),
        
        safeFetch(async () => {
          console.log('🔗 [API 요청] DISCLOSURE:', `${DISCLOSURE_API_BASE}/recent-with-companies`);
          const res = await fetch(`${DISCLOSURE_API_BASE}/recent-with-companies`);
          console.log('📥 [API 응답] DISCLOSURE status:', res.status, res.statusText);
          if (!res.ok) {
            throw new Error(`Disclosure API 실패: ${res.status} ${res.statusText}`);
          }
          return res.json();
        }, async () => {
          console.log('📁 [Fallback] 공시 API 실패로 fallback 데이터 로딩');
          return await apiClient.loadFallbackDisclosureData();
        }, 1000),
        
        safeFetch(async () => {
          console.log('🔗 [API 요청] ISSUE:', `${ISSUE_API_BASE}/recent`);
          const res = await fetch(`${ISSUE_API_BASE}/recent`);
          console.log('📥 [API 응답] ISSUE status:', res.status, res.statusText);
          if (!res.ok) {
            throw new Error(`Issue API 실패: ${res.status} ${res.statusText}`);
          }
          return res.json();
        }, async () => {
          console.log('📁 [Fallback] 이슈 API 실패로 fallback 데이터 로딩');
          return await apiClient.loadFallbackIssueData();
        }, 1000)
      ]);
      
      console.log('🎉 [병렬 API 완료] 모든 데이터 로딩 완료');

      const stockData: WeeklyStockPrice[] = stockRes?.data ?? [];
      const companies: GameCompany[] = disclosureRes?.companies ?? [];
      const disclosures: WeeklyDisclosure[] = disclosureRes?.disclosures ?? [];
      const issues: WeeklyIssue[] = issueRes?.data ?? [];

      console.log('🔍 [디버깅] 백엔드 응답 데이터:');
      console.log('📊 주가 데이터:', stockData.length, stockData.slice(0, 3));
      console.log('📊 주가 데이터 전체 symbol 목록:', stockData.map(s => s.symbol));
      console.log('🏢 기업 정보:', companies.length, companies.slice(0, 3));
      console.log('📋 공시 정보:', disclosures.length, disclosures.slice(0, 3));
      console.log('📰 이슈 정보:', issues.length);
      
      // 주가 데이터 상세 로그 (fallback 여부 확인)
      if (stockData.length > 0) {
        console.log('📊 [주가 데이터 상세]', stockData.slice(0, 3));
        console.log('📊 [주가 데이터] 가격이 있는 종목:', stockData.filter(s => s.today !== null).length, '개');
        console.log('📊 [주가 데이터] 시가총액 범위:', 
          Math.min(...stockData.filter(s => s.marketCap).map(s => s.marketCap!)), '~',
          Math.max(...stockData.filter(s => s.marketCap).map(s => s.marketCap!)));
      } else {
        console.log('📊 [주가 데이터] 데이터 없음 (API 및 fallback 모두 실패했을 가능성)');
      }
      
      // 이슈 데이터 상세 로그 (fallback 여부 확인)
      if (issues.length > 0) {
        console.log('📰 [이슈 데이터 상세]', issues.slice(0, 3));
        console.log('📰 [이슈 데이터] 기업 목록:', issues.map(i => i.corp));
      } else {
        console.log('📰 [이슈 데이터] 데이터 없음 (API 및 fallback 모두 실패했을 가능성)');
      }

      const companyDataMap = new Map<string, IntegratedCompanyData>();

      const allCompanySymbols = new Set([
        ...companies.map(c => c.symbol),
        ...stockData.map(s => s.symbol).filter(Boolean),
        ...disclosures.map(d => d.stock_code)
      ]);

      console.log('🔍 [디버깅] 전체 기업 심볼들:', Array.from(allCompanySymbols));
      
      allCompanySymbols.forEach(symbol => {
        const companyInfoFromDisclosure = companies.find(c => c.symbol === symbol);
        const companyName = KOREAN_COMPANIES_MAP[symbol] || companyInfoFromDisclosure?.name || 'Unknown';
        
        if (KOREAN_COMPANIES_MAP[symbol]) {
          console.log(`✅ [추가됨] ${symbol}: ${companyName}`);
          companyDataMap.set(symbol, {
            symbol: symbol,
            companyName: companyName,
            country: companyInfoFromDisclosure?.country || 'KR',
            marketCap: null, currentPrice: null, changeRate: null,
            marketCapRank: undefined,
            disclosures: [], issues: [],
          });
        } else {
          console.log(`❌ [제외됨] ${symbol}: ${companyName} (KOREAN_COMPANIES_MAP에 없음)`);
        }
      });
      
      console.log('🔍 [디버깅] 생성된 companyDataMap 크기:', companyDataMap.size);

      // 주가 데이터 적용 (API 또는 fallback)
      console.log('📊 [주가 매핑 시작] 총', stockData.length, '개 주가 데이터 처리');
      stockData.forEach(stock => {
        if (!stock || !stock.symbol) {
          console.log('❌ [주가 매핑] 빈 데이터 또는 symbol 없음:', stock);
          return;
        }
        
        // 백엔드에서 symbol이 이제 종목코드로 반환되므로 직접 사용
        const stockCode = stock.symbol;
        if (stockCode && companyDataMap.has(stockCode)) {
          console.log(`✅ [주가 매핑] ${stockCode}: 현재가=${stock.today}, 등락률=${stock.changeRate}%, 시총=${stock.marketCap}`);
          const company = companyDataMap.get(stockCode)!;
          company.marketCap = stock.marketCap;
          company.currentPrice = stock.today;
          company.changeRate = stock.changeRate;
        } else {
          console.log(`❌ [주가 매핑] ${stockCode}: companyDataMap에 없음`);
        }
      });
      
      // 주가가 적용된 기업 수 확인
      const companiesWithStockData = Array.from(companyDataMap.values()).filter(c => c.currentPrice !== null);
      console.log('📊 [주가 매핑 완료] 주가가 있는 기업:', companiesWithStockData.length, '개');
      if (companiesWithStockData.length > 0) {
        console.log('📊 [주가 보유 TOP 5]');
        companiesWithStockData
          .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
          .slice(0, 5)
          .forEach((c, idx) => {
            console.log(`  ${idx + 1}. ${c.companyName}: 현재가=${c.currentPrice?.toLocaleString()}원, 등락률=${c.changeRate}%, 시총=${c.marketCap?.toLocaleString()}백만원`);
          });
      }

      // 공시 데이터 적용 (API 또는 fallback)
      console.log('📋 [공시 매핑 시작] 총', disclosures.length, '개 공시 데이터 처리');
      disclosures.forEach(d => {
        if (!d || !d.stock_code) {
          console.log('❌ [공시 매핑] 빈 데이터 또는 stock_code 없음:', d);
          return;
        }
        if (companyDataMap.has(d.stock_code)) {
          companyDataMap.get(d.stock_code)!.disclosures.push(d);
          console.log(`✅ [공시 매핑] ${d.stock_code} <- 공시 추가: ${d.disclosure_title}`);
        } else {
          console.log(`❌ [공시 매핑] ${d.stock_code}: companyDataMap에 없음`);
        }
      });
      
      // 공시가 적용된 기업 수 확인
      const companiesWithDisclosures = Array.from(companyDataMap.values()).filter(c => c.disclosures.length > 0);
      console.log('📋 [공시 매핑 완료] 공시가 있는 기업:', companiesWithDisclosures.length, '개');
      companiesWithDisclosures.forEach(c => {
        console.log(`📋 [공시 보유] ${c.companyName}: ${c.disclosures.length}개 공시`);
      });
      


      // 이슈 데이터 적용 (API 또는 fallback)
      console.log('📰 [이슈 매핑 시작] 총', issues.length, '개 이슈 데이터 처리');
      issues.forEach(i => {
        if (!i || !i.corp) {
          console.log('❌ [이슈 매핑] 빈 데이터 또는 corp 없음:', i);
          return;
        }
        const stockCode = NAME_TO_CODE_MAP[i.corp];
        if (stockCode && companyDataMap.has(stockCode)) {
          companyDataMap.get(stockCode)!.issues.push(i);
          console.log(`✅ [이슈 매핑] ${i.corp} (${stockCode}) <- 이슈 추가`);
        } else {
          console.log(`❌ [이슈 매핑] ${i.corp} -> 코드: ${stockCode} (companyDataMap에 없음)`);
        }
      });
      
      // 이슈가 적용된 기업 수 확인
      const companiesWithIssues = Array.from(companyDataMap.values()).filter(c => c.issues.length > 0);
      console.log('📰 [이슈 매핑 완료] 이슈가 있는 기업:', companiesWithIssues.length, '개');
      companiesWithIssues.forEach(c => {
        console.log(`📰 [이슈 보유] ${c.companyName}: ${c.issues.length}개 이슈`);
      });



      const finalData = Array.from(companyDataMap.values())
        .sort((a, b) => {
          // 시가총액이 없는 기업들은 맨 아래로
          const aMarketCap = a.marketCap || 0;
          const bMarketCap = b.marketCap || 0;
          
          if (aMarketCap === 0 && bMarketCap === 0) {
            // 둘 다 시가총액이 없으면 기업명 순
            return a.companyName.localeCompare(b.companyName);
          } else if (aMarketCap === 0) {
            return 1; // a를 뒤로
          } else if (bMarketCap === 0) {
            return -1; // b를 뒤로
          } else {
            // 시가총액 내림차순 (큰 것부터)
            return bMarketCap - aMarketCap;
          }
        })
        .map((item, index) => ({ 
          ...item, 
          marketCapRank: item.marketCap && item.marketCap > 0 ? index + 1 : undefined 
        }));

      console.log('🔍 [디버깅] 최종 데이터:', finalData.length, finalData.slice(0, 5));
      console.log('🔍 [디버깅] 주가 데이터가 있는 기업:', finalData.filter(d => d.currentPrice !== null).length);
      console.log('🔍 [디버깅] 주가 데이터가 없는 기업:', finalData.filter(d => d.currentPrice === null));
      
      // 각 기업별 상세 데이터 확인
      finalData.forEach((company, index) => {
        if (index < 10) { // 처음 10개만
          console.log(`🔍 [상세] ${index+1}. ${company.companyName} (${company.symbol}):`, {
            marketCap: company.marketCap,
            currentPrice: company.currentPrice,
            changeRate: company.changeRate,
            rank: company.marketCapRank
          });
        }
      });

      setIntegratedData(finalData);
      
      // API 에러가 발생했는지 확인하고 적절한 알림 표시
      if (hasApiError) {
        console.log('🚨 [API 에러 발생] 일부 API 호출 실패, fallback 데이터 사용 중');
        
        // 주가 데이터 fallback 확인
        const hasStockData = stockData.length > 0;
        if (hasStockData) {
          console.log('✅ [Fallback 성공] 주가 데이터 fallback이 정상 작동');
        } else {
          console.log('❌ [Fallback 실패] 주가 데이터 fallback도 실패');
        }
        
        // 이슈 데이터 fallback 확인
        const hasIssueData = companiesWithIssues.length > 0;
        if (hasIssueData) {
          console.log('✅ [Fallback 성공] 이슈 데이터 fallback이 정상 작동');
        } else {
          console.log('❌ [Fallback 실패] 이슈 데이터 fallback도 실패');
        }
        
        // Fallback 상태 요약
        console.log(`📋 [Fallback 요약] 주가: ${hasStockData ? '✅' : '❌'}, 이슈: ${hasIssueData ? '✅' : '❌'}`);
        
        // 데이터가 아예 없는 경우에만 모달 표시
        if (finalData.length === 0) {
          setShowDeployModal(true);
        }
      } else {
        console.log('✅ [모든 API 성공] 정상 데이터 로딩 완료');
      }
    } catch (e: any) {
      console.error('🚨 [치명적 에러]', e);
      setShowDeployModal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    integrateData();
  }, [integrateData]);

  // 등락률 인사이트 카드용 데이터
  const validChangeData = integratedData.filter(d => typeof d.changeRate === 'number' && d.changeRate !== null && !isNaN(d.changeRate));
  const topGainer = validChangeData.length ? validChangeData.reduce((max, curr) => (curr.changeRate! > (max.changeRate ?? -Infinity) ? curr : max), validChangeData[0]) : null;
  const topLoser = validChangeData.length ? validChangeData.reduce((min, curr) => (curr.changeRate! < (min.changeRate ?? Infinity) ? curr : min), validChangeData[0]) : null;

  const kpiCards = [
    { title: "총 상장사", value: integratedData.length.toString(), unit: "분석 대상" },
    { title: "평균 시가총액", value: "1.2조", unit: "KRW" },
    { title: "신규 공시", value: "12", unit: "건" },
    { title: "주요 이슈", value: "7", unit: "건" },
    ...(topGainer ? [{ title: "주가 최대 상승", value: `${topGainer.changeRate?.toFixed(2)}%`, companyName: topGainer.companyName, trend: 'up' as const }] : []),
    ...(topLoser ? [{ title: "주가 최대 하락", value: `${topLoser.changeRate?.toFixed(2)}%`, companyName: topLoser.companyName, trend: 'down' as const }] : []),
  ];

  if (loading) return (
    <div className={styles.stateContainer}>
      <span className={styles.spinner}></span>
      <div className={styles.loadingContent}>
        <div className={styles.loadingTitle}>게임업계 데이터 수집 중</div>
        <div className={styles.loadingDescription}>
          금주 주가 변동 내역, 최신 공시, 주요 이슈를<br/>
          여러 데이터 소스에서 통합하고 있습니다
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Market Digest"
        description="주간 게임업계 상장기업의 주가 변동, 주요 이슈 및 공시 내용을 요약해 제공합니다."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Market Digest', active: true }
        ]}
        className={styles.card}
      >
        <div className={styles.digestStatsGrid}>
          {kpiCards.map((kpi, idx) => (
            <div className={styles.miniKpiCard} key={idx}>
              <div className={styles.miniKpiTitle}>{kpi.title}</div>
              <div className={styles.miniKpiValueRow}>
                <span className={styles.miniKpiValue}>{kpi.value}</span>
                {kpi.unit && <span className={styles.miniKpiUnit}>{kpi.unit}</span>}
              </div>
              {kpi.companyName && <div className={styles.miniKpiCompany}>{kpi.companyName}</div>}
            </div>
          ))}
        </div>
      </PageHeader>
      <div className={styles.tableHeader}>
        <input
          type="text"
          placeholder="기업명 검색..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.headerSearchInput}
        />
        <button
          className={styles.excelDownloadBtn}
          onClick={() => {
            // 엑셀 다운로드 구현
            const exportData = integratedData.map(row => ({
              순위: row.marketCapRank,
              기업명: row.companyName,
              국가: row.country,
              현재가: row.currentPrice ?? '',
              등락률: row.changeRate !== null && row.changeRate !== undefined ? row.changeRate.toFixed(2) + '%' : '',
              시가총액: row.marketCap ? (row.marketCap / 10000).toFixed(1) + '조' : '',
              '금주 공시': row.disclosures.map(d => d.disclosure_title).join('; '),
              '금주 이슈': row.issues.map(i => i.summary).join('; '),
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'MarketDigest');
            XLSX.writeFile(wb, 'MarketDigest.xlsx');
          }}
        >
          엑셀 다운로드
        </button>
      </div>
      <IntegratedTable data={integratedData} searchTerm={searchTerm} onSearch={setSearchTerm} />
      
      {showDeployModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeployModal(false)}>
          <div className={styles.deployModal} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalCloseBtn}
              onClick={() => setShowDeployModal(false)}
            >
              ×
            </button>
            <div className={styles.modalContent}>
              <p className={styles.modalText}>
              해당 기능은 현재 서비스 준비 중입니다.</p>
              <p className={styles.modalText}>
              정식 제공을 위한 최종 점검을 진행하고 있습니다.
              불편을 드려 죄송하며, 빠른 시일 내에 이용하실 수 있도록 하겠습니다.
              </p>
            </div>
            <button 
              className={styles.modalConfirmBtn}
              onClick={() => setShowDeployModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigestPage;