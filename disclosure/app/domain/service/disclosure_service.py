import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.domain.model.data_schema import DisclosureResponse, DisclosureItem, DartApiResponse

class DisclosureService:
    def __init__(self):
        self.api_key = "7c0bec1f1e1b81e5c11ed943e2be640cc0867823"
        self.base_url = "https://opendart.fss.or.kr/api"
        
        # 게임기업 정보 (종목코드, 기업명) - 실제 corp_code는 별도로 조회 필요
        self.game_companies = {
            "036570": "엔씨소프트",
            "251270": "넷마블",
            "259960": "크래프톤", 
            "263750": "펄어비스",
            "078340": "컴투스",
            "112040": "위메이드",
            "293490": "카카오게임즈",
            "095660": "네오위즈",
            "181710": "NHN",
            "069080": "웹젠"
        }
        
        print("⚙️1 서비스 초기화 완료 - 게임기업 10개 등록")

    async def get_game_companies_disclosures(self) -> DisclosureResponse:
        """게임기업들의 최신 공시 정보를 조회"""
        print("⚙️2 서비스 진입 - 공시 조회 시작")
        
        # 최근 7일 날짜 계산
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        bgn_de = start_date.strftime("%Y%m%d")
        end_de = end_date.strftime("%Y%m%d")
        
        print(f"⚙️3 조회 기간: {bgn_de} ~ {end_de}")
        
        all_disclosures = []
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for stock_code, company_name in self.game_companies.items():
                task = self._fetch_company_disclosures(session, stock_code, company_name, bgn_de, end_de)
                tasks.append(task)
            
            print(f"⚙️4 {len(tasks)}개 기업 동시 조회 시작")
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, result in enumerate(results):
                stock_code = list(self.game_companies.keys())[i]
                company_name = self.game_companies[stock_code]
                
                if isinstance(result, Exception):
                    print(f"❌ {company_name}({stock_code}) 조회 실패: {str(result)}")
                elif result:
                    all_disclosures.extend(result)
                    print(f"✅ {company_name}({stock_code}) 조회 완료: {len(result)}개")
                else:
                    print(f"📭 {company_name}({stock_code}) 공시 없음")
        
        # 날짜순 정렬 (최신순)
        all_disclosures.sort(key=lambda x: x.disclosure_date, reverse=True)
        
        print(f"⚙️5 서비스 완료 - 총 {len(all_disclosures)}개 공시 조회")
        
        return DisclosureResponse(
            status="success",
            message=f"최근 7일간 게임기업 공시 조회 완료 ({bgn_de}~{end_de})",
            disclosures=all_disclosures,
            total_count=len(all_disclosures)
        )

    async def _fetch_company_disclosures(self, session: aiohttp.ClientSession, stock_code: str, company_name: str, bgn_de: str, end_de: str) -> List[DisclosureItem]:
        """개별 기업의 공시 정보를 조회"""
        url = f"{self.base_url}/list.json"
        
        # 우선 종목코드로 시도해보고, 실패하면 다른 방법 고려
        params = {
            "crtfc_key": self.api_key,
            "corp_cls": "Y",  # 유가증권시장
            "bgn_de": bgn_de,
            "end_de": end_de,
            "page_no": 1,
            "page_count": 100
        }
        
        try:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    print(f"❌ {company_name} HTTP 에러: {response.status}")
                    return []
                
                data = await response.json()
                
                # 응답 구조 확인을 위한 로그
                print(f"🔍 {company_name} API 응답 상태: {data.get('status', 'Unknown')}")
                
                if data.get('status') != "000":
                    if data.get('status') == "013":  # 조회된 데이터가 없음
                        print(f"📭 {company_name} 공시 없음 (최근 7일)")
                        return []
                    else:
                        print(f"❌ {company_name} API 에러: {data.get('message', 'Unknown error')}")
                        return []
                
                disclosures = []
                result_list = data.get('list', [])
                
                if result_list:
                    # 특정 회사의 공시만 필터링
                    company_disclosures = [
                        item for item in result_list 
                        if company_name in item.get('corp_name', '') or stock_code in item.get('stock_code', '')
                    ]
                    
                    for item in company_disclosures:
                        disclosure = DisclosureItem(
                            company_name=company_name,
                            stock_code=stock_code,
                            disclosure_title=item.get("report_nm", ""),
                            disclosure_date=item.get("rcept_dt", ""),
                            report_name=item.get("report_nm", "")
                        )
                        disclosures.append(disclosure)
                
                return disclosures
                
        except Exception as e:
            print(f"❌ {company_name} 요청 실패: {str(e)}")
            return [] 