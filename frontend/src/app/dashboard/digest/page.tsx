"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import styles from './digest.module.scss';
import clsx from 'clsx';

// API 베이스 URL 설정
const STOCKPRICE_API_BASE = 'http://localhost:9006/stockprice';
const DISCLOSURE_API_BASE = 'http://localhost:8090/disclosures';
const ISSUE_API_BASE = 'http://localhost:8089/issue';
const WEEKLY_DB_API_BASE = 'http://localhost:8001/weekly';

// 한국 게임기업 종목코드-시장 매핑표
const STOCK_MARKET_MAPPING: Record<string, string> = {
  // 메인 게임기업
  '036570': 'KOSPI',   // 엔씨소프트
  '251270': 'KOSPI',   // 넷마블
  '259960': 'KOSPI',   // 크래프톤
  '263750': 'KOSPI',   // 펄어비스
  '293490': 'KOSPI',   // 카카오게임즈
  '225570': 'KOSPI',   // 넥슨게임즈
  '181710': 'KOSPI',   // NHN
  '035420': 'KOSPI',   // 네이버
  '035720': 'KOSPI',   // 카카오
  
  // KOSDAQ 게임기업
  '078340': 'KOSDAQ',  // 컴투스
  '112040': 'KOSDAQ',  // 위메이드
  '095660': 'KOSDAQ',  // 네오위즈
  '069080': 'KOSDAQ',  // 웹젠
  '192080': 'KOSDAQ',  // 더블유게임즈
  '145720': 'KOSDAQ',  // 더블다운인터액티브
  '089500': 'KOSDAQ',  // 그라비티
  '194480': 'KOSDAQ',  // 데브시스터즈
  '217270': 'KOSDAQ',  // 넵튠
  '101730': 'KOSDAQ',  // 위메이드맥스
  '063080': 'KOSDAQ',  // 컴투스홀딩스
  '067000': 'KOSDAQ',  // 조이시티
  '950190': 'KOSDAQ',  // 미투젠
  '123420': 'KOSDAQ',  // 위메이드플레이
  '201490': 'KOSDAQ',  // 미투온
  '348030': 'KOSDAQ',  // 모비릭스
  '052790': 'KOSDAQ',  // 액토즈소프트
  '331520': 'KOSDAQ',  // 밸로프
  '205500': 'KOSDAQ',  // 넥써쓰
  '462870': 'KOSDAQ',  // 시프트업
  
  // 해외 기업 (참고용)
  'ATVI': 'NASDAQ',   // Activision Blizzard
  'EA': 'NASDAQ',     // Electronic Arts
  'TTWO': 'NASDAQ',   // Take-Two Interactive
  'RBLX': 'NYSE',     // Roblox Corporation
  'U': 'NYSE',        // Unity Software
  'ZNGA': 'NASDAQ',   // Zynga
  '7974': 'TSE',      // Nintendo
  '9684': 'TSE',      // Square Enix
  '3659': 'TSE',      // Nexon
  '0700': 'HKEX',     // Tencent
  '9999': 'HKEX'      // NetEase
};

// 백엔드(weekly_stockprice/app/config/companies.py)와 동일한 정보
const GAME_COMPANIES_MAP: Record<string, string> = {
  "네이버": "035420", "카카오": "035720", "크래프톤": "259960", "엔씨소프트": "036570", "넷마블": "251270",
  "펄어비스": "263750", "카카오게임즈": "293490", "넥슨게임즈": "225570", "위메이드": "112040", "네오위즈": "095660",
  "NHN": "181710", "컴투스": "078340", "더블유게임즈": "192080", "더블다운인터액티브": "145720", "그라비티": "089500",
  "데브시스터즈": "194480", "웹젠": "069080", "넵튠": "217270", "위메이드맥스": "101730", "컴투스홀딩스": "063080",
  "조이시티": "067000", "미투젠": "950190", "위메이드플레이": "123420", "미투온": "201490", "모비릭스": "348030",
  "액토즈소프트": "052790", "밸로프": "331520", "넥써쓰": "205500", "시프트업": "462870",
  "Tencent": "00700", "Netease": "09999", "Baidu": "09888",
  "Kingsoft": "03888", "Perfect World": "002624", "Netdragon": "00777", "Sohu": "SOHU", "Cheetah Mobile": "CMCM",
  "Nintendo": "7974", "Nexon": "3659", "Bandai-Namco": "7832", "Capcom": "9697", "KONAMI": "9766",
  "Square-Enix": "9684", "Sega": "6460", "Gungho": "3765", "DeNA": "2432", "Gree": "3632",
  "COLOPL": "3668", "Klab": "3656",
  "Electronic-Arts": "EA", "Roblox": "RBLX", "Take-Two": "TTWO", "Playtika": "PLTK", "Sciplay": "SCPL",
  "CD Projekt SA": "CDR", "Ubisoft": "UBI"
};

