import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

DART_API_KEY = os.getenv("DART_API_KEY")
DART_API_URL = "https://opendart.fss.or.kr/api"

async def find_profit_related_accounts():
    """이익 관련 실제 account_id 찾기"""
    
    params = {
        "crtfc_key": DART_API_KEY,
        "corp_code": "00126380",  # 네이버
        "bsns_year": "2025",
        "reprt_code": "11013",
        "fs_div": "CFS",
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{DART_API_URL}/fnlttSinglAcntAll.json", params=params, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "000":
                print(f"❗️ DART API 오류: {data.get('message')}")
                return
            
            # 이익 관련 키워드로 필터링
            profit_keywords = [
                "profit", "loss", "income", "revenue", "sales", "gross", "operating", 
                "이익", "손실", "수익", "매출", "영업", "당기순", "세전", "세후"
            ]
            
            profit_accounts = []
            
            for item in data.get("list", []):
                account_id = item.get("account_id", "")
                account_nm = item.get("account_nm", "")
                thstrm_amount = item.get("thstrm_amount", "")
                
                # 키워드 매칭
                if any(keyword.lower() in account_id.lower() or keyword in account_nm.lower() for keyword in profit_keywords):
                    profit_accounts.append({
                        "account_id": account_id,
                        "account_nm": account_nm,
                        "thstrm_amount": thstrm_amount
                    })
            
            print(f"💰 이익 관련 계정 {len(profit_accounts)}개 발견:")
            print("=" * 100)
            
            for acc in sorted(profit_accounts, key=lambda x: x["account_id"]):
                amount = acc["thstrm_amount"]
                if amount and amount != "-":
                    try:
                        amount_int = int(amount.replace(",", "").replace("-", ""))
                        if amount.startswith("-"):
                            amount_int = -amount_int
                        amount_formatted = f"{amount_int:,}"
                    except:
                        amount_formatted = amount
                else:
                    amount_formatted = "0"
                
                print(f"📊 {acc['account_id']}")
                print(f"   한글명: {acc['account_nm']}")
                print(f"   금액: {amount_formatted}")
                print("-" * 80)
            
            # KPI 계산에 필요한 주요 계정들 매핑 제안
            print("\n🎯 KPI 계산을 위한 계정 매핑 제안:")
            print("=" * 60)
            
            key_mappings = {
                "매출액": ["revenue", "sales", "매출"],
                "영업이익": ["operating", "영업이익"],
                "당기순이익": ["profit", "당기순이익", "순이익"],
                "매출총이익": ["gross", "매출총이익"],
                "세전이익": ["tax", "세전", "before"]
            }
            
            for kpi_name, keywords in key_mappings.items():
                print(f"\n📈 {kpi_name} 관련 계정:")
                candidates = []
                for acc in profit_accounts:
                    if any(kw.lower() in acc["account_id"].lower() or kw in acc["account_nm"].lower() for kw in keywords):
                        candidates.append(acc)
                
                if candidates:
                    for candidate in candidates[:3]:  # 상위 3개만
                        print(f"  ✅ {candidate['account_id']} -> {candidate['account_nm']}")
                else:
                    print(f"  ❌ 해당 계정을 찾을 수 없음")
            
            return profit_accounts
            
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    asyncio.run(find_profit_related_accounts()) 