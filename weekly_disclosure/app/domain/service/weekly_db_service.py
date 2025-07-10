from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.exc import IntegrityError
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.domain.model.weekly_model import WeeklyDataModel, WeeklyBatchJobModel
from app.config.db.db_singleton import db_singleton

logger = logging.getLogger(__name__)

class WeeklyDataService:
    """주차별 통합 데이터 서비스"""
    
    def __init__(self, db_session: AsyncSession = None):
        self.db_session = db_session
    
    async def get_session(self) -> AsyncSession:
        """DB 세션 반환"""
        if self.db_session:
            return self.db_session
        return await db_singleton.get_session()
    
    async def bulk_upsert_weekly_data(
        self, 
        weekly_items: List[Dict[str, Any]], 
        category: str,
        week: str = None
    ) -> Dict[str, Any]:
        """
        주차별 데이터 대량 저장 (중복 체크 포함, ON CONFLICT DO NOTHING)
        Args:
            weekly_items: 저장할 데이터 리스트
            category: 데이터 카테고리 (disclosure/issue/stockprice)
            week: 대상 주차 (None이면 현재 주 월요일)
        Returns:
            {"status": "success", "updated": 8, "skipped": 3, "week": "2025-01-13"}
        """
        session = await self.get_session()
        if not week:
            week = WeeklyDataModel.get_current_week_monday()
        year, week_number = WeeklyDataModel.get_week_info(week)
        updated_count = 0
        skipped_count = 0
        error_count = 0
        for item in weekly_items:
            try:
                insert_stmt = pg_insert(WeeklyDataModel).values(
                    company_name=item["company_name"],
                    content=item["content"],
                    category=category,
                    week=week,
                    week_year=year,
                    week_number=week_number,
                    stock_code=item.get("stock_code"),
                    extra_data=item.get("metadata", {})
                ).on_conflict_do_nothing(
                    index_elements=[
                        WeeklyDataModel.__table__.c.company_name,
                        WeeklyDataModel.__table__.c.category,
                        WeeklyDataModel.__table__.c.week
                    ]
                )
                result = await session.execute(insert_stmt)
                if result.rowcount == 1:
                    updated_count += 1
                else:
                    logger.warning(f"[중복] 이미 존재하여 스킵: {item.get('company_name', 'Unknown')} - {category} - {week}")
                    skipped_count += 1
            except Exception as e:
                logger.error(f"데이터 저장 오류 - {item.get('company_name', 'Unknown')}: {str(e)}")
                error_count += 1
                continue
        try:
            await session.commit()
        except Exception as e:
            logger.error(f"커밋 중 오류 - Category: {category}, Week: {week}: {str(e)} (롤백하지 않고 진행)")
            # 커밋 오류가 발생해도 롤백하지 않고 진행 (예: 중복 등)
        logger.info(f"배치 저장 완료 - Category: {category}, Week: {week}, Updated: {updated_count}, Skipped: {skipped_count}, Errors: {error_count}")
        return {
            "status": "success",
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": error_count,
            "week": week,
            "category": category
        }
    
    async def get_weekly_data(
        self, 
        week: str, 
        category: str = None, 
        company_name: str = None
    ) -> List[Dict[str, Any]]:
        """주차별 데이터 조회"""
        session = await self.get_session()
        
        try:
            query = select(WeeklyDataModel).where(WeeklyDataModel.week == week)
            
            if category:
                query = query.where(WeeklyDataModel.category == category)
            
            if company_name:
                query = query.where(WeeklyDataModel.company_name == company_name)
            
            query = query.order_by(WeeklyDataModel.company_name, WeeklyDataModel.category)
            
            result = await session.execute(query)
            weekly_data = result.scalars().all()
            
            return [item.to_dict() for item in weekly_data]
            
        finally:
            if not self.db_session:
                await session.close()
    
    async def get_available_weeks(self, limit: int = 10) -> List[str]:
        """사용 가능한 주차 목록 조회 (최신순)"""
        session = await self.get_session()
        
        try:
            result = await session.execute(
                select(WeeklyDataModel.week)
                .distinct()
                .order_by(desc(WeeklyDataModel.week))
                .limit(limit)
            )
            
            weeks = [row[0] for row in result.fetchall()]
            return weeks
            
        finally:
            if not self.db_session:
                await session.close()
    
    async def get_weekly_summary(self, week: str) -> Dict[str, Any]:
        """주차별 요약 통계"""
        session = await self.get_session()
        
        try:
            # 카테고리별 개수
            result = await session.execute(
                select(
                    WeeklyDataModel.category,
                    func.count(WeeklyDataModel.id).label('count')
                )
                .where(WeeklyDataModel.week == week)
                .group_by(WeeklyDataModel.category)
            )
            
            category_counts = {row.category: row.count for row in result.fetchall()}
            
            # 총 기업 수
            result = await session.execute(
                select(func.count(func.distinct(WeeklyDataModel.company_name)))
                .where(WeeklyDataModel.week == week)
            )
            total_companies = result.scalar()
            
            return {
                "week": week,
                "total_companies": total_companies,
                "categories": category_counts,
                "total_records": sum(category_counts.values())
            }
            
        finally:
            if not self.db_session:
                await session.close()