const SYMBOL_TO_NAME_MAP: { [key: string]: string } = {};
Object.entries(GAME_COMPANIES_MAP).forEach(([name, symbol]) => {
  SYMBOL_TO_NAME_MAP[symbol] = name;
});

// 데이터 타입 정의
interface WeeklyStockPrice {
  symbol: string;
  marketCap: number | null;
  today: number | null;
  lastWeek: number | null;
  changeRate: number | null;
  weekHigh: number | null;
  weekLow: number | null;
  error: string | null;
}

interface GameCompany {
  symbol: string;
  name: string;
  country: string;
}

interface WeeklyDisclosure {
  id: number;
  company_name: string;
  stock_code: string;
  disclosure_title: string;
  disclosure_date: string;
  report_name: string;
  created_at?: string;
  updated_at?: string;
}

interface WeeklyIssue {
  id: string;
  corp: string;
  summary: string;
  original_title: string;
  confidence: number;
  matched_keywords?: string[];
  news_url?: string;
  published_date?: string;
  category?: string;
  sentiment?: string;
  created_at?: string;
  updated_at?: string;
}

interface IntegratedCompanyData {
  symbol: string;
  companyName: string;
  country: string;
  marketCap: number | null;
  currentPrice: number | null;
  changeRate: number | null;
  weekHigh: number | null;
  weekLow: number | null;
  lastWeek: number | null;
  market: string;
  disclosures: WeeklyDisclosure[];
  issues: WeeklyIssue[];
  marketCapRank?: number;
}

