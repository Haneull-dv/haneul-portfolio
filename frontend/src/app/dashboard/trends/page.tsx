"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/shared/components/Layout/Layout';
import PageHeader from '@/shared/components/PageHeader/PageHeader';

// API 베이스 URL
const STOCKPRICE_API_BASE = 'http://localhost:9006/stockprice';
const DISCLOSURE_API_BASE = 'http://localhost:8090/disclosure';
const ISSUE_API_BASE = 'http://localhost:8089/issue';
const WEEKLY_DB_API_BASE = 'http://localhost:8091/weekly';

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

// 주가 데이터 타입 정의
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

interface GameCompany {
  symbol: string;
  name: string;
  market: string;
  sector: string;
  country: string;
}

interface StockPriceListResponse {
  status: string;
  message: string;
  data: WeeklyStockPrice[];
  total_count: number;
  companies_processed: number;
  last_updated: string | null;
}

interface GameCompaniesResponse {
  status: string;
  message: string;
  companies: GameCompany[];
  total_count: number;
}

// API 호출 함수들
const apiClient = {
  // 모든 주가 정보 조회
  getAllStocks: async (): Promise<StockPriceListResponse> => {
    const response = await fetch(`${STOCKPRICE_API_BASE}/db/all`);
    if (!response.ok) {
      throw new Error('주가 데이터 조회에 실패했습니다.');
    }
    return response.json();
  },

  // 상승률 상위 종목 조회
  getTopGainers: async (limit: number = 3): Promise<WeeklyStockPrice[]> => {
    const response = await fetch(`${STOCKPRICE_API_BASE}/db/top-gainers?limit=${limit}`);
    if (!response.ok) {
      throw new Error('상승률 상위 종목 조회에 실패했습니다.');
    }
    return response.json();
  },

  // 하락률 상위 종목 조회
  getTopLosers: async (limit: number = 3): Promise<WeeklyStockPrice[]> => {
    const response = await fetch(`${STOCKPRICE_API_BASE}/db/top-losers?limit=${limit}`);
    if (!response.ok) {
      throw new Error('하락률 상위 종목 조회에 실패했습니다.');
    }
    return response.json();
  },

  // 게임기업 정보 조회
  getGameCompanies: async (): Promise<GameCompaniesResponse> => {
    const response = await fetch(`${STOCKPRICE_API_BASE}/db/companies`);
    if (!response.ok) {
      throw new Error('게임기업 정보 조회에 실패했습니다.');
    }
    return response.json();
  },

  getDbCompanies: async (): Promise<{ companies: { symbol: string; name: string; country: string }[] }> => {
    const response = await fetch(`${WEEKLY_DB_API_BASE}/companies`);
    if (!response.ok) {
      throw new Error('DB 기업 정보 조회에 실패했습니다.');
    }
    return response.json();
  },

  // Disclosure API
  getWeeklyDisclosures: async () => {
    const response = await fetch(`${DISCLOSURE_API_BASE}/db/weekly`);
    if (!response.ok) throw new Error('공시 데이터 로딩 실패');
    return await response.json();
  },

  // Issue API
  getWeeklyIssues: async () => {
    const response = await fetch(`${ISSUE_API_BASE}/db/weekly`);
    if (!response.ok) throw new Error('이슈 데이터 로딩 실패');
    return await response.json();
  },

  // 헬스체크
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await fetch(`${STOCKPRICE_API_BASE}/health`);
    if (!response.ok) {
      throw new Error('서비스 상태 확인에 실패했습니다.');
    }
    return response.json();
  }
};

// 통합 데이터 타입
interface EnrichedStockData extends WeeklyStockPrice {
  companyName: string;
  market: string;
  country: string;
  marketCapRank?: number;
  disclosures: WeeklyDisclosure[];
  issues: WeeklyIssue[];
}

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

// 트렌디한 랭킹 카드 컴포넌트
interface RankingCardProps {
  stock: EnrichedStockData;
  rank: number;
  type: 'gainer' | 'loser';
}