class WeeklyBatchService:
    """주차별 배치 작업 관리 서비스"""
    
    def __init__(self, db_session: AsyncSession = None):
        self.db_session = db_session
    
    async def get_session(self) -> AsyncSession:
        if self.db_session:
            return self.db_session
        return await db_singleton.get_session()
    
    async def start_batch_job(self, job_type: str, week: str = None) -> int:
        """배치 작업 시작 로그"""
        session = await self.get_session()
        
        if not week:
            week = WeeklyDataModel.get_current_week_monday()
        
        try:
            batch_job = WeeklyBatchJobModel(
                job_type=job_type,
                week=week,
                status="running"
            )
            
            session.add(batch_job)
            await session.commit()
            
            logger.info(f"배치 작업 시작 - Type: {job_type}, Week: {week}, ID: {batch_job.id}")
            return batch_job.id
            
        finally:
            if not self.db_session:
                await session.close()
    
    async def finish_batch_job(
        self, 
        job_id: int, 
        result: Dict[str, Any], 
        error_message: str = None
    ):
        """배치 작업 완료 로그"""
        session = await self.get_session()
        
        try:
            batch_job = await session.get(WeeklyBatchJobModel, job_id)
            if not batch_job:
                logger.error(f"배치 작업 ID {job_id}를 찾을 수 없습니다")
                return
            
            # 소요 시간 계산 (timezone-aware)
            from datetime import timezone
            duration = int((datetime.now(timezone.utc) - batch_job.started_at).total_seconds())
            
            # 결과 업데이트
            batch_job.status = "failed" if error_message else "success"
            batch_job.updated_count = result.get("updated", 0)
            batch_job.skipped_count = result.get("skipped", 0)
            batch_job.error_count = result.get("errors", 0)
            batch_job.finished_at = datetime.now(timezone.utc)
            batch_job.duration_seconds = duration
            batch_job.error_message = error_message
            
            await session.commit()
            
            logger.info(f"배치 작업 완료 - ID: {job_id}, Status: {batch_job.status}, Duration: {duration}s")
            
        finally:
            if not self.db_session:
                await session.close()
    
    async def get_recent_jobs(self, job_type: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """최근 배치 작업 로그 조회"""
        session = await self.get_session()
        
        try:
            query = select(WeeklyBatchJobModel).order_by(desc(WeeklyBatchJobModel.started_at)).limit(limit)
            
            if job_type:
                query = query.where(WeeklyBatchJobModel.job_type == job_type)
            
            result = await session.execute(query)
            jobs = result.scalars().all()
            
            return [job.to_dict() for job in jobs]
            
        finally:
            if not self.db_session:
                await session.close() 