// API 함수들
const apiClient = {
  // Stock Price API
  async getAllStocks() {
    console.log('🚀 주가 API 호출 시작:', `${STOCKPRICE_API_BASE}/db/all`);
    const response = await fetch(`${STOCKPRICE_API_BASE}/db/all`);
    console.log('📡 주가 API 응답 상태:', response.status, response.statusText);
    if (!response.ok) {
      console.error('❌ 주가 API 오류:', response.status, response.statusText);
      throw new Error(`주가 데이터 로딩 실패: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('📈 주가 API 응답:', data);
    return data;
  },

  async getGameCompanies() {
    console.log('🚀 기업 정보 API 호출 시작:', `${WEEKLY_DB_API_BASE}/companies`);
    const response = await fetch(`${WEEKLY_DB_API_BASE}/companies`);
    console.log('📡 기업 정보 API 응답 상태:', response.status, response.statusText);
    if (!response.ok) {
      console.error('❌ 기업 정보 API 오류:', response.status, response.statusText);
      throw new Error(`기업 정보 로딩 실패: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('🏢 기업 정보 API 응답:', data);
    return data;
  },

  // Disclosure API
  async getWeeklyDisclosures() {
    console.log('🚀 공시 API 호출 시작:', `${DISCLOSURE_API_BASE}/recent`);
    const response = await fetch(`${DISCLOSURE_API_BASE}/recent`);
    console.log('📡 공시 API 응답 상태:', response.status, response.statusText);
    if (!response.ok) {
      console.error('❌ 공시 API 오류:', response.status, response.statusText);
      throw new Error(`공시 데이터 로딩 실패: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('🔍 공시 API 원본 응답:', data);
    console.log('🔍 공시 API 응답 타입:', typeof data);
    console.log('🔍 공시 data 필드:', data.data);
    if (data.data && data.data.length > 0) {
      console.log('🔍 첫 번째 공시 아이템:', data.data[0]);
      console.log('🔍 첫 번째 공시 아이템 키들:', Object.keys(data.data[0]));
    }
    return data;
  },

  // 공시 + 기업 정보 통합 API
  async getDisclosuresWithCompanies() {
    console.log('🚀 공시+기업 API 호출 시작:', `${DISCLOSURE_API_BASE}/recent-with-companies`);
    const response = await fetch(`${DISCLOSURE_API_BASE}/recent-with-companies`);
    console.log('📡 공시+기업 API 응답 상태:', response.status, response.statusText);
    if (!response.ok) {
      console.error('❌ 공시+기업 API 오류:', response.status, response.statusText);
      throw new Error(`공시+기업 데이터 로딩 실패: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('🔍 공시+기업 API 원본 응답:', data);
    console.log('🔍 공시 개수:', data.disclosures?.length || 0);
    console.log('🔍 기업 개수:', data.companies?.length || 0);
    return data;
  },

  // Issue API
  async getWeeklyIssues() {
    const response = await fetch(`${ISSUE_API_BASE}/recent`);
    if (!response.ok) throw new Error('이슈 데이터 로딩 실패');
    return await response.json();
  },

  // Health checks
  async healthCheck() {
    const promises = [
      fetch(`${STOCKPRICE_API_BASE}/health`).catch(() => null),
      fetch(`${DISCLOSURE_API_BASE}/health`).catch(() => null),
      fetch(`${ISSUE_API_BASE}/health`).catch(() => null),
      fetch(`${WEEKLY_DB_API_BASE}/health`).catch(() => null)
    ];
    return await Promise.all(promises);
  }
};

const getCountryClass = (country: string) => {
    const classes: Record<string, string> = {
      KR: styles.countryKR,
      JP: styles.countryJP,
      CN: styles.countryCN,
      US: styles.countryUS,
      EU: styles.countryEU,
    };
    return classes[country] || styles.countryDefault;
};

const getMarketClass = (market: string) => {
  const lowerMarket = market.toLowerCase();
  if (lowerMarket.includes('kospi')) return styles.kospi;
  if (lowerMarket.includes('kosdaq')) return styles.kosdaq;
  return styles.unknown;
}

// 미니 정보 팝업 컴포넌트
interface MiniPopupProps {
  stock: IntegratedCompanyData;
  onClose: () => void;
  position: { x: number; y: number };
}

const MiniPopup: React.FC<MiniPopupProps> = ({ stock, onClose, position }) => {
  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    return num.toLocaleString();
  };

  const changeRateColor = stock.changeRate === null ? styles.textNeutral :
                          stock.changeRate > 0 ? styles.textPositive :
                          styles.textNegative;

  return (
    <div className={styles.miniPopup} style={{
      top: position.y + 10,
      left: position.x + 10,
    }}>
      <div className={styles.popupHeader}>
        <h4>{stock.companyName}</h4>
        <button onClick={onClose} className={styles.closeButton}>×</button>
      </div>
      
      <div className={styles.infoSection}>
        <div className={styles.metaInfo}>
          {stock.symbol} · {stock.country} · 순위 {stock.marketCapRank || 'N/A'}
        </div>
        <div className={styles.price}>
          {formatNumber(stock.currentPrice)}원
        </div>
        <div className={clsx(styles.changeRate, changeRateColor)}>
          {stock.changeRate !== null ? 
            `${stock.changeRate > 0 ? '+' : ''}${stock.changeRate.toFixed(2)}%` : 'N/A'}
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <div className={styles.gridLabel}>시가총액</div>
          <div className={styles.gridValue}>
            {stock.marketCap ? `${formatNumber(stock.marketCap)}억원` : 'N/A'}
          </div>
        </div>
        <div>
          <div className={styles.gridLabel}>주간 고가</div>
          <div className={styles.gridValue}>
            {formatNumber(stock.weekHigh)}원
          </div>
        </div>
        <div>
          <div className={styles.gridLabel}>주간 저가</div>
          <div className={styles.gridValue}>
            {formatNumber(stock.weekLow)}원
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI 카드 컴포넌트
interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color, trend }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return 'bx-trending-up';
    if (trend === 'down') return 'bx-trending-down';
    return 'bx-minus';
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#27ae60';
    if (trend === 'down') return '#e74c3c';
    return '#7f8c8d';
  };

  const cardStyle = {
    '--card-color': color,
    '--card-bg': `${color}1A`,
  } as React.CSSProperties;

  return (
    <div className={styles.kpiCard} style={cardStyle}>
      <div className={styles.colorBar} />
      <div className={styles.cardContent}>
        <div className={styles.textWrapper}>
          <div className={styles.title}>{title}</div>
          <div className={styles.value}>{value}</div>
          <div className={styles.subtitle}>
            {trend && (
              <i className={clsx('bx', getTrendIcon(), styles.trendIcon)} style={{ 
                color: getTrendColor(),
              }}></i>
            )}
            {subtitle}
          </div>
        </div>
        <div className={styles.iconWrapper}>
          <i className={clsx('bx', icon, styles.icon)}></i>
        </div>
      </div>
    </div>
  );
};

// 메인 통합 테이블 컴포넌트
interface IntegratedTableProps {
  data: IntegratedCompanyData[];
  onExportExcel: (selectedData?: IntegratedCompanyData[]) => void;
  onExportPDF: (selectedData?: IntegratedCompanyData[]) => void;
  onCompanyClick: (symbol: string) => void;
}

const IntegratedTable: React.FC<IntegratedTableProps> = ({ 
  data, 
  onExportExcel, 
  onExportPDF, 
  onCompanyClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof IntegratedCompanyData>('marketCapRank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterCountry, setFilterCountry] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState<{ stock: IntegratedCompanyData; position: { x: number; y: number } } | null>(null);

  const countryOptions = useMemo(() => {
    if (!data) return ['all'];
    const countries = new Set(data.map(item => item.country).filter(c => c !== 'Unknown'));
    return ['all', ...Array.from(countries).sort()];
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const matchesSearch = item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = filterCountry === 'all' || item.country === filterCountry;
      
      return matchesSearch && matchesCountry;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection, filterCountry]);

  // 선택 관련 함수
  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedData.map(item => item.symbol)));
    }
  };

  const handleSelectItem = (symbol: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedItems(newSelected);
  };

  const getSelectedData = () => {
    return filteredAndSortedData.filter(item => selectedItems.has(item.symbol));
  };

  // 팝업 핸들러
  const handleCellClick = (stock: IntegratedCompanyData, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowPopup({
      stock,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleSort = (field: keyof IntegratedCompanyData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    return num.toLocaleString();
  };

  const getSortIcon = (field: keyof IntegratedCompanyData) => {
    if (sortField !== field) return 'bx-sort';
    return sortDirection === 'asc' ? 'bx-sort-up' : 'bx-sort-down';
  };

  const tableColumns = [
    { key: 'marketCapRank', label: '순위', width: '60px' },
    { key: 'companyName', label: '기업명', width: '140px' },
    { key: 'country', label: '국가', width: '80px' },
    { key: 'currentPrice', label: '현재가', width: '100px' },
    { key: 'changeRate', label: '등락률(%)', width: '100px' },
    { key: 'marketCap', label: '시가총액(억)', width: '120px' },
    { key: 'weekHigh', label: '주간고가', width: '100px' },
    { key: 'weekLow', label: '주간저가', width: '100px' },
    { key: 'lastWeek', label: '전주종가', width: '100px' },
    { key: 'disclosures', label: '금주 공시', width: '200px' },
    { key: 'issues', label: '금주 이슈', width: '200px' }
  ];

  return (
    <div className={styles.tableContainer}>
      {/* 테이블 헤더 - 검색 및 필터 */}
      <div className={styles.tableHeader}>
        <div className={styles.tableControls}>
          <h3 className={styles.tableTitle}>
            <i className='bx bxs-dashboard'></i>
            통합 기업 분석 대시보드 ({filteredAndSortedData.length}개 기업)
          </h3>
          
          <div className={styles.filterControls}>
            {/* 검색 */}
            <input
              type="text"
              placeholder="기업명 또는 종목코드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            
            {/* 국가 필터 */}
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className={styles.countrySelect}
            >
              {countryOptions.map(country => (
                <option key={country} value={country}>
                  {country === 'all' ? '전체 국가' : country}
                </option>
              ))}
            </select>

            {/* 다운로드 버튼 */}
            <button
              onClick={() => onExportExcel(selectedItems.size > 0 ? getSelectedData() : undefined)}
              className={clsx(styles.exportButton, styles.excel)}
            >
              <i className='bx bxs-file-export'></i>
              Excel {selectedItems.size > 0 && `(${selectedItems.size}개)`}
            </button>
            
            <button
              onClick={() => onExportPDF(selectedItems.size > 0 ? getSelectedData() : undefined)}
              className={clsx(styles.exportButton, styles.pdf)}
            >
              <i className='bx bxs-file-pdf'></i>
              PDF {selectedItems.size > 0 && `(${selectedItems.size}개)`}
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className={styles.tableWrapper}>
        <table className={styles.integratedTable}>
          <thead>
            <tr>
              <th style={{ width: '3%' }}>
                <input type="checkbox" onChange={handleSelectAll} checked={selectedItems.size === filteredAndSortedData.length && filteredAndSortedData.length > 0} />
              </th>
              <th style={{ width: '3%' }} onClick={() => handleSort('marketCapRank')}>순위 <i className={clsx('bx', getSortIcon('marketCapRank'))}></i></th>
              <th style={{ width: '14%' }} onClick={() => handleSort('companyName')}>기업명 <i className={clsx('bx', getSortIcon('companyName'))}></i></th>
              <th style={{ width: '4%' }} onClick={() => handleSort('country')}>국가 <i className={clsx('bx', getSortIcon('country'))}></i></th>
              <th style={{ width: '8%' }} onClick={() => handleSort('currentPrice')}>현재가 <i className={clsx('bx', getSortIcon('currentPrice'))}></i></th>
              <th style={{ width: '6%' }} onClick={() => handleSort('changeRate')}>등락률(%) <i className={clsx('bx', getSortIcon('changeRate'))}></i></th>
              <th style={{ width: '8%' }} onClick={() => handleSort('marketCap')}>시가총액(억) <i className={clsx('bx', getSortIcon('marketCap'))}></i></th>
              <th style={{ width: '8%' }} onClick={() => handleSort('weekHigh')}>주간고가 <i className={clsx('bx', getSortIcon('weekHigh'))}></i></th>
              <th style={{ width: '8%' }} onClick={() => handleSort('weekLow')}>주간저가 <i className={clsx('bx', getSortIcon('weekLow'))}></i></th>
              <th style={{ width: '8%' }} onClick={() => handleSort('lastWeek')}>전주종가 <i className={clsx('bx', getSortIcon('lastWeek'))}></i></th>
              <th style={{ width: '16%' }}>금주 공시</th>
              <th style={{ width: '15%' }}>금주 이슈</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((company) => {
              // 이름 앞 숫자 제거 (e.g., "1시프트업" -> "시프트업")
              const cleanedCompanyName = company.companyName.replace(/^[0-9]+\s*/, '');

              return (
                <tr 
                  key={company.symbol}
                  className={clsx({ [styles.selected]: selectedItems.has(company.symbol) })}
                >
                  {/* 선택 */}
                  <td data-label="선택" className={styles.centerAlign}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(company.symbol)}
                      onChange={() => handleSelectItem(company.symbol)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>

                  {/* 순위 */}
                  <td data-label="순위" className={clsx(styles.bold, styles.centerAlign)}>
                    {company.marketCapRank || '-'}
                  </td>

                  {/* 기업명 (클릭 가능) */}
                  <td data-label="기업명" className={styles.companyName} onClick={(e) => handleCellClick(company, e)}>
                    <div className={styles.companyInfo}>
                      <span className={styles.rank}>{company.marketCapRank}</span>
                      <span className={styles.name}>{cleanedCompanyName}</span>
                    </div>
                  </td>

                  {/* 국가 */}
                  <td data-label="국가" className={styles.centerAlign}>
                    <span className={clsx(styles.countryBadge, getCountryClass(company.country))}>
                      {company.country}
                    </span>
                  </td>

                  {/* 현재가 */}
                  <td data-label="현재가" className={styles.monospace}>{formatNumber(company.currentPrice)}원</td>

                  {/* 등락률 */}
                  <td 
                    data-label="등락률(%)" 
                    className={clsx(
                      styles.monospace,
                      styles.bold,
                      styles.rightAlign,
                      company.changeRate === null ? styles.textNeutral :
                      company.changeRate > 0 ? styles.textPositive :
                      styles.textNegative
                    )}
                  >
                    {company.changeRate !== null ? 
                      `${company.changeRate > 0 ? '+' : ''}${company.changeRate.toFixed(2)}%` : 'N/A'}
                  </td>

                  {/* 시가총액 */}
                  <td data-label="시가총액(억)" className={clsx(styles.monospace, styles.bold, styles.rightAlign)}>
                    {company.marketCap ? `${formatNumber(company.marketCap)}억` : 'N/A'}
                  </td>

                  {/* 주간고가 */}
                  <td data-label="주간고가" className={clsx(styles.monospace, styles.bold, styles.rightAlign)}>
                    {formatNumber(company.weekHigh)}원
                  </td>

                  {/* 주간저가 */}
                   <td data-label="주간저가" className={clsx(styles.monospace, styles.bold, styles.rightAlign)}>
                    {formatNumber(company.weekLow)}원
                  </td>

                  {/* 전주종가 */}
                  <td data-label="전주종가" className={clsx(styles.monospace, styles.bold, styles.rightAlign)}>
                    {formatNumber(company.lastWeek)}원
                  </td>

                  {/* 금주 공시 */}
                  <td data-label="금주 공시" className={styles.disclosureCell}>
                    {company.disclosures.length > 0 ? (
                      <div className={styles.disclosureList}>
                        {company.disclosures.slice(0, 3).map((disclosure, index) => (
                          <div key={index} className={styles.disclosureItem}>
                            <span className={styles.title}>{disclosure.disclosure_title}</span>
                            <span className={styles.date}>{disclosure.disclosure_date}</span>
                          </div>
                        ))}
                        {company.disclosures.length > 3 && (
                          <div className={styles.moreItems}>
                            +{company.disclosures.length - 3}개 더 보기
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={styles.noItems}>공시 없음</span>
                    )}
                  </td>

                  {/* 금주 이슈 */}
                  <td data-label="금주 이슈" className={styles.issueCell}>
                    {company.issues.length > 0 ? (
                      <div>
                        {company.issues.slice(0, 2).map((issue, idx) => (
                          <div key={idx} className={clsx(styles.item, {
                            [styles.positive]: issue.sentiment === 'positive',
                            [styles.negative]: issue.sentiment === 'negative',
                            [styles.default]: issue.sentiment === 'neutral'
                          })}>
                            <div className={styles.itemTitle}>
                              {issue.original_title.length > 30 ? 
                                `${issue.original_title.substring(0, 30)}...` : 
                                issue.original_title}
                            </div>
                            <div className={styles.itemMeta}>
                              {issue.published_date} · {issue.category}
                            </div>
                          </div>
                        ))}
                        {company.issues.length > 2 && (
                          <div className={styles.moreItems}>
                            +{company.issues.length - 2}개 더
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={styles.noItems}>이슈 없음</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* 팝업 */}
      {showPopup && (
        <MiniPopup
          stock={showPopup.stock}
          position={showPopup.position}
          onClose={() => setShowPopup(null)}
        />
      )}
    </div>
  );
};

const DigestPage: React.FC = () => {
  const [integratedData, setIntegratedData] = useState<IntegratedCompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Weekly Digest', active: true }
  ];

  // 데이터 통합 함수
  const integrateData = async () => {
    try {
      setLoading(true);
      
      // 공시+기업 정보를 한 번에 가져오기 (이슈 API는 일시적으로 비활성화)
      const [stockResponse, disclosuresWithCompaniesResponse] = 
        await Promise.all([
          apiClient.getAllStocks().catch(() => ({ data: [] })),
          apiClient.getDisclosuresWithCompanies().catch(() => ({ disclosures: [], companies: [] }))
          // apiClient.getWeeklyIssues().catch(() => ({ data: [] })) // 일시적으로 비활성화
        ]);
      
      // 이슈 데이터는 빈 배열로 설정
      const issuesResponse = { data: [] };

      const stockData: WeeklyStockPrice[] = stockResponse.data || [];
      const companies: GameCompany[] = disclosuresWithCompaniesResponse.companies || [];
      const disclosures: WeeklyDisclosure[] = disclosuresWithCompaniesResponse.disclosures || [];
      const issues: WeeklyIssue[] = issuesResponse.data || [];

      console.log('📊 API 응답 데이터 확인:');
      console.log('Stock data:', stockData.length, '개');
      console.log('Companies:', companies.length, '개'); 
      console.log('Disclosures:', disclosures.length, '개');
      console.log('Issues:', issues.length, '개');
      
      if (disclosures.length > 0) {
        console.log('공시 데이터 샘플:', disclosures[0]);
      }

      // 기업 정보가 없으면 공시 데이터에서 추출해서 생성
      let enhancedCompanies = [...companies];
      if (companies.length === 0 && disclosures.length > 0) {
        console.log('🔧 기업 정보가 없어서 공시 데이터에서 생성합니다.');
        const companyMap = new Map<string, { name: string; stock_code: string }>();
        
        disclosures.forEach(disclosure => {
          if (!companyMap.has(disclosure.stock_code)) {
            companyMap.set(disclosure.stock_code, {
              name: disclosure.company_name,
              stock_code: disclosure.stock_code
            });
          }
        });
        
        enhancedCompanies = Array.from(companyMap.values()).map(comp => ({
          symbol: comp.stock_code,
          name: comp.name,
          country: 'KR' // 한국 기업으로 가정
        }));
        
        console.log('🔧 생성된 기업 정보:', enhancedCompanies.length, '개');
        console.log('🔧 생성된 기업 목록:', enhancedCompanies);
      }

      // symbol 기준 중복 제거
      const seen = new Set<string>();
      const integrated: IntegratedCompanyData[] = stockData
        .map(stock => {
          // stock.symbol이 이름으로 오고 있으므로, 이를 종목 코드로 변환
          const stockSymbolFromName = GAME_COMPANIES_MAP[stock.symbol] || stock.symbol;
          const normalizedStockSymbol = String(stockSymbolFromName).trim().replace(/^0+/, '');

          const company = enhancedCompanies.find(c => String(c.symbol).trim().replace(/^0+/, '') === normalizedStockSymbol);
          
          const companyDisclosures = disclosures.filter(d => 
            String(d.stock_code).trim().replace(/^0+/, '') === normalizedStockSymbol
          );
          
          const companyIssues = issues.filter(i => i.corp === stock.symbol);
          
          console.log(`[매칭] Stock(이름): ${stock.symbol} -> Symbol: ${normalizedStockSymbol} | Disclosures: ${companyDisclosures.length}`);
          
          return {
            symbol: normalizedStockSymbol, // 이제 진짜 심볼(종목코드)을 사용
            companyName: stock.symbol, // 이름은 stock.symbol에서 가져옴
            country: company?.country || 'KR',
            marketCap: stock.marketCap,
            currentPrice: stock.today,
            changeRate: stock.changeRate,
            weekHigh: stock.weekHigh,
            weekLow: stock.weekLow,
            lastWeek: stock.lastWeek,
            market: STOCK_MARKET_MAPPING[normalizedStockSymbol] || 'Unknown',
            disclosures: companyDisclosures,
            issues: companyIssues
          };
        })
        .filter(item => {
          // 시가총액이 있거나 공시가 있으면 포함
          if (item.marketCap === null && item.disclosures.length === 0) return false;
          if (seen.has(item.symbol)) return false;
          seen.add(item.symbol);
          return true;
        })
        .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        .map((item, index) => ({
          ...item,
          marketCapRank: index + 1
        }));

      console.log('📈 통합된 데이터:', integrated.length, '개');
      console.log('공시가 있는 기업:', integrated.filter(item => item.disclosures.length > 0).length, '개');

      setIntegratedData(integrated);
      setLastUpdated(new Date().toLocaleString('ko-KR'));
    } catch (err) {
      console.error('❌ 데이터 통합 에러:', err);
      setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    integrateData();
  }, []);

  // KPI 계산
  const kpiData = useMemo(() => {
    if (integratedData.length === 0) return null;

    const totalDisclosures = integratedData.reduce((sum, item) => sum + item.disclosures.length, 0);
    const totalIssues = integratedData.reduce((sum, item) => sum + item.issues.length, 0);
    
    const topGainer = integratedData.reduce((max, item) => 
      (item.changeRate || 0) > (max.changeRate || 0) ? item : max
    );
    
    const topLoser = integratedData.reduce((min, item) => 
      (item.changeRate || 0) < (min.changeRate || 0) ? item : min
    );

    const totalMarketCap = integratedData.reduce((sum, item) => sum + (item.marketCap || 0), 0);

    return {
      topGainer,
      topLoser,
      totalDisclosures,
      totalIssues,
      totalMarketCap,
      totalCompanies: integratedData.length
    };
  }, [integratedData]);

  const handleExportExcel = (selectedData?: IntegratedCompanyData[]) => {
    const dataToExport = selectedData || integratedData;
    const count = dataToExport.length;
    const type = selectedData ? '선택된' : '전체';
    alert(`${type} ${count}개 기업의 통합 데이터 Excel 다운로드 기능을 구현중입니다.`);
  };

  const handleExportPDF = (selectedData?: IntegratedCompanyData[]) => {
    const dataToExport = selectedData || integratedData;
    const count = dataToExport.length;
    const type = selectedData ? '선택된' : '전체';
    alert(`${type} ${count}개 기업의 통합 데이터 PDF 다운로드 기능을 구현중입니다.`);
  };

  const handleCompanyClick = (symbol: string) => {
    // 상세 페이지로 이동 (추후 구현)
    alert(`${symbol} 기업의 상세 분석 페이지로 이동합니다. (준비중)`);
  };

  const handleRefresh = () => {
    setError(null);
    integrateData();
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader 
          title="Weekly Digest" 
          breadcrumbs={breadcrumbs}
          actions={
            <button className="btn-download" onClick={handleRefresh}>
              <i className='bx bx-refresh bx-spin'></i>
              <span className="text">새로고침</span>
            </button>
          }
        />
        <div className={styles.stateContainer}>
          <i className={clsx('bx bx-loader-alt bx-spin', styles.stateIcon)} style={{ color: '#3498db' }}></i>
          <p className={styles.stateText}>통합 대시보드 데이터를 불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageHeader 
          title="Weekly Digest" 
          breadcrumbs={breadcrumbs}
          actions={
            <button className="btn-download" onClick={handleRefresh}>
              <i className='bx bx-refresh'></i>
              <span className="text">다시 시도</span>
            </button>
          }
        />
        <div className={styles.stateContainer}>
          <i className={clsx('bx bxs-error', styles.stateIcon)} style={{ color: '#e74c3c' }}></i>
          <h3 className={styles.errorTitle}>데이터 로딩 오류</h3>
          <p className={styles.stateText}>{error}</p>
          <button onClick={handleRefresh} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader 
        title="Weekly Digest" 
        breadcrumbs={breadcrumbs}
        actions={
          <div className={styles.headerActions}>
            <button className="btn-download" onClick={() => handleExportExcel()}>
              <i className='bx bxs-file-export'></i>
              <span className="text">Excel 다운로드</span>
            </button>
            <button className="btn-download" onClick={handleRefresh}>
              <i className='bx bx-refresh'></i>
              <span className="text">새로고침</span>
            </button>
          </div>
        }
      />

      <div className={styles.pageContainer}>
        {/* 요약 정보 헤더 */}
        <div className={styles.summaryHeader}>
          <div className={styles.backgroundCircle} />
          
          <div className={styles.content}>
            <div className={styles.titleSection}>
              <h1>게임산업 주간 통합 리포트</h1>
              <p>총 {integratedData.length}개 게임기업의 주가·공시·이슈 통합 분석</p>
            </div>
            <div className={styles.updateSection}>
              <div className={styles.label}>최종 업데이트</div>
              <div className={styles.timestamp}>{lastUpdated}</div>
            </div>
          </div>
        </div>

        {/* KPI 카드들 */}
        {kpiData && (
          <div className={styles.kpiGrid}>
            <KPICard
              title="주간 최고 수익률"
              value={`${kpiData.topGainer.changeRate?.toFixed(2)}%`}
              subtitle={`${kpiData.topGainer.companyName} (${kpiData.topGainer.symbol})`}
              icon="bx-trending-up"
              color="#27ae60"
              trend="up"
            />
            <KPICard
              title="주간 최대 하락률"
              value={`${kpiData.topLoser.changeRate?.toFixed(2)}%`}
              subtitle={`${kpiData.topLoser.companyName} (${kpiData.topLoser.symbol})`}
              icon="bx-trending-down"
              color="#e74c3c"
              trend="down"
            />
            <KPICard
              title="총 공시 건수"
              value={kpiData.totalDisclosures.toString()}
              subtitle="이번 주 전체 공시"
              icon="bxs-file-doc"
              color="#f39c12"
            />
            <KPICard
              title="총 이슈 건수"
              value={kpiData.totalIssues.toString()}
              subtitle="이번 주 전체 이슈"
              icon="bxs-news"
              color="#9b59b6"
            />
            <KPICard
              title="전체 시가총액"
              value={`${(kpiData.totalMarketCap / 10000).toFixed(1)}조원`}
              subtitle={`${kpiData.totalCompanies}개 기업 합계`}
              icon="bxs-bar-chart-alt-2"
              color="#3498db"
            />
          </div>
        )}

        {/* 통합 테이블 */}
        <IntegratedTable
          data={integratedData}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onCompanyClick={handleCompanyClick}
        />
      </div>
    </Layout>
  );
};

export default DigestPage; 