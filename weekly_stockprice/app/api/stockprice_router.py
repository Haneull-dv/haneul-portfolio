from fastapi import APIRouter
from typing import List
from app.domain.controller.stockprice_controller import StockPriceController
from ..domain.schema.stockprice_schema import WeeklyStockPriceResponse

router = APIRouter()
controller = StockPriceController()

@router.get("/price")
async def get_stock_price(symbol: str = "259960"):
    """기존 API - 하위 호환성 유지"""
    print(f"🤍1. 라우터 진입: {symbol}")
    return await controller.get_stock_price(symbol)

@router.get("/weekly/{symbol}", response_model=WeeklyStockPriceResponse)
async def get_weekly_stock_data(symbol: str):
    """주간 주가 데이터 조회"""
    print(f"🤍1. 주간 데이터 라우터 진입: {symbol}")
    return await controller.get_weekly_stock_data(symbol)

@router.get("/weekly", response_model=List[WeeklyStockPriceResponse])
async def get_all_weekly_stock_data():
    """전체 게임기업 주간 주가 데이터 조회"""
    print("🤍1. 전체 게임기업 주간 데이터 라우터 진입")
    return await controller.get_all_weekly_stock_data()

@router.get("/companies")
async def get_game_companies():
    """게임기업 리스트 조회"""
    print("🤍1. 게임기업 리스트 라우터 진입")
    return controller.get_game_companies()

@router.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    return {"status": "healthy", "service": "weekly_stockprice"}

