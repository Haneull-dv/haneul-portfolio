from typing import Dict, Any
from app.domain.service.stockprice_service import StockPriceService

class StockPriceController:
    def __init__(self):
        self.service = StockPriceService()
    
    async def get_stock_price(self, symbol: str):
        print(f"🤍2. 컨트롤러 진입: {symbol}")
        return await self.service.fetch_stock_price(symbol)
    
