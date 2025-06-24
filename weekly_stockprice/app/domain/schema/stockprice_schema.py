from pydantic import BaseModel
from typing import Optional

class WeeklyStockPriceResponse(BaseModel):
    """주간 주가 데이터 응답 모델"""
    symbol: str
    marketCap: Optional[int] = None  # 시가총액 (억원 단위)
    today: Optional[int] = None      # 이번 주 금요일 종가
    lastWeek: Optional[int] = None   # 전주 금요일 종가
    changeRate: Optional[float] = None  # 주간 등락률
    weekHigh: Optional[int] = None   # 금주 고점
    weekLow: Optional[int] = None    # 금주 저점
    error: Optional[str] = None      # 오류 메시지

class StockDataPoint(BaseModel):
    """일별 주가 데이터 포인트"""
    date: str
    close: int
    high: int
    low: int
    volume: int