import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

# 내부 모듈 import
from app.domain.schema.disclosure_schema import (
    DisclosureItemCreate, 
    DisclosureResponse,
    DisclosureItem
)
from app.domain.service.disclosure_db_service import DisclosureDbService
from app.config.companies import GAME_COMPANIES, TOTAL_COMPANIES
from app.config.settings import DART_API_KEY, DART_BASE_URL, DEFAULT_DAYS_BACK

class DisclosureService:
    def __init__(self, db_session: AsyncSession = None):
        # Config에서 설정 로드
        self.api_key = DART_API_KEY
        self.base_url = DART_BASE_URL
        self.game_companies = GAME_COMPANIES
        self.default_days_back = DEFAULT_DAYS_BACK
        self.db_service = DisclosureDbService(db_session) if db_session else None
        
        print(f"⚙️1 서비스 초기화 완료 - 게임기업 {TOTAL_COMPANIES}개 등록 (DB 세션: {'있음' if db_session else '없음'})")

    async def fetch_and_process_disclosures(self) -> DisclosureResponse:
        """
        공시 조회, DB 저장, 최종 응답 생성을 모두 처리하는 메인 서비스 메소드
        """
        print("⚙️2 서비스 메인 로직 시작")
        
        # 1. DART API로부터 '생성용 데이터' 리스트를 받음
        disclosure_creates, bgn_de, end_de = await self._fetch_from_dart()
        print(f"⚙️3 DART API로부터 {len(disclosure_creates)}건 수집 완료")
        
        # 2. DB 저장 (DB 세션이 있고, 저장할 데이터가 있는 경우)
        if self.db_service and disclosure_creates:
            try:
                # 서비스가 이미 생성용 스키마로 데이터를 만들어줬으므로 바로 저장
                saved_disclosures = await self.db_service.bulk_create(disclosure_creates)
                print(f"🗄️4 DB 저장 완료 - {len(saved_disclosures)}건")
                
                # DB 저장된 최종 결과를 응답용 스키마로 변환
                final_disclosures = [DisclosureItem.model_validate(d) for d in saved_disclosures]

                # 기업별 공시 개수 계산 (DB에 최종 저장된 기준)
                count_by_company = {company: 0 for company in GAME_COMPANIES.values()}
                for disclosure in final_disclosures:
                    if disclosure.company_name in count_by_company:
                        count_by_company[disclosure.company_name] += 1
                
                return DisclosureResponse(
                    status="success",
                    message=f"DB 저장 성공: {len(final_disclosures)}건의 신규 공시를 처리했습니다.",
                    disclosures=final_disclosures,
                    total_count=len(final_disclosures),
                    count_by_company=count_by_company
                )

            except Exception as e:
                print(f"❌ DB 저장 실패: {str(e)}")
                raise e # 에러를 컨트롤러로 전파하여 500 응답 처리
        
        # DB 세션이 없거나, 수집된 공시가 없는 경우
        return DisclosureResponse(
            status="success",
            message=f"처리할 신규 공시가 없습니다. (조회 기간: {bgn_de}~{end_de})",
            disclosures=[],
            total_count=0,
            count_by_company={co: 0 for co in GAME_COMPANIES.values()}
        )

    async def _fetch_from_dart(self) -> Tuple[List[DisclosureItemCreate], str, str]:
        """DART API를 호출하여 공시 데이터를 수집하는 내부 메소드"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=self.default_days_back)
        bgn_de = start_date.strftime("%Y%m%d")
        end_de = end_date.strftime("%Y%m%d")
        
        print(f"⚙️2-1 DART API 조회 시작 (기간: {bgn_de}~{end_de})")
        
        all_disclosures: List[DisclosureItemCreate] = []
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for stock_code, company_name in self.game_companies.items():
                task = self._fetch_company_disclosures(session, stock_code, company_name, bgn_de, end_de)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # 에러가 있었는지 확인
            errors = [r for r in results if isinstance(r, Exception)]
            if errors:
                # 첫번째 에러를 상위로 전파하여 전체 프로세스 실패로 처리
                print(f"❌ 처리 중 총 {len(errors)}개의 에러 발생. 첫번째 에러를 전파합니다.")
                raise errors[0]

            # 성공한 결과만 필터링
            for result in results:
                if result: # 에러는 이미 위에서 처리했으므로, 여기는 리스트만 존재
                    all_disclosures.extend(result)
        
        all_disclosures.sort(key=lambda item: item.disclosure_date, reverse=True)
        return all_disclosures, bgn_de, end_de

    async def _fetch_company_disclosures(self, session: aiohttp.ClientSession, stock_code: str, company_name: str, bgn_de: str, end_de: str) -> List[DisclosureItemCreate]:
        """개별 기업의 공시 정보를 '생성용 스키마'로 반환"""
        url = f"{self.base_url}/list.json"
        
        params = {
            "crtfc_key": self.api_key,
            "corp_code": stock_code,
            "bgn_de": bgn_de,
            "end_de": end_de,
            "page_no": 1,
            "page_count": 100
        }
        
        try:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    print(f"❌ [{company_name}] HTTP 에러: {response.status}")
                    return []
                
                data = await response.json()
                
                if data.get('status') != "000":
                    if data.get('status') == "013":
                        # 공시 없는 것은 정상 처리이므로 로그 생략 가능
                        pass
                    else:
                        print(f"❌ [{company_name}] API 에러: {data.get('message', 'Unknown error')}")
                    return []
                
                disclosures: List[DisclosureItemCreate] = []
                result_list = data.get('list', [])
                
                for item in result_list:
                    if company_name in item.get('corp_name', ''):
                        disclosure = DisclosureItemCreate(
                            company_name=item.get("corp_name", company_name),
                            stock_code=stock_code,
                            disclosure_title=item.get("report_nm", ""),
                            disclosure_date=item.get("rcept_dt", ""),
                            report_name=item.get("report_nm", "")
                        )
                        disclosures.append(disclosure)
                
                if disclosures:
                    print(f"✅ [{company_name}] 공시 {len(disclosures)}건 수집 완료")
                
                return disclosures
                
        except Exception as e:
            # Pydantic 에러 등을 여기서 잡아서 다시 던짐
            print(f"❌ [{company_name}] 요청 또는 데이터 처리 실패: {str(e)}")
            raise e 