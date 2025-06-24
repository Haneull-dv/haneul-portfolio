from typing import Dict, Any, List
import asyncio
from app.domain.service.stockprice_service import StockPriceService
from ..schema.stockprice_schema import WeeklyStockPriceResponse

class StockPriceController:
    def __init__(self):
        self.service = StockPriceService()
    
    async def get_stock_price(self, symbol: str):
        """기존 API - 하위 호환성 유지"""
        print(f"🤍2. 컨트롤러 진입: {symbol}")
        return await self.service.fetch_stock_price(symbol)
    
    async def get_weekly_stock_data(self, symbol: str) -> WeeklyStockPriceResponse:
        """주간 주가 데이터 조회"""
        print(f"🤍2. 주간 데이터 컨트롤러 진입: {symbol}")
        return await self.service.fetch_weekly_stock_data(symbol)
    
    async def get_all_weekly_stock_data(self) -> List[WeeklyStockPriceResponse]:
        """전체 게임기업 주간 주가 데이터 조회"""
        print("🤍2. 전체 게임기업 주간 데이터 컨트롤러 진입")
        
        # 모든 게임기업 종목코드 가져오기
        game_companies = self.service.game_companies
        
        # 병렬로 모든 기업 데이터 수집
        tasks = [
            self.service.fetch_weekly_stock_data(code) 
            for code in game_companies.keys()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 결과 정리 (예외 처리된 결과 제외)
        weekly_data = []
        for result in results:
            if isinstance(result, WeeklyStockPriceResponse):
                weekly_data.append(result)
            elif isinstance(result, Exception):
                print(f"❌ 기업 데이터 수집 실패: {str(result)}")
        
        print(f"✅ 전체 게임기업 데이터 수집 완료: {len(weekly_data)}개")
        return weekly_data
    
    def get_game_companies(self) -> Dict[str, str]:
        """게임기업 리스트 반환"""
        print("🤍2. 게임기업 리스트 컨트롤러 진입")
        return {
            "companies": self.service.game_companies,
            "total_count": len(self.service.game_companies)
        }
    
