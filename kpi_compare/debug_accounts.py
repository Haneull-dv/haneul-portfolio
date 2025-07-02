import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

DART_API_KEY = os.getenv("DART_API_KEY")
DART_API_URL = "https://opendart.fss.or.kr/api"

async def get_actual_account_ids():
    """실제 DART API에서 제공하는 account_id 목록을 확인"""
    
    # 네이버 데이터로 테스트 (로그에서 성공한 케이스)
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
            
            # 모든 account_id 수집
            account_ids = set()
            account_details = {}
            
            for item in data.get("list", []):
                account_id = item.get("account_id")
                account_nm = item.get("account_nm")
                if account_id:
                    account_ids.add(account_id)
                    account_details[account_id] = {
                        "account_nm": account_nm,
                        "thstrm_amount": item.get("thstrm_amount", "")
                    }
            
            print(f"📋 총 {len(account_ids)}개의 account_id 발견")
            print("\n📝 Account ID 목록:")
            
            # 카테고리별로 분류
            dart_accounts = []
            ifrs_accounts = []
            other_accounts = []
            
            for acc_id in sorted(account_ids):
                detail = account_details[acc_id]
                if acc_id.startswith("dart_"):
                    dart_accounts.append((acc_id, detail["account_nm"]))
                elif acc_id.startswith("ifrs-full_"):
                    ifrs_accounts.append((acc_id, detail["account_nm"]))
                else:
                    other_accounts.append((acc_id, detail["account_nm"]))
            
            print(f"\n🎯 DART 계정 ({len(dart_accounts)}개):")
            for acc_id, acc_nm in dart_accounts[:10]:  # 처음 10개만 출력
                print(f"  {acc_id} -> {acc_nm}")
            if len(dart_accounts) > 10:
                print(f"  ... 및 {len(dart_accounts)-10}개 더")
            
            print(f"\n🎯 IFRS 계정 ({len(ifrs_accounts)}개):")
            for acc_id, acc_nm in ifrs_accounts[:10]:  # 처음 10개만 출력
                print(f"  {acc_id} -> {acc_nm}")
            if len(ifrs_accounts) > 10:
                print(f"  ... 및 {len(ifrs_accounts)-10}개 더")
            
            if other_accounts:
                print(f"\n🎯 기타 계정 ({len(other_accounts)}개):")
                for acc_id, acc_nm in other_accounts:
                    print(f"  {acc_id} -> {acc_nm}")
            
            # CSV에서 찾지 못한 계정들 확인
            print(f"\n🔍 CSV에서 요구하는 주요 계정들의 실제 존재 여부:")
            required_accounts = [
                "dart_GrossProfit",
                "dart_OperatingIncomeLoss", 
                "dart_ProfitLossBeforeTaxFromContinuingOperations",
                "ifrs-full_ProfitLoss",
                "ifrs-full_Revenue",
                "ifrs-full_Assets",
                "ifrs-full_Equity"
            ]
            
            for req_acc in required_accounts:
                if req_acc in account_ids:
                    detail = account_details[req_acc]
                    print(f"  ✅ {req_acc} -> {detail['account_nm']} ({detail['thstrm_amount']})")
                else:
                    print(f"  ❌ {req_acc} -> 찾을 수 없음")
                    # 유사한 이름 찾기
                    similar = [acc for acc in account_ids if any(word in acc.lower() for word in req_acc.lower().split('_')[1:2])]
                    if similar:
                        print(f"     💡 유사한 계정: {similar[:3]}")
            
            return account_ids, account_details
            
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    asyncio.run(get_actual_account_ids()) 