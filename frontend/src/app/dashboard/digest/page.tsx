"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './digest.module.scss';
import clsx from 'clsx';

// --- 상수 및 인터페이스 정의 ---
const STOCKPRICE_API_BASE = 'http://localhost:9006/stockprice';
const DISCLOSURE_API_BASE = 'http://localhost:8090/disclosures';
const ISSUE_API_BASE = 'http://localhost:8089/issue';

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
                <td className={styles.centerAlign}>{company.marketCapRank}</td>
                <td>{company.companyName}</td>
                <td className={styles.centerAlign}><span className={styles.countryBadge}>{company.country}</span></td>
                <td className={styles.rightAlign}>{company.currentPrice?.toLocaleString() ?? 'N/A'}</td>
                <td className={clsx(styles.rightAlign, company.changeRate && (company.changeRate > 0 ? styles.textPositive : styles.textNegative))}>
                  {company.changeRate ? `${company.changeRate.toFixed(2)}%` : 'N/A'}
                </td>
                <td className={styles.rightAlign}>{company.marketCap ? `${(company.marketCap / 10000).toFixed(1)}조` : 'N/A'}</td>
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
                        .map((summary, index) => <div key={index} title={summary}>{summary}</div>)
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

  const integrateData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const safeFetch = async <T,>(fetcher: () => Promise<T>, fallback: T): Promise<T> => {
        try { return await fetcher(); } catch (e) { return fallback; }
      };

      const [stockRes, disclosureRes, issueRes] = await Promise.all([
        safeFetch(apiClient.getAllStocks, { data: [] as WeeklyStockPrice[] }),
        safeFetch(apiClient.getDisclosuresWithCompanies, { disclosures: [] as WeeklyDisclosure[], companies: [] as GameCompany[] }),
        safeFetch(apiClient.getWeeklyIssues, { data: [] as WeeklyIssue[] }),
      ]);

      const stockData: WeeklyStockPrice[] = stockRes?.data ?? [];
      const companies: GameCompany[] = disclosureRes?.companies ?? [];
      const disclosures: WeeklyDisclosure[] = disclosureRes?.disclosures ?? [];
      const issues: WeeklyIssue[] = issueRes?.data ?? [];

      const companyDataMap = new Map<string, IntegratedCompanyData>();

      const allCompanySymbols = new Set([
        ...companies.map(c => c.symbol),
        ...stockData.map(s => NAME_TO_CODE_MAP[s.symbol]).filter(Boolean),
        ...disclosures.map(d => d.stock_code)
      ]);

      allCompanySymbols.forEach(symbol => {
        const companyInfoFromDisclosure = companies.find(c => c.symbol === symbol);
        const companyName = KOREAN_COMPANIES_MAP[symbol] || companyInfoFromDisclosure?.name || 'Unknown';
        
        if (KOREAN_COMPANIES_MAP[symbol]) {
          companyDataMap.set(symbol, {
            symbol: symbol,
            companyName: companyName,
            country: companyInfoFromDisclosure?.country || 'KR',
            marketCap: null, currentPrice: null, changeRate: null,
            marketCapRank: undefined,
            disclosures: [], issues: [],
          });
        }
      });

      stockData.forEach(stock => {
        if (!stock || !stock.symbol) return;
        const stockCode = NAME_TO_CODE_MAP[stock.symbol];
        if (stockCode && companyDataMap.has(stockCode)) {
          const company = companyDataMap.get(stockCode)!;
          company.marketCap = stock.marketCap;
          company.currentPrice = stock.today;
          company.changeRate = stock.changeRate;
        }
      });

      disclosures.forEach(d => {
        if (d && d.stock_code && companyDataMap.has(d.stock_code)) {
          companyDataMap.get(d.stock_code)!.disclosures.push(d);
        }
      });
      
      issues.forEach(i => {
        if (!i || !i.corp) return;
        const stockCode = NAME_TO_CODE_MAP[i.corp];
        if (stockCode && companyDataMap.has(stockCode)) {
          companyDataMap.get(stockCode)!.issues.push(i);
        }
      });

      const finalData = Array.from(companyDataMap.values())
        .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        .map((item, index) => ({ ...item, marketCapRank: index + 1 }));

      setIntegratedData(finalData);
    } catch (e: any) {
      setError(e.message || '데이터 로딩 실패');
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
    { title: "금주 신규 공시", value: "12", unit: "건" },
    { title: "금주 주요 이슈", value: "7", unit: "건" },
    ...(topGainer ? [{ title: "주가 등락률 최대 상승", value: `${topGainer.changeRate?.toFixed(2)}%`, companyName: topGainer.companyName, trend: 'up' as const }] : []),
    ...(topLoser ? [{ title: "주가 등락률 최대 하락", value: `${topLoser.changeRate?.toFixed(2)}%`, companyName: topLoser.companyName, trend: 'down' as const }] : []),
  ];

  if (loading) return (
    <div className={styles.stateContainer}>
      <span className={styles.spinner}></span>
      Loading...
    </div>
  );
  if (error) return <div className={styles.stateContainer}>Error: {error}</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.pageHeaderArea}>
          <div className={styles.breadcrumbs}>
            <span>Dashboard</span>
            <span className={styles.separator}>/</span>
            <span className={styles.current}>Market Digest</span>
          </div>
          <h1 className={styles.pageTitle}>Market Digest</h1>
          <div className={styles.kpiGrid}>
            {kpiCards.map((kpi, idx) => (
              <KPICard key={idx} {...kpi} />
            ))}
          </div>
        </div>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>통합 기업 분석 대시보드 ({integratedData.length}개 기업)</h3>
          <input
            type="text"
            placeholder="기업명 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.headerSearchInput}
          />
        </div>
        <IntegratedTable data={integratedData} searchTerm={searchTerm} onSearch={setSearchTerm} />
      </div>
    </div>
  );
};

export default DigestPage;