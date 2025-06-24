from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.service.stockprice_service import StockPriceService
from app.domain.service.stockprice_db_service import StockPriceDbService
from ..schema.stockprice_schema import (
    WeeklyStockPriceResponse,
    WeeklyStockPriceCreate,
    StockPriceListResponse,
    StockPriceBatchResponse,
    GameCompaniesResponse
)

class StockPriceController:
    def __init__(self, db_session: AsyncSession = None):
        self.service = StockPriceService()
        self.db_service = StockPriceDbService(db_session) if db_session else None
        print("🤍1 주가 컨트롤러 초기화 완료 (DB 서비스 포함)")
    
    async def get_stock_price(self, symbol: str):
        """기존 API - 하위 호환성 유지 (단순 조회용 - DB 저장 불필요)"""
        print(f"🤍2. 컨트롤러 진입: {symbol}")
        return await self.service.fetch_stock_price(symbol)
    
    async def get_weekly_stock_data(self, symbol: str) -> WeeklyStockPriceResponse:
        """주간 주가 데이터 조회 및 DB 저장"""
        print(f"🤍2. 주간 데이터 컨트롤러 진입: {symbol}")
        
        # 1. 기존 서비스로 주가 데이터 수집
        stock_data = await self.service.fetch_weekly_stock_data(symbol)
        print(f"🤍3. 주가 데이터 수집 완료: {symbol}")
        
        # 2. DB 저장 (DB 세션이 있는 경우에만)
        if self.db_service and not stock_data.error:
            try:
                # 주가 데이터를 DB 저장용 스키마로 변환
                stock_create = WeeklyStockPriceCreate(
                    symbol=stock_data.symbol,
                    market_cap=stock_data.marketCap,
                    today=stock_data.today,
                    last_week=stock_data.lastWeek,
                    change_rate=stock_data.changeRate,
                    week_high=stock_data.weekHigh,
                    week_low=stock_data.weekLow,
                    error=stock_data.error
                )
                
                # 업서트 (있으면 업데이트, 없으면 생성)
                saved_stock = await self.db_service.upsert_by_symbol(stock_create)
                print(f"🗄️4. DB 업서트 완료: {symbol}")
                
                # DB에 저장된 데이터 반환
                return saved_stock
                
            except Exception as e:
                print(f"❌ DB 저장 실패 ({symbol}): {str(e)}")
                # DB 저장 실패해도 원본 응답은 반환
        
        return stock_data
    
    async def get_all_weekly_stock_data(self) -> List[WeeklyStockPriceResponse]:
        """전체 게임기업 주간 주가 데이터 조회 및 DB 저장"""
        print("🤍2. 전체 게임기업 주간 데이터 컨트롤러 진입")
        
        # 1. 기존 서비스로 전체 주가 데이터 수집
        all_stock_data = await self.service.fetch_all_weekly_stock_data()
        print(f"🤍3. 전체 주가 데이터 수집 완료 - {len(all_stock_data)}개")
        
        # 2. DB 저장 (DB 세션이 있는 경우에만)
        if self.db_service and all_stock_data:
            try:
                # 성공한 주가 데이터만 DB 저장용으로 변환
                stock_creates = []
                for stock_data in all_stock_data:
                    if not stock_data.error:  # 에러가 없는 것만 저장
                        stock_create = WeeklyStockPriceCreate(
                            symbol=stock_data.symbol,
                            market_cap=stock_data.marketCap,
                            today=stock_data.today,
                            last_week=stock_data.lastWeek,
                            change_rate=stock_data.changeRate,
                            week_high=stock_data.weekHigh,
                            week_low=stock_data.weekLow,
                            error=stock_data.error
                        )
                        stock_creates.append(stock_create)
                
                if stock_creates:
                    # 대량 저장
                    batch_response = await self.db_service.bulk_create(stock_creates)
                    print(f"🗄️4. DB 대량 저장 완료 - 성공: {batch_response.success_count}건")
                    
                    # DB 저장 결과와 원본 데이터 병합하여 반환
                    return batch_response.results if batch_response.status == "success" else all_stock_data
                else:
                    print("🗄️4. 저장할 주가 데이터가 없음 (모두 에러)")
                
            except Exception as e:
                print(f"❌ DB 대량 저장 실패: {str(e)}")
                # DB 저장 실패해도 원본 응답은 반환
        
        return all_stock_data
    
    def get_game_companies(self) -> Dict[str, str]:
        """게임기업 리스트 반환 (단순 조회용 - DB 저장 불필요)"""
        print("🤍2. 게임기업 리스트 컨트롤러 진입")
        return self.service.get_game_companies_info()
    
    async def get_all_stocks_from_db(
        self, 
        page: int = 1, 
        page_size: int = 20
    ) -> StockPriceListResponse:
        """DB에서 모든 주가 정보 조회 (DB 전용)"""
        print(f"🤍2. DB 주가 조회 컨트롤러 진입 - 페이지: {page}")
        
        if not self.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        skip = (page - 1) * page_size
        return await self.db_service.get_all(skip=skip, limit=page_size)
    
    async def get_stock_by_symbol_from_db(self, symbol: str) -> WeeklyStockPriceResponse:
        """DB에서 특정 종목 주가 조회 (DB 전용)"""
        print(f"🤍2. DB 특정 종목 조회 컨트롤러 진입: {symbol}")
        
        if not self.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        stock_data = await self.db_service.get_by_symbol(symbol)
        if not stock_data:
            raise ValueError(f"종목 {symbol}을 찾을 수 없습니다")
        
        return stock_data
    
    async def get_top_gainers_from_db(self, limit: int = 5) -> List[WeeklyStockPriceResponse]:
        """DB에서 상승률 상위 종목 조회 (DB 전용)"""
        print(f"🤍2. DB 상승률 상위 {limit}개 조회 컨트롤러 진입")
        
        if not self.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        return await self.db_service.get_top_gainers(limit)
    
    async def get_top_losers_from_db(self, limit: int = 5) -> List[WeeklyStockPriceResponse]:
        """DB에서 하락률 상위 종목 조회 (DB 전용)"""
        print(f"🤍2. DB 하락률 상위 {limit}개 조회 컨트롤러 진입")
        
        if not self.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        return await self.db_service.get_top_losers(limit)
    
    async def get_game_companies_from_db(self) -> GameCompaniesResponse:
        """DB에서 게임기업 정보 조회 (DB 전용)"""
        print("🤍2. DB 게임기업 정보 조회 컨트롤러 진입")
        
        if not self.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        return await self.db_service.get_game_companies()
    
