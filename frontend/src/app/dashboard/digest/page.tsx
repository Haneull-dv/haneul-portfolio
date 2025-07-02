"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

// API 베이스 URL 설정
const STOCKPRICE_API_BASE = 'http://localhost:9006/stockprice';
const DISCLOSURE_API_BASE = 'http://localhost:8090/disclosure';
const ISSUE_API_BASE = 'http://localhost:8089/issue';
const WEEKLY_DB_API_BASE = 'http://localhost:8001/weekly';

// 한국 게임기업 종목코드-시장 매핑표
const STOCK_MARKET_MAPPING: Record<string, string> = {
  '036570': 'KOSPI',   // 엔씨소프트
  '251270': 'KOSPI',   // 넷마블
  '259960': 'KOSPI',   // 크래프톤
  '263750': 'KOSPI',   // 펄어비스
  '078340': 'KOSDAQ',  // 컴투스
  '112040': 'KOSDAQ',  // 위메이드
  '293490': 'KOSPI',   // 카카오게임즈
  '095660': 'KOSDAQ',  // 네오위즈
  '181710': 'KOSPI',   // NHN
  '069080': 'KOSDAQ',  // 웹젠
  '225570': 'KOSPI'    // 넥슨게임즈
};

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
  symbol: string;
  companyName: string;
  title: string;
  date: string;
  url?: string;
  category: string;
  summary?: string;
}

