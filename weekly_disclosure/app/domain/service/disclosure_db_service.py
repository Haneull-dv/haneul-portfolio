from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from ..repository.disclosure_repository import DisclosureRepository
from ..model.disclosure_model import DisclosureModel
from ..schema.disclosure_schema import (
    DisclosureItemCreate, 
    DisclosureItem, 
    DisclosureResponse,
    DisclosureListResponse
)


class DisclosureDbService:
    """공시 정보 DB 접근 전용 서비스"""
    
    def __init__(self, db_session: AsyncSession):
        self.repository = DisclosureRepository(db_session)
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100
    ) -> DisclosureListResponse:
        """모든 공시 정보 조회 (페이징)"""
        print("🗄️ [DB] 모든 공시 정보 조회")
        
        disclosures = await self.repository.get_all(skip=skip, limit=limit)
        total_count = await self.repository.count_total()
        
        disclosure_items = [
            DisclosureItem.model_validate(disclosure) 
            for disclosure in disclosures
        ]
        
        return DisclosureListResponse(
            status="success",
            message="공시 목록 조회 완료",
            data=disclosure_items,
            total_count=total_count,
            page=skip // limit + 1,
            page_size=limit
        )
    
    async def get_by_id(self, disclosure_id: int) -> Optional[DisclosureItem]:
        """ID로 공시 정보 조회"""
        print(f"🗄️ [DB] 공시 정보 조회 - ID: {disclosure_id}")
        
        disclosure = await self.repository.get_by_id(disclosure_id)
        if not disclosure:
            return None
        
        return DisclosureItem.model_validate(disclosure)
    
    async def get_by_company_name(self, company_name: str) -> List[DisclosureItem]:
        """회사명으로 공시 정보 조회"""
        print(f"🗄️ [DB] 공시 정보 조회 - 회사명: {company_name}")
        
        disclosures = await self.repository.get_by_company_name(company_name)
        return [
            DisclosureItem.model_validate(disclosure) 
            for disclosure in disclosures
        ]
    
    async def get_by_stock_code(self, stock_code: str) -> List[DisclosureItem]:
        """종목코드로 공시 정보 조회"""
        print(f"🗄️ [DB] 공시 정보 조회 - 종목코드: {stock_code}")
        
        disclosures = await self.repository.get_by_stock_code(stock_code)
        return [
            DisclosureItem.model_validate(disclosure) 
            for disclosure in disclosures
        ]
    
    async def get_by_date_range(
        self, 
        start_date: str, 
        end_date: str
    ) -> List[DisclosureItem]:
        """날짜 범위로 공시 정보 조회"""
        print(f"🗄️ [DB] 공시 정보 조회 - 기간: {start_date} ~ {end_date}")
        
        disclosures = await self.repository.get_by_date_range(start_date, end_date)
        return [
            DisclosureItem.model_validate(disclosure) 
            for disclosure in disclosures
        ]
    
    async def get_recent_disclosures(self, days: int = 7) -> List[DisclosureItem]:
        """최근 N일간의 공시 정보 조회"""
        print(f"🗄️ [DB] 최근 {days}일 공시 정보 조회")
        
        disclosures = await self.repository.get_recent_disclosures(days)
        return [
            DisclosureItem.model_validate(disclosure) 
            for disclosure in disclosures
        ]
    
    async def get_summary_statistics(self) -> Dict[str, Any]:
        """공시 데이터 요약 통계"""
        print("🗄️ [DB] 공시 요약 통계 조회")
        
        total_count = await self.repository.count_total()
        recent_disclosures = await self.repository.get_recent_disclosures(7)
        
        # 회사별 공시 수 통계
        company_stats = {}
        for disclosure in recent_disclosures:
            company = disclosure.company_name
            company_stats[company] = company_stats.get(company, 0) + 1
        
        # 최근 7일 일별 공시 수
        daily_stats = {}
        for disclosure in recent_disclosures:
            date = disclosure.disclosure_date
            daily_stats[date] = daily_stats.get(date, 0) + 1
        
        return {
            "total_disclosures": total_count,
            "recent_7days_count": len(recent_disclosures),
            "companies_with_disclosures": len(company_stats),
            "company_disclosure_distribution": dict(sorted(
                company_stats.items(), 
                key=lambda x: x[1], 
                reverse=True
            )),
            "daily_disclosure_distribution": daily_stats
        }
    
    async def count_total(self) -> int:
        """전체 공시 개수 조회"""
        print("🗄️ [DB] 전체 공시 개수 조회")
        return await self.repository.count_total()
    
    async def create(self, disclosure_data: DisclosureItemCreate) -> DisclosureItem:
        """새로운 공시 정보 생성"""
        print(f"🗄️ [DB] 공시 정보 생성 - 회사: {disclosure_data.company_name}")
        
        disclosure = await self.repository.create(disclosure_data)
        return DisclosureItem.model_validate(disclosure)
    
    async def bulk_create(
        self, 
        disclosures_data: List[DisclosureItemCreate]
    ) -> List[DisclosureItem]:
        """공시 정보 대량 생성"""
        print(f"🗄️ [DB] 공시 정보 대량 생성 - {len(disclosures_data)}건")
        
        disclosures = await self.repository.bulk_create(disclosures_data)
        return [
            DisclosureItem.model_validate(disclosure) 
            for disclosure in disclosures
        ]
    
    async def update(
        self, 
        disclosure_id: int, 
        disclosure_data: dict
    ) -> Optional[DisclosureItem]:
        """공시 정보 수정"""
        print(f"🗄️ [DB] 공시 정보 수정 - ID: {disclosure_id}")
        
        from ..schema.disclosure_schema import DisclosureItemUpdate
        update_schema = DisclosureItemUpdate(**disclosure_data)
        
        disclosure = await self.repository.update(disclosure_id, update_schema)
        if not disclosure:
            return None
        
        return DisclosureItem.model_validate(disclosure)
    
    async def delete(self, disclosure_id: int) -> bool:
        """공시 정보 삭제"""
        print(f"🗄️ [DB] 공시 정보 삭제 - ID: {disclosure_id}")
        return await self.repository.delete(disclosure_id)
    
    async def search_disclosures(
        self,
        company_name: Optional[str] = None,
        stock_code: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> DisclosureListResponse:
        """복합 조건으로 공시 검색"""
        print(f"🗄️ [DB] 공시 검색 - 조건: 회사={company_name}, 코드={stock_code}")
        
        skip = (page - 1) * page_size
        
        # 조건별 검색
        if company_name:
            disclosures = await self.repository.get_by_company_name(company_name)
        elif stock_code:
            disclosures = await self.repository.get_by_stock_code(stock_code)
        elif start_date and end_date:
            disclosures = await self.repository.get_by_date_range(start_date, end_date)
        else:
            disclosures = await self.repository.get_all(skip=skip, limit=page_size)
        
        # 페이징 적용 (이미 필터링된 결과에 대해)
        if company_name or stock_code or (start_date and end_date):
            total_count = len(disclosures)
            disclosures = disclosures[skip:skip + page_size]
        else:
            total_count = await self.repository.count_total()
        
        disclosure_items = [
            DisclosureItem.model_validate(disclosure) 
            for disclosure in disclosures
        ]
        
        return DisclosureListResponse(
            status="success",
            message="공시 검색 완료",
            data=disclosure_items,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
