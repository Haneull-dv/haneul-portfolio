from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.domain.service.disclosure_service import DisclosureService
from app.domain.service.disclosure_db_service import DisclosureDbService
from weekly_disclosure.app.domain.model.disclosure_schema import DisclosureResponse
from weekly_disclosure.app.domain.schema.disclosure_schema import (
    DisclosureItemCreate, 
    DisclosureListResponse
)

class DisclosureController:
    def __init__(self, db_session: AsyncSession = None):
        self.service = DisclosureService()
        self.db_service = DisclosureDbService(db_session) if db_session else None
        print("🎯1 컨트롤러 초기화 완료 (DB 서비스 포함)")

    async def fetch_game_companies_disclosures(self) -> DisclosureResponse:
        """게임기업들의 최신 공시 정보를 조회하고 DB에 저장"""
        print("🎯2 컨트롤러 진입 - 공시 조회 시작")
        
        # 1. 기존 서비스로 공시 데이터 수집
        disclosure_response = await self.service.get_game_companies_disclosures()
        print(f"🎯3 공시 데이터 수집 완료 - {len(disclosure_response.disclosures)}건")
        
        # 2. DB 저장 (DB 세션이 있는 경우에만)
        if self.db_service and disclosure_response.disclosures:
            try:
                # 공시 데이터를 DB 저장용 스키마로 변환
                disclosure_creates = []
                for disclosure in disclosure_response.disclosures:
                    disclosure_create = DisclosureItemCreate(
                        company_name=disclosure.get("company_name", ""),
                        stock_code=disclosure.get("stock_code", ""),
                        disclosure_title=disclosure.get("disclosure_title", ""),
                        disclosure_date=disclosure.get("disclosure_date", ""),
                        report_name=disclosure.get("report_name", "")
                    )
                    disclosure_creates.append(disclosure_create)
                
                # 대량 저장
                saved_disclosures = await self.db_service.bulk_create(disclosure_creates)
                print(f"🗄️4 DB 저장 완료 - {len(saved_disclosures)}건")
                
            except Exception as e:
                print(f"❌ DB 저장 실패: {str(e)}")
                # DB 저장 실패해도 원본 응답은 반환
        
        return disclosure_response
    
    async def get_recent_disclosures_from_db(
        self, 
        days: int = 7
    ) -> DisclosureListResponse:
        """DB에서 최근 공시 정보 조회 (DB 전용)"""
        print(f"🎯2 DB 조회 컨트롤러 진입 - 최근 {days}일")
        
        if not self.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        return await self.db_service.get_all()
    
    async def search_disclosures(
        self,
        company_name: str = None,
        stock_code: str = None,
        page: int = 1,
        page_size: int = 20
    ) -> DisclosureListResponse:
        """DB에서 공시 검색 (DB 전용)"""
        print(f"🎯2 DB 검색 컨트롤러 진입 - 회사: {company_name}, 코드: {stock_code}")
        
        if not self.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        return await self.db_service.search_disclosures(
            company_name=company_name,
            stock_code=stock_code,
            page=page,
            page_size=page_size
        ) 