from fastapi import APIRouter
from app.domain.controller.stockprice_controller import StockPriceController

router = APIRouter()
controller = StockPriceController()

@router.get("/price")
async def get_stock_price(symbol: str = "259960"):
    print(f"🤍1. 라우터 진입: {symbol}")
    return await controller.get_stock_price(symbol)

