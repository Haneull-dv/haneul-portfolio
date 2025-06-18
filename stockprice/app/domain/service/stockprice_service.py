import asyncio
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random
import httpx
from bs4 import BeautifulSoup

class StockPriceService:
    async def fetch_stock_price(self, symbol: str):
        print(f"🤍[서비스 진입] 심볼: {symbol}")
        
        url = f"https://finance.naver.com/item/main.naver?code={symbol}"
        headers = {"User-Agent": "Mozilla/5.0"}
        print(f"📡 [요청 URL] {url}")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                html = response.text  # 자동 디코딩됨
                print(f"✅ [응답 수신 완료] 길이: {len(html)} bytes")

        except httpx.RequestError as e:
            print(f"❌ [요청 실패] {e}")
            return {"symbol": symbol, "error": f"Request error: {e}"}

        soup = BeautifulSoup(html, "html.parser")

        try:
            today_price = soup.select_one("p.no_today span.blind").text.replace(",", "")
            print(f"📈 [오늘 종가] {today_price}")

            yesterday_price = soup.select("td.first span.blind")[0].text.replace(",", "")
            print(f"📉 [어제 종가] {yesterday_price}")

            change_rate = ((int(today_price) - int(yesterday_price)) / int(yesterday_price)) * 100
            print(f"📊 [등락률] {change_rate:.2f}%")

            return {
                "symbol": symbol,
                "today": int(today_price),
                "yesterday": int(yesterday_price),
                "changeRate": f"{change_rate:.2f}%"
            }

        except Exception as e:
            print(f"⚠️ [파싱 실패] {e}")
            return {"symbol": symbol, "error": str(e)}
