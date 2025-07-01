from sqlalchemy.ext.asyncio import AsyncSession

# 서비스와 스키마를 직접 사용하지 않고, 컨트롤러는 서비스만 호출
from app.domain.service.disclosure_service import DisclosureService
from app.domain.schema.disclosure_schema import (
    DisclosureResponse,
    DisclosureListResponse
)

class DisclosureController:
    # 컨트롤러는 더 이상 DB세션을 직접 알 필요가 없음
    def __init__(self):
        print("🎯1 컨트롤러 초기화 완료")

    async def fetch_game_companies_disclosures(
        self, 
        db_session: AsyncSession
    ) -> DisclosureResponse:
        """
        서비스를 호출하여 공시 정보 조회/저장 프로세스를 실행하고 결과를 반환.
        컨트롤러는 오직 서비스 호출과 결과 반환의 역할만 수행.
        """
        print("🎯2 컨트롤러 진입 -> 서비스 호출")
        
        # 요청이 들어올 때마다 서비스 인스턴스를 생성하고 DB세션 주입
        service = DisclosureService(db_session=db_session)
        
        # 서비스의 메인 로직을 호출하고 결과 그대로 반환
        result = await service.fetch_and_process_disclosures()
        
        print(f"🎯3 컨트롤러 -> 서비스 처리 완료, 결과 반환 (총 {result.total_count}건)")
        return result
    
    async def get_recent_disclosures_from_db(
        self, 
        days: int = 7,
        db_session: AsyncSession = None
    ) -> DisclosureListResponse:
        """DB에서 최근 공시 정보 조회 (DB 전용)"""
        print(f"🎯2 DB 조회 컨트롤러 진입 - 최근 {days}일")
        
        service = DisclosureService(db_session=db_session)
        if not service.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        # 이 부분도 서비스로 로직 이동이 가능하지만, 현재는 유지
        return await service.db_service.get_all(days=days)
    
    async def search_disclosures(
        self,
        company_name: str = None,
        stock_code: str = None,
        page: int = 1,
        page_size: int = 20,
        db_session: AsyncSession = None
    ) -> DisclosureListResponse:
        """DB에서 공시 검색 (DB 전용)"""
        print(f"🎯2 DB 검색 컨트롤러 진입 - 회사: {company_name}, 코드: {stock_code}")
        
        service = DisclosureService(db_session=db_session)
        if not service.db_service:
            raise ValueError("DB 서비스가 초기화되지 않았습니다")
        
        return await service.db_service.search_disclosures(
            company_name=company_name,
            stock_code=stock_code,
            page=page,
            page_size=page_size
        ) 