interface WeeklyIssue {
  symbol: string;
  companyName: string;
  title: string;
  date: string;
  category: string;
  source: string;
  url?: string;
  summary?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
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
    const response = await fetch(`${STOCKPRICE_API_BASE}/db/all`);
    if (!response.ok) throw new Error('주가 데이터 로딩 실패');
    return await response.json();
  },

  async getGameCompanies() {
    const response = await fetch(`${WEEKLY_DB_API_BASE}/companies`);
    if (!response.ok) throw new Error('기업 정보 로딩 실패');
    return await response.json();
  },

  // Disclosure API
  async getWeeklyDisclosures() {
    const response = await fetch(`${DISCLOSURE_API_BASE}/db/weekly`);
    if (!response.ok) throw new Error('공시 데이터 로딩 실패');
    return await response.json();
  },

  // Issue API
  async getWeeklyIssues() {
    const response = await fetch(`${ISSUE_API_BASE}/db/weekly`);
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

const getCountryStyle = (country: string) => {
    const styles: Record<string, { background: string; color: string }> = {
      KR: { background: '#3498db', color: 'white' },
      JP: { background: '#e74c3c', color: 'white' },
      CN: { background: '#f1c40f', color: '#2c3e50' },
      US: { background: '#2c3e50', color: 'white' },
      EU: { background: '#9b59b6', color: 'white' },
      default: { background: '#bdc3c7', color: '#2c3e50' },
    };
    return styles[country] || styles.default;
};

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

  return (
    <div style={{
      position: 'fixed',
      top: position.y + 10,
      left: position.x + 10,
      background: 'white',
      border: '2px solid #e9ecef',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: 1000,
      minWidth: '300px',
      maxWidth: '400px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '18px' }}>{stock.companyName}</h4>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#7f8c8d'
        }}>×</button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
          {stock.symbol} · {stock.country} · 순위 {stock.marketCapRank || 'N/A'}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
          {formatNumber(stock.currentPrice)}원
        </div>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 'bold',
          color: stock.changeRate === null ? '#7f8c8d' : 
                 stock.changeRate > 0 ? '#e74c3c' : 
                 stock.changeRate < 0 ? '#3498db' : '#7f8c8d'
        }}>
          {stock.changeRate !== null ? 
            `${stock.changeRate > 0 ? '+' : ''}${stock.changeRate.toFixed(2)}%` : 'N/A'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
        <div>
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>시가총액</div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold' }}>
            {stock.marketCap ? `${formatNumber(stock.marketCap)}억원` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>주간 고가</div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold' }}>
            {formatNumber(stock.weekHigh)}원
          </div>
        </div>
        <div>
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>주간 저가</div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold' }}>
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

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #f1f3f4',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: color
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#7f8c8d',
            marginBottom: '8px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '4px'
          }}>
            {value}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#95a5a6',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {trend && (
              <i className={`bx ${getTrendIcon()}`} style={{ 
                color: getTrendColor(),
                fontSize: '16px'
              }}></i>
            )}
            {subtitle}
          </div>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className={`bx ${icon}`} style={{ 
            fontSize: '24px', 
            color: color 
          }}></i>
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

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      border: '1px solid #f1f3f4'
    }}>
      {/* 테이블 헤더 - 검색 및 필터 */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #f1f3f4',
        background: '#fafbfc'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h3 style={{ 
            margin: 0, 
            color: '#2c3e50', 
            fontSize: '20px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className='bx bxs-dashboard' style={{ color: '#3498db' }}></i>
            통합 기업 분석 대시보드 ({filteredAndSortedData.length}개 기업)
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 검색 */}
            <input
              type="text"
              placeholder="기업명 또는 종목코드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '220px',
                background: 'white'
              }}
            />
            
            {/* 국가 필터 */}
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
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
              style={{
                background: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#219a52'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#27ae60'}
            >
              <i className='bx bxs-file-export'></i>
              Excel {selectedItems.size > 0 && `(${selectedItems.size}개)`}
            </button>
            
            <button
              onClick={() => onExportPDF(selectedItems.size > 0 ? getSelectedData() : undefined)}
              style={{
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#c0392b'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#e74c3c'}
            >
              <i className='bx bxs-file-pdf'></i>
              PDF {selectedItems.size > 0 && `(${selectedItems.size}개)`}
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{
                padding: '16px 12px',
                textAlign: 'center',
                borderBottom: '2px solid #dee2e6',
                width: '50px'
              }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedItems.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              {[
                { key: 'marketCapRank', label: '순위', width: '60px' },
                { key: 'companyName', label: '기업명', width: '140px' },
                { key: 'symbol', label: '종목코드', width: '80px' },
                { key: 'country', label: '국가', width: '80px' },
                { key: 'market', label: '시장', width: '80px' },
                { key: 'currentPrice', label: '현재가', width: '100px' },
                { key: 'changeRate', label: '등락률(%)', width: '100px' },
                { key: 'marketCap', label: '시가총액(억)', width: '120px' },
                { key: 'weekHigh', label: '주간고가', width: '100px' },
                { key: 'weekLow', label: '주간저가', width: '100px' },
                { key: 'lastWeek', label: '전주종가', width: '100px' },
                { key: 'disclosures', label: '금주 공시', width: '200px' },
                { key: 'issues', label: '금주 이슈', width: '200px' }
              ].map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key as keyof IntegratedCompanyData)}
                  style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    cursor: 'pointer',
                    borderBottom: '2px solid #dee2e6',
                    whiteSpace: 'nowrap',
                    width: column.width,
                    background: '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {column.label}
                    <i className={`bx ${getSortIcon(column.key as keyof IntegratedCompanyData)}`} 
                       style={{ fontSize: '14px', opacity: 0.7 }}></i>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((company, index) => (
              <tr 
                key={`${company.symbol}-${index}`}
                style={{
                  borderBottom: '1px solid #f1f3f4',
                  background: selectedItems.has(company.symbol) 
                    ? '#e8f4fd' 
                    : index % 2 === 0 ? 'white' : '#fafbfc',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!selectedItems.has(company.symbol)) {
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedItems.has(company.symbol)) {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafbfc';
                  }
                }}
              >
                {/* 선택 */}
                <td style={{ 
                  padding: '16px 12px', 
                  textAlign: 'center',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(company.symbol)}
                    onChange={() => handleSelectItem(company.symbol)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>

                {/* 순위 */}
                <td style={{ 
                  padding: '16px 12px', 
                  fontWeight: 'bold', 
                  color: '#2c3e50',
                  textAlign: 'center'
                }}>
                  {company.marketCapRank || '-'}
                </td>

                {/* 기업명 (클릭 가능) */}
                <td 
                  style={{ 
                    padding: '16px 12px', 
                    fontWeight: 'bold', 
                    color: '#2c3e50',
                    cursor: 'pointer',
                    borderLeft: '3px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderLeft = '3px solid #3498db';
                    e.currentTarget.style.color = '#3498db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeft = '3px solid transparent';
                    e.currentTarget.style.color = '#2c3e50';
                  }}
                  title="클릭하면 상세 정보를 확인할 수 있습니다"
                  onClick={(e) => handleCellClick(company, e)}
                >
                  {company.companyName}
                </td>

                {/* 종목코드 */}
                <td style={{ 
                  padding: '16px 12px', 
                  color: '#2c3e50',
                  fontWeight: '600',
                  fontFamily: 'monospace'
                }}>
                  {company.symbol}
                </td>

                {/* 국가 */}
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                  <span style={{
                    ...getCountryStyle(company.country),
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {company.country}
                  </span>
                </td>

                {/* 시장 */}
                <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                   <span style={{
                    background: company.market === 'KOSPI' ? '#e74c3c' : company.market === 'KOSDAQ' ? '#3498db' : '#7f8c8d',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {company.market}
                  </span>
                </td>

                {/* 현재가 */}
                <td style={{ 
                  padding: '16px 12px', 
                  fontWeight: 'bold', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontFamily: 'monospace'
                }}>
                  {company.currentPrice ? `${formatNumber(company.currentPrice)}원` : 'N/A'}
                </td>

                {/* 등락률 */}
                <td style={{ 
                  padding: '16px 12px', 
                  fontWeight: 'bold', 
                  textAlign: 'right',
                  color: company.changeRate === null ? '#7f8c8d' : 
                         company.changeRate > 0 ? '#e74c3c' : 
                         company.changeRate < 0 ? '#3498db' : '#7f8c8d',
                  fontFamily: 'monospace'
                }}>
                  {company.changeRate !== null ? 
                    `${company.changeRate > 0 ? '+' : ''}${company.changeRate.toFixed(2)}%` : 'N/A'}
                </td>

                {/* 시가총액 */}
                <td style={{ 
                  padding: '16px 12px', 
                  fontWeight: 'bold', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontFamily: 'monospace'
                }}>
                  {company.marketCap ? `${formatNumber(company.marketCap)}억` : 'N/A'}
                </td>

                {/* 주간고가 */}
                <td style={{ 
                  padding: '16px 12px', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontWeight: '600',
                  fontFamily: 'monospace'
                }}>
                  {formatNumber(company.weekHigh)}원
                </td>

                {/* 주간저가 */}
                 <td style={{ 
                  padding: '16px 12px', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontWeight: '600',
                  fontFamily: 'monospace'
                }}>
                  {formatNumber(company.weekLow)}원
                </td>

                {/* 전주종가 */}
                <td style={{ 
                  padding: '16px 12px', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontWeight: '600',
                  fontFamily: 'monospace'
                }}>
                  {formatNumber(company.lastWeek)}원
                </td>

                {/* 금주 공시 */}
                <td style={{ padding: '16px 12px' }}>
                  {company.disclosures.length > 0 ? (
                    <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                      {company.disclosures.slice(0, 2).map((disclosure, idx) => (
                        <div key={idx} style={{ 
                          marginBottom: '6px',
                          padding: '6px 10px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                            {disclosure.title.length > 30 ? 
                              `${disclosure.title.substring(0, 30)}...` : 
                              disclosure.title}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '11px' }}>
                            {disclosure.date} · {disclosure.category}
                          </div>
                        </div>
                      ))}
                      {company.disclosures.length > 2 && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#7f8c8d', 
                          textAlign: 'center',
                          marginTop: '4px'
                        }}>
                          +{company.disclosures.length - 2}개 더
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#bdc3c7', fontSize: '12px' }}>공시 없음</span>
                  )}
                </td>

                {/* 금주 이슈 */}
                <td style={{ padding: '16px 12px' }}>
                  {company.issues.length > 0 ? (
                    <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                      {company.issues.slice(0, 2).map((issue, idx) => (
                        <div key={idx} style={{ 
                          marginBottom: '6px',
                          padding: '6px 10px',
                          background: issue.sentiment === 'positive' ? '#e8f5e8' :
                                     issue.sentiment === 'negative' ? '#ffeaea' : '#f8f9fa',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                            {issue.title.length > 30 ? 
                              `${issue.title.substring(0, 30)}...` : 
                              issue.title}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '11px' }}>
                            {issue.date} · {issue.source}
                          </div>
                        </div>
                      ))}
                      {company.issues.length > 2 && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#7f8c8d', 
                          textAlign: 'center',
                          marginTop: '4px'
                        }}>
                          +{company.issues.length - 2}개 더
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#bdc3c7', fontSize: '12px' }}>이슈 없음</span>
                  )}
                </td>
              </tr>
            ))}
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
      
      // 모든 API에서 데이터 가져오기
      const [stockResponse, companiesResponse, disclosuresResponse, issuesResponse] = 
        await Promise.all([
          apiClient.getAllStocks().catch(() => ({ data: [] })),
          apiClient.getGameCompanies().catch(() => ({ companies: [] })),
          apiClient.getWeeklyDisclosures().catch(() => ({ data: [] })),
          apiClient.getWeeklyIssues().catch(() => ({ data: [] }))
        ]);

      const stockData: WeeklyStockPrice[] = stockResponse.data || [];
      const companies: GameCompany[] = companiesResponse.companies || [];
      const disclosures: WeeklyDisclosure[] = disclosuresResponse.data || [];
      const issues: WeeklyIssue[] = issuesResponse.data || [];

      // symbol 기준 중복 제거
      const seen = new Set<string>();
      const integrated: IntegratedCompanyData[] = stockData
        .map(stock => {
          const company = companies.find(c => c.symbol === stock.symbol);
          const companyDisclosures = disclosures.filter(d => d.symbol === stock.symbol);
          const companyIssues = issues.filter(i => i.symbol === stock.symbol);
          return {
            symbol: stock.symbol,
            companyName: company?.name || stock.symbol,
            country: company?.country || 'Unknown',
            marketCap: stock.marketCap,
            currentPrice: stock.today,
            changeRate: stock.changeRate,
            weekHigh: stock.weekHigh,
            weekLow: stock.weekLow,
            lastWeek: stock.lastWeek,
            market: STOCK_MARKET_MAPPING[stock.symbol] || 'Unknown',
            disclosures: companyDisclosures,
            issues: companyIssues
          };
        })
        .filter(item => {
          if (item.marketCap === null) return false;
          if (seen.has(item.symbol)) return false;
          seen.add(item.symbol);
          return true;
        })
        .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        .map((item, index) => ({
          ...item,
          marketCapRank: index + 1
        }));

      setIntegratedData(integrated);
      setLastUpdated(new Date().toLocaleString('ko-KR'));
    } catch (err) {
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
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          flexDirection: 'column'
        }}>
          <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: '#3498db', marginBottom: '20px' }}></i>
          <p style={{ color: '#666', fontSize: '18px' }}>통합 대시보드 데이터를 불러오는 중...</p>
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
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          flexDirection: 'column'
        }}>
          <i className='bx bxs-error' style={{ fontSize: '3rem', color: '#e74c3c', marginBottom: '20px' }}></i>
          <h3 style={{ color: '#e74c3c', marginBottom: '10px' }}>데이터 로딩 오류</h3>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '20px' }}>{error}</p>
          <button onClick={handleRefresh} style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
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
          <div style={{ display: 'flex', gap: '12px' }}>
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

      <div style={{ padding: '24px', background: '#f8f9fa', minHeight: '100vh' }}>
        {/* 요약 정보 헤더 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '400px',
            height: '400px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                  게임산업 주간 통합 리포트
                </h1>
                <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                  총 {integratedData.length}개 게임기업의 주가·공시·이슈 통합 분석
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>최종 업데이트</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{lastUpdated}</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 카드들 */}
        {kpiData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
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