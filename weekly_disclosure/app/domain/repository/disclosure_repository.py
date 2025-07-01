from typing import List, Optional
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..model.disclosure_model import DisclosureModel
from ..schema.disclosure_schema import DisclosureItemCreate, DisclosureItemUpdate


class DisclosureRepository:
    """공시 정보 Repository 클래스"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    async def create(self, disclosure_data: DisclosureItemCreate) -> DisclosureModel:
        """새로운 공시 정보 생성"""
        disclosure = DisclosureModel(
            company_name=disclosure_data.company_name,
            stock_code=disclosure_data.stock_code,
            disclosure_title=disclosure_data.disclosure_title,
            disclosure_date=disclosure_data.disclosure_date,
            report_name=disclosure_data.report_name
        )
        
        self.db.add(disclosure)
        await self.db.commit()
        await self.db.refresh(disclosure)
        return disclosure
    
    async def get_by_id(self, disclosure_id: int) -> Optional[DisclosureModel]:
        """ID로 공시 정보 조회"""
        query = select(DisclosureModel).where(DisclosureModel.id == disclosure_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[DisclosureModel]:
        """모든 공시 정보 조회 (페이징)"""
        query = (
            select(DisclosureModel)
            .order_by(desc(DisclosureModel.disclosure_date), desc(DisclosureModel.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_by_company_name(self, company_name: str) -> List[DisclosureModel]:
        """회사명으로 공시 정보 조회"""
        query = (
            select(DisclosureModel)
            .where(DisclosureModel.company_name == company_name)
            .order_by(desc(DisclosureModel.disclosure_date))
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_by_stock_code(self, stock_code: str) -> List[DisclosureModel]:
        """종목코드로 공시 정보 조회"""
        query = (
            select(DisclosureModel)
            .where(DisclosureModel.stock_code == stock_code)
            .order_by(desc(DisclosureModel.disclosure_date))
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_by_date_range(
        self, 
        start_date: str, 
        end_date: str
    ) -> List[DisclosureModel]:
        """날짜 범위로 공시 정보 조회"""
        query = (
            select(DisclosureModel)
            .where(
                and_(
                    DisclosureModel.disclosure_date >= start_date,
                    DisclosureModel.disclosure_date <= end_date
                )
            )
            .order_by(desc(DisclosureModel.disclosure_date))
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_recent_disclosures(self, days: int = 7) -> List[DisclosureModel]:
        """최근 N일간의 공시 정보 조회"""
        from datetime import datetime, timedelta
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        start_date_str = start_date.strftime("%Y%m%d")
        end_date_str = end_date.strftime("%Y%m%d")
        
        return await self.get_by_date_range(start_date_str, end_date_str)
    
    async def count_total(self) -> int:
        """전체 공시 개수 조회"""
        from sqlalchemy import func
        
        query = select(func.count(DisclosureModel.id))
        result = await self.db.execute(query)
        return result.scalar()
    
    async def update(
        self, 
        disclosure_id: int, 
        disclosure_data: DisclosureItemUpdate
    ) -> Optional[DisclosureModel]:
        """공시 정보 수정"""
        disclosure = await self.get_by_id(disclosure_id)
        if not disclosure:
            return None
        
        update_data = disclosure_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(disclosure, field, value)
        
        await self.db.commit()
        await self.db.refresh(disclosure)
        return disclosure
    
    async def delete(self, disclosure_id: int) -> bool:
        """공시 정보 삭제"""
        disclosure = await self.get_by_id(disclosure_id)
        if not disclosure:
            return False
        
        await self.db.delete(disclosure)
        await self.db.commit()
        return True
    
    async def bulk_create(self, disclosures_data: List[DisclosureItemCreate]) -> List[DisclosureModel]:
        """공시 정보 대량 생성 (재시도 로직 포함)"""
        import asyncio
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                disclosures = []
                for data in disclosures_data:
                    disclosure = DisclosureModel(
                        company_name=data.company_name,
                        stock_code=data.stock_code,
                        disclosure_title=data.disclosure_title,
                        disclosure_date=data.disclosure_date,
                        report_name=data.report_name
                    )
                    disclosures.append(disclosure)
                self.db.add_all(disclosures)
                await self.db.commit()
                for disclosure in disclosures:
                    await self.db.refresh(disclosure)
                return disclosures
            except Exception as e:
                print(f"❌ [DB] bulk_create 실패 (시도 {attempt}/{max_retries}): {e}")
                await self.db.rollback()
                if attempt == max_retries:
                    raise
                await asyncio.sleep(1)  # 짧은 대기 후 재시도