const RankingCard: React.FC<RankingCardProps> = ({ stock, rank, type }) => {
  const isPositive = stock.changeRate && stock.changeRate > 0;
  const cardColor = type === 'gainer' ? '#e74c3c' : '#3498db';
  const bgColor = type === 'gainer' ? '#ffeaea' : '#eaf4ff';
  
  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    return num.toLocaleString();
  };

  const getRankEmoji = (rank: number) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}위`;
    }
  };

  return (
    <div style={{
      background: bgColor,
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      border: `2px solid ${cardColor}`,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 랭킹 배지 */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: cardColor,
        color: 'white',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {getRankEmoji(rank)}
      </div>

      {/* 기업 정보 */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          margin: '0 0 4px 0',
          color: '#2c3e50'
        }}>
          {stock.companyName}
        </h3>
        <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
          {stock.symbol} · {stock.market}
        </div>
      </div>

      {/* 주가 정보 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#2c3e50',
          marginBottom: '4px'
        }}>
          {formatNumber(stock.today)}원
        </div>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: cardColor,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className={`bx ${isPositive ? 'bx-trending-up' : 'bx-trending-down'}`}></i>
          {stock.changeRate !== null ? `${stock.changeRate > 0 ? '+' : ''}${stock.changeRate.toFixed(2)}%` : 'N/A'}
        </div>
      </div>

      {/* 상세 정보 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px',
        fontSize: '13px',
        color: '#5a6c7d'
      }}>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>시가총액</div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {stock.marketCap ? `${formatNumber(stock.marketCap)}억원` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>주간 고가</div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {formatNumber(stock.weekHigh)}원
          </div>
        </div>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>전주 종가</div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {formatNumber(stock.lastWeek)}원
          </div>
        </div>
        <div>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>주간 저가</div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {formatNumber(stock.weekLow)}원
          </div>
        </div>
      </div>
    </div>
  );
};

// 미니 차트/정보 팝업 컴포넌트
interface MiniPopupProps {
  stock: EnrichedStockData;
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
          {stock.symbol} · {stock.market} · 순위 {stock.marketCapRank || 'N/A'}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
          {formatNumber(stock.today)}원
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
          <div style={{ color: '#7f8c8d', fontWeight: '600' }}>전주종가</div>
          <div style={{ color: '#2c3e50', fontWeight: 'bold' }}>
            {formatNumber(stock.lastWeek)}원
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

// 전문적인 데이터 테이블 컴포넌트
interface DataTableProps {
  data: EnrichedStockData[];
  onExportExcel: (selectedData?: EnrichedStockData[]) => void;
  onExportPDF: (selectedData?: EnrichedStockData[]) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onExportExcel, onExportPDF }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof EnrichedStockData>('marketCapRank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterPositive, setFilterPositive] = useState<'all' | 'positive' | 'negative'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showPopup, setShowPopup] = useState<{ stock: EnrichedStockData; position: { x: number; y: number } } | null>(null);
  const [quickFilter, setQuickFilter] = useState<'all' | 'top5_change' | 'top5_marketcap'>('all');
  const [filterCountry, setFilterCountry] = useState('all');

  const countryOptions = useMemo(() => {
    if (!data) return ['all'];
    const countries = new Set(data.map(item => item.country).filter(c => c !== 'Unknown'));
    return ['all', ...Array.from(countries).sort()];
  }, [data]);

  // 필터링 및 정렬된 데이터
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      const matchesSearch = item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterPositive === 'all' || 
                           (filterPositive === 'positive' && item.changeRate && item.changeRate > 0) ||
                           (filterPositive === 'negative' && item.changeRate && item.changeRate < 0);
      
      const matchesCountry = filterCountry === 'all' || item.country === filterCountry;
      
      return matchesSearch && matchesFilter && matchesCountry;
    });

    // 빠른 필터 적용
    if (quickFilter === 'top5_change') {
      filtered = filtered
        .sort((a, b) => Math.abs(b.changeRate || 0) - Math.abs(a.changeRate || 0))
        .slice(0, 5);
    } else if (quickFilter === 'top5_marketcap') {
      filtered = filtered
        .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        .slice(0, 5);
    }

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
  }, [data, searchTerm, sortField, sortDirection, filterPositive, quickFilter, filterCountry]);

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
  const handleCellClick = (stock: EnrichedStockData, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowPopup({
      stock,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleSort = (field: keyof EnrichedStockData) => {
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

  const getSortIcon = (field: keyof EnrichedStockData) => {
    if (sortField !== field) return 'bx-sort';
    return sortDirection === 'asc' ? 'bx-sort-up' : 'bx-sort-down';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* 테이블 헤더 - 검색 및 필터 */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e9ecef',
        background: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '18px', fontWeight: 'bold' }}>
            게임기업 주가 현황 ({filteredAndSortedData.length}개 기업)
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 검색 */}
            <input
              type="text"
              placeholder="기업명 또는 종목코드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px'
              }}
            />
            
            {/* 필터 */}
            <select
              value={filterPositive}
              onChange={(e) => setFilterPositive(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">전체</option>
              <option value="positive">상승</option>
              <option value="negative">하락</option>
            </select>

            {/* 국가 필터 */}
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
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

            {/* 빠른 필터 버튼 */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setQuickFilter('all')}
                style={{
                  background: quickFilter === 'all' ? '#3498db' : '#f8f9fa',
                  color: quickFilter === 'all' ? 'white' : '#7f8c8d',
                  border: '1px solid #ddd',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                전체
              </button>
              <button
                onClick={() => setQuickFilter('top5_change')}
                style={{
                  background: quickFilter === 'top5_change' ? '#3498db' : '#f8f9fa',
                  color: quickFilter === 'top5_change' ? 'white' : '#7f8c8d',
                  border: '1px solid #ddd',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                변화율 TOP5
              </button>
              <button
                onClick={() => setQuickFilter('top5_marketcap')}
                style={{
                  background: quickFilter === 'top5_marketcap' ? '#3498db' : '#f8f9fa',
                  color: quickFilter === 'top5_marketcap' ? 'white' : '#7f8c8d',
                  border: '1px solid #ddd',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                시총 TOP5
              </button>
            </div>

            {/* 다운로드 버튼 */}
            <button
              onClick={() => onExportExcel(selectedItems.size > 0 ? getSelectedData() : undefined)}
              style={{
                background: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
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
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
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
                padding: '12px 8px',
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#2c3e50',
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
                { key: 'marketCapRank', label: '순위' },
                { key: 'companyName', label: '기업명' },
                { key: 'symbol', label: '종목코드' },
                { key: 'country', label: '국가' },
                { key: 'market', label: '시장' },
                { key: 'today', label: '현재가' },
                { key: 'changeRate', label: '등락률(%)' },
                { key: 'marketCap', label: '시가총액(억원)' },
                { key: 'weekHigh', label: '주간고가' },
                { key: 'weekLow', label: '주간저가' },
                { key: 'lastWeek', label: '전주종가' },
                { key: 'disclosures', label: '금주 공시' },
                { key: 'issues', label: '금주 이슈' }
              ].map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key as keyof EnrichedStockData)}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    cursor: 'pointer',
                    borderBottom: '2px solid #dee2e6',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {column.label}
                    <i className={`bx ${getSortIcon(column.key as keyof EnrichedStockData)}`}></i>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((stock, index) => (
              <tr 
                key={`table-row-${stock.symbol}-${index}`}
                style={{
                  borderBottom: '1px solid #e9ecef',
                  background: selectedItems.has(stock.symbol) 
                    ? '#e8f4fd' 
                    : index % 2 === 0 ? 'white' : '#f8f9fa',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!selectedItems.has(stock.symbol)) {
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedItems.has(stock.symbol)) {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa';
                  }
                }}
              >
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  borderRight: '1px solid #e9ecef'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(stock.symbol)}
                    onChange={() => handleSelectItem(stock.symbol)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  fontWeight: 'bold', 
                  color: '#2c3e50',
                  borderRight: '1px solid #e9ecef'
                }}>
                  {stock.marketCapRank || '-'}
                </td>
                <td 
                  style={{ 
                    padding: '12px 8px', 
                    fontWeight: 'bold', 
                    color: '#2c3e50',
                    borderRight: '1px solid #e9ecef',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => handleCellClick(stock, e)}
                  title="클릭하면 상세 정보를 확인할 수 있습니다"
                >
                  {stock.companyName}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  color: '#2c3e50',
                  fontWeight: '600',
                  borderRight: '1px solid #e9ecef',
                  cursor: 'pointer'
                }}
                  onClick={(e) => handleCellClick(stock, e)}
                >
                  {stock.symbol}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'center',
                  borderRight: '1px solid #e9ecef'
                }}>
                  <span style={{
                    ...getCountryStyle(stock.country),
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {stock.country}
                  </span>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  color: '#2c3e50',
                  fontWeight: '600',
                  borderRight: '1px solid #e9ecef'
                }}>
                  <span style={{
                    background: stock.market === 'KOSPI' ? '#e74c3c' : stock.market === 'KOSDAQ' ? '#3498db' : '#7f8c8d',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {stock.market}
                  </span>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  fontWeight: 'bold', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  borderRight: '1px solid #e9ecef'
                }}>
                  {formatNumber(stock.today)}원
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  fontWeight: 'bold', 
                  textAlign: 'right',
                  borderRight: '1px solid #e9ecef',
                  color: stock.changeRate === null ? '#7f8c8d' : 
                         stock.changeRate > 0 ? '#e74c3c' : 
                         stock.changeRate < 0 ? '#3498db' : '#7f8c8d'
                }}>
                  {stock.changeRate !== null ? 
                    `${stock.changeRate > 0 ? '+' : ''}${stock.changeRate.toFixed(2)}%` : 'N/A'}
                </td>
                <td 
                  style={{ 
                    padding: '12px 8px', 
                    fontWeight: 'bold', 
                    textAlign: 'right',
                    color: '#2c3e50',
                    borderRight: '1px solid #e9ecef',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => handleCellClick(stock, e)}
                  title="클릭하면 상세 정보를 확인할 수 있습니다"
                >
                  {stock.marketCap ? `${formatNumber(stock.marketCap)}억원` : 'N/A'}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontWeight: '600',
                  borderRight: '1px solid #e9ecef'
                }}>
                  {formatNumber(stock.weekHigh)}원
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontWeight: '600',
                  borderRight: '1px solid #e9ecef'
                }}>
                  {formatNumber(stock.weekLow)}원
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  textAlign: 'right',
                  color: '#2c3e50',
                  fontWeight: '600'
                }}>
                  {formatNumber(stock.lastWeek)}원
                </td>
                <td style={{ padding: '12px 8px', borderRight: '1px solid #e9ecef' }}>
                  {stock.disclosures.length > 0 ? (
                    <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                      {stock.disclosures.slice(0, 2).map((disclosure, idx) => (
                        <div key={idx} style={{ 
                          marginBottom: '6px',
                          padding: '6px 10px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                            {disclosure.title.length > 25 ? 
                              `${disclosure.title.substring(0, 25)}...` : 
                              disclosure.title}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '11px' }}>
                            {disclosure.date} · {disclosure.category}
                          </div>
                        </div>
                      ))}
                      {stock.disclosures.length > 2 && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#7f8c8d', 
                          textAlign: 'center',
                          marginTop: '4px'
                        }}>
                          +{stock.disclosures.length - 2}개 더
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#bdc3c7', fontSize: '12px' }}>공시 없음</span>
                  )}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {stock.issues.length > 0 ? (
                    <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                      {stock.issues.slice(0, 2).map((issue, idx) => (
                        <div key={idx} style={{ 
                          marginBottom: '6px',
                          padding: '6px 10px',
                          background: issue.sentiment === 'positive' ? '#e8f5e8' :
                                     issue.sentiment === 'negative' ? '#ffeaea' : '#f8f9fa',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                            {issue.title.length > 25 ? 
                              `${issue.title.substring(0, 25)}...` : 
                              issue.title}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '11px' }}>
                            {issue.date} · {issue.source}
                          </div>
                        </div>
                      ))}
                      {stock.issues.length > 2 && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#7f8c8d', 
                          textAlign: 'center',
                          marginTop: '4px'
                        }}>
                          +{stock.issues.length - 2}개 더
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

const TrendsPage: React.FC = () => {
  const [topGainers, setTopGainers] = useState<EnrichedStockData[]>([]);
  const [topLosers, setTopLosers] = useState<EnrichedStockData[]>([]);
  const [allStocksData, setAllStocksData] = useState<EnrichedStockData[]>([]);
  const [companies, setCompanies] = useState<GameCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Market Trends', active: true }
  ];

  // 데이터 통합 함수 (중복 제거 포함)
  const enrichStockData = (
    stockData: WeeklyStockPrice[], 
    companies: GameCompany[],
    disclosures: WeeklyDisclosure[],
    issues: WeeklyIssue[],
    dbCompanies: { symbol: string; name: string; country: string }[]
  ): EnrichedStockData[] => {
    // 안전성 검사
    if (!Array.isArray(stockData) || stockData.length === 0) {
      return [];
    }
    
    if (!Array.isArray(companies)) {
      companies = [];
    }

    // 중복 제거: symbol 기준으로 유니크한 데이터만 유지
    const uniqueStocks = stockData.filter((stock, index, self) => 
      stock && stock.symbol && index === self.findIndex(s => s && s.symbol === stock.symbol)
    );

    return uniqueStocks.map(stock => {
      const company = companies.find(c => c && c.symbol === stock.symbol);
      const dbCompany = dbCompanies.find(c => c && c.symbol === stock.symbol);
      const companyDisclosures = disclosures.filter(d => d.symbol === stock.symbol);
      const companyIssues = issues.filter(i => i.symbol === stock.symbol);
      return {
        ...stock,
        companyName: company?.name || stock.symbol || 'Unknown',
        market: STOCK_MARKET_MAPPING[stock.symbol] || company?.market || 'Unknown',
        country: dbCompany?.country || 'Unknown',
        disclosures: companyDisclosures,
        issues: companyIssues
      };
    }).sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .map((stock, index) => ({
        ...stock,
        marketCapRank: stock.marketCap ? index + 1 : undefined
      }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        gainersData, 
        losersData, 
        companiesData, 
        allStocksResponse,
        disclosuresResponse,
        issuesResponse,
        dbCompaniesResponse
      ] = await Promise.all([
        apiClient.getTopGainers(3),
        apiClient.getTopLosers(3),
        apiClient.getGameCompanies(),
        apiClient.getAllStocks(),
        apiClient.getWeeklyDisclosures().catch(() => ({ data: [] })),
        apiClient.getWeeklyIssues().catch(() => ({ data: [] })),
        apiClient.getDbCompanies().catch(() => ({ companies: [] }))
      ]);

      // 데이터 유효성 검사
      const validGainers = Array.isArray(gainersData) ? gainersData : [];
      const validLosers = Array.isArray(losersData) ? losersData : [];
      const validCompanies = Array.isArray(companiesData?.companies) ? companiesData.companies : [];
      const validAllStocks = Array.isArray(allStocksResponse?.data) ? allStocksResponse.data : [];
      const validDisclosures = Array.isArray(disclosuresResponse.data) ? disclosuresResponse.data : [];
      const validIssues = Array.isArray(issuesResponse.data) ? issuesResponse.data : [];
      const validDbCompanies = Array.isArray(dbCompaniesResponse.companies) ? dbCompaniesResponse.companies : [];

      setCompanies(validCompanies);
      
      // 데이터 통합 (빈 배열도 안전하게 처리)
      const enrichedGainers = enrichStockData(validGainers, validCompanies, validDisclosures, validIssues, validDbCompanies);
      const enrichedLosers = enrichStockData(validLosers, validCompanies, validDisclosures, validIssues, validDbCompanies);
      const enrichedAllStocks = enrichStockData(validAllStocks, validCompanies, validDisclosures, validIssues, validDbCompanies);

      setTopGainers(enrichedGainers);
      setTopLosers(enrichedLosers);
      setAllStocksData(enrichedAllStocks);
      setLastUpdated(new Date().toLocaleString('ko-KR'));
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setError(null);
    fetchData();
  };

  // 엑셀 다운로드 함수
  const handleExportExcel = (selectedData?: EnrichedStockData[]) => {
    const dataToExport = selectedData || allStocksData;
    const count = dataToExport.length;
    const type = selectedData ? '선택된' : '전체';
    
    // 실제 구현 시 xlsx 라이브러리 사용
    alert(`${type} ${count}개 기업의 Excel 다운로드 기능을 구현중입니다.`);
  };

  // PDF 다운로드 함수
  const handleExportPDF = (selectedData?: EnrichedStockData[]) => {
    const dataToExport = selectedData || allStocksData;
    const count = dataToExport.length;
    const type = selectedData ? '선택된' : '전체';
    
    // 실제 구현 시 jspdf 라이브러리 사용
    alert(`${type} ${count}개 기업의 PDF 다운로드 기능을 구현중입니다.`);
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader 
          title="Market Trends" 
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
          <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: '#e91e63', marginBottom: '20px' }}></i>
          <p style={{ color: '#666', fontSize: '18px' }}>시장 동향 데이터를 불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageHeader 
          title="Market Trends" 
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
            background: '#e91e63',
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
        title="Market Trends" 
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

      <div style={{ padding: '20px' }}>
        {/* 요약 정보 헤더 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          padding: '30px', 
          borderRadius: '16px', 
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
            🎮 게임기업 주가 동향 분석
          </h1>
          <p style={{ margin: '0 0 15px 0', fontSize: '16px', opacity: 0.9 }}>
            실시간 주가 정보 및 시장 동향 분석 (총 {allStocksData.length}개 기업)
          </p>
          {lastUpdated && (
            <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>
              📊 마지막 업데이트: {lastUpdated}
            </p>
          )}
        </div>

        {/* 상위 랭킹 카드 섹션 */}
        <div style={{ marginBottom: '40px' }}>
          {/* 상승률 TOP 3 */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              marginBottom: '20px', 
              color: '#2c3e50',
              fontSize: '22px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📈 주간 상승률 TOP 3
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '20px' 
            }}>
              {topGainers.map((stock, index) => (
                <RankingCard 
                  key={`gainer-${stock.symbol}-${index}`}
                  stock={stock} 
                  rank={index + 1}
                  type="gainer"
                />
              ))}
            </div>
          </section>

          {/* 하락률 TOP 3 */}
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              marginBottom: '20px', 
              color: '#2c3e50',
              fontSize: '22px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📉 주간 하락률 TOP 3
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '20px' 
            }}>
              {topLosers.map((stock, index) => (
                <RankingCard 
                  key={`loser-${stock.symbol}-${index}`}
                  stock={stock} 
                  rank={index + 1}
                  type="loser"
                />
              ))}
            </div>
          </section>
        </div>

        {/* 전체 데이터 테이블 */}
        <section>
          <h2 style={{ 
            marginBottom: '20px', 
            color: '#2c3e50',
            fontSize: '22px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📊 전체 게임기업 주가 현황 (시가총액 순)
          </h2>
          <DataTable 
            data={allStocksData}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
        </section>
      </div>
    </Layout>
  );
};

export default TrendsPage; 