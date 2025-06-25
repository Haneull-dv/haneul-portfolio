"""
CQRS 패턴 적용 Weekly Data Service

DDD + CQRS + EDA 구조:
- Command Side: 각 도메인 서비스에서 자체 테이블에 저장
- Query Side: weekly_data 테이블은 읽기 전용 projection
- Event-Driven: 각 서비스 저장 완료 후 projection 업데이트
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from datetime import datetime, timezone
import logging

from .weekly_unified_model import WeeklyDataModel, WeeklyBatchJobModel

logger = logging.getLogger(__name__)


class WeeklyQueryService:
    """
    CQRS Query Side: weekly_data 테이블 읽기 전용 서비스
    
    책임:
    - 프론트엔드용 통합 데이터 조회
    - 주차별/카테고리별 데이터 검색
    - 통계 및 요약 정보 제공
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        logger.info("🔍 WeeklyQueryService 초기화 (CQRS Query Side)")
    
    async def get_weekly_table_data(
        self, 
        week: str, 
        categories: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        특정 주차의 통합 테이블 데이터 조회 (프론트엔드용)
        
        Args:
            week: 주차 (YYYY-MM-DD)
            categories: 필터링할 카테고리 목록
        
        Returns:
            기업별로 그룹화된 카테고리 데이터
        """
        logger.info(f"📊 주차별 통합 데이터 조회 - Week: {week}")
        
        query = select(WeeklyDataModel).where(WeeklyDataModel.week == week)
        
        if categories:
            query = query.where(WeeklyDataModel.category.in_(categories))
        
        result = await self.db.execute(query)
        weekly_data = result.scalars().all()
        
        # 기업별로 데이터 그룹화
        companies_data = {}
        for data in weekly_data:
            company_name = data.company_name
            if company_name not in companies_data:
                companies_data[company_name] = {
                    "disclosure": None,
                    "issue": None, 
                    "stockprice": None,
                    "stock_code": data.stock_code
                }
            
            companies_data[company_name][data.category] = {
                "content": data.content,
                "collected_at": data.collected_at.isoformat() if data.collected_at else None,
                "metadata": data.extra_data or {}
            }
        
        # 통계 정보 계산
        category_counts = {}
        for data in weekly_data:
            category_counts[data.category] = category_counts.get(data.category, 0) + 1
        
        return {
            "week": week,
            "companies": companies_data,
            "summary": {
                "total_companies": len(companies_data),
                "categories_count": category_counts,
                "total_records": len(weekly_data),
                "week": week,
                "categories": category_counts
            }
        }
    
    async def get_available_weeks(self, limit: int = 20) -> Dict[str, Any]:
        """사용 가능한 주차 목록 조회"""
        logger.info(f"📅 사용 가능한 주차 목록 조회 (최대 {limit}개)")
        
        query = (
            select(
                WeeklyDataModel.week,
                func.count().label('total_records'),
                func.count(func.distinct(WeeklyDataModel.company_name)).label('total_companies')
            )
            .group_by(WeeklyDataModel.week)
            .order_by(desc(WeeklyDataModel.week))
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        weeks_data = result.all()
        
        available_weeks = []
        for week_data in weeks_data:
            # 각 주차별 카테고리 통계를 별도 쿼리로 계산
            categories_query = (
                select(
                    WeeklyDataModel.category,
                    func.count().label('count')
                )
                .where(WeeklyDataModel.week == week_data.week)
                .group_by(WeeklyDataModel.category)
            )
            
            categories_result = await self.db.execute(categories_query)
            categories_data = categories_result.all()
            
            categories = {cat.category: cat.count for cat in categories_data}
            
            available_weeks.append({
                "week": week_data.week,
                "total_records": week_data.total_records,
                "total_companies": week_data.total_companies,
                "categories": categories
            })
        
        return {
            "available_weeks": available_weeks,
            "total_weeks": len(available_weeks),
            "latest_week": available_weeks[0]["week"] if available_weeks else None
        }
    
    async def get_week_summary(self, week: str) -> Dict[str, Any]:
        """특정 주차의 요약 통계"""
        logger.info(f"📈 주차 요약 통계 조회 - Week: {week}")
        
        query = (
            select(
                WeeklyDataModel.category,
                func.count().label('count'),
                func.count(func.distinct(WeeklyDataModel.company_name)).label('companies')
            )
            .where(WeeklyDataModel.week == week)
            .group_by(WeeklyDataModel.category)
        )
        
        result = await self.db.execute(query)
        category_stats = result.all()
        
        stats = {}
        total_records = 0
        total_companies = set()
        
        for stat in category_stats:
            stats[stat.category] = {
                "count": stat.count,
                "companies": stat.companies
            }
            total_records += stat.count
        
        # 전체 기업 수 계산
        companies_query = (
            select(func.count(func.distinct(WeeklyDataModel.company_name)))
            .where(WeeklyDataModel.week == week)
        )
        companies_result = await self.db.execute(companies_query)
        total_companies_count = companies_result.scalar()
        
        return {
            "week": week,
            "total_records": total_records,
            "total_companies": total_companies_count,
            "categories": stats
        }


class WeeklyProjectionService:
    """
    CQRS Projection Service: Command Side에서 Query Side로 데이터 동기화
    
    책임:
    - 각 도메인 서비스의 로컬 데이터를 weekly_data에 projection
    - 데이터 변환 및 정규화
    - 중복 제거 및 데이터 일관성 보장
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        logger.info("🔄 WeeklyProjectionService 초기화 (CQRS Projection)")
    
    async def project_weekly_data(
        self,
        category: str,
        week: str,
        domain_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        도메인 데이터를 weekly_data 테이블에 projection
        
        Args:
            category: 데이터 카테고리 (disclosure/issue/stockprice)
            week: 대상 주차
            domain_data: 도메인 서비스에서 전달받은 데이터
        
        Returns:
            projection 결과 통계
        """
        logger.info(f"🔄 Weekly Data Projection 시작 - Category: {category}, Week: {week}")
        
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        for item in domain_data:
            try:
                # 기존 데이터 확인 (중복 방지)
                existing_query = select(WeeklyDataModel).where(
                    and_(
                        WeeklyDataModel.company_name == item["company_name"],
                        WeeklyDataModel.category == category,
                        WeeklyDataModel.week == week
                    )
                )
                
                existing_result = await self.db.execute(existing_query)
                existing_data = existing_result.scalar_one_or_none()
                
                if existing_data:
                    logger.debug(f"⏭️ 기존 데이터 존재, 스킵: {item['company_name']} - {category}")
                    skipped_count += 1
                    continue
                
                # 주차 정보 계산
                week_year, week_number = WeeklyDataModel.get_week_info(week)
                
                # 새 projection 데이터 생성
                weekly_data = WeeklyDataModel(
                    company_name=item["company_name"],
                    content=item["content"],
                    category=category,
                    week=week,
                    week_year=week_year,
                    week_number=week_number,
                    stock_code=item.get("stock_code"),
                    extra_data=item.get("metadata", {}),
                    collected_at=datetime.now(timezone.utc)
                )
                
                self.db.add(weekly_data)
                updated_count += 1
                
                logger.debug(f"✅ Projection 생성: {item['company_name']} - {category}")
                
            except Exception as e:
                logger.error(f"❌ Projection 실패: {item.get('company_name', 'Unknown')} - {str(e)}")
                error_count += 1
        
        # 커밋
        try:
            await self.db.commit()
            logger.info(f"💾 Projection 커밋 완료 - Updated: {updated_count}, Skipped: {skipped_count}, Errors: {error_count}")
        except Exception as e:
            await self.db.rollback()
            logger.error(f"❌ Projection 커밋 실패: {str(e)}")
            raise
        
        return {
            "status": "success",
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": error_count,
            "week": week,
            "category": category
        }
    
    async def aggregate_weekly_projections(self, week: str) -> Dict[str, Any]:
        """
        모든 도메인 서비스의 데이터를 한 번에 projection
        
        이 메서드는 n8n에서 모든 수집 작업 완료 후 호출됩니다.
        """
        logger.info(f"🔄 전체 Weekly Projection 시작 - Week: {week}")
        
        aggregation_results = {
            "week": week,
            "categories": {},
            "total_updated": 0,
            "total_skipped": 0,
            "total_errors": 0,
            "status": "success"
        }
        
        # 각 카테고리별 projection 통계 수집
        categories = ["disclosure", "issue", "stockprice"]
        
        for category in categories:
            # 해당 카테고리의 기존 projection 통계 조회
            query = (
                select(func.count())
                .select_from(WeeklyDataModel)
                .where(
                    and_(
                        WeeklyDataModel.week == week,
                        WeeklyDataModel.category == category
                    )
                )
            )
            
            result = await self.db.execute(query)
            category_count = result.scalar()
            
            aggregation_results["categories"][category] = {
                "projected_count": category_count,
                "status": "completed" if category_count > 0 else "no_data"
            }
        
        # 전체 통계 계산
        total_query = (
            select(func.count())
            .select_from(WeeklyDataModel)
            .where(WeeklyDataModel.week == week)
        )
        
        total_result = await self.db.execute(total_query)
        total_projections = total_result.scalar()
        
        aggregation_results["total_projections"] = total_projections
        aggregation_results["aggregated_at"] = datetime.now(timezone.utc).isoformat()
        
        logger.info(f"✅ 전체 Weekly Projection 완료 - Total: {total_projections}")
        
        return aggregation_results


class WeeklyBatchLogService:
    """
    CQRS용 배치 작업 로그 서비스
    
    각 도메인 서비스의 작업 완료를 추적하고
    projection 타이밍을 결정하는데 사용
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        logger.info("📝 WeeklyBatchLogService 초기화 (CQRS 배치 로그)")
    
    async def start_batch_job(self, job_type: str, week: str) -> int:
        """배치 작업 시작 로그"""
        batch_job = WeeklyBatchJobModel(
            job_type=job_type,
            week=week,
            status="running",
            started_at=datetime.now(timezone.utc)
        )
        
        self.db.add(batch_job)
        await self.db.commit()
        await self.db.refresh(batch_job)
        
        logger.info(f"🚀 배치 작업 시작 - Job ID: {batch_job.id}, Type: {job_type}, Week: {week}")
        return batch_job.id
    
    async def finish_batch_job(
        self, 
        job_id: int, 
        result: Dict[str, Any], 
        error_message: str = None
    ) -> None:
        """배치 작업 완료 로그"""
        query = select(WeeklyBatchJobModel).where(WeeklyBatchJobModel.id == job_id)
        result_obj = await self.db.execute(query)
        batch_job = result_obj.scalar_one_or_none()
        
        if not batch_job:
            logger.warning(f"⚠️ 배치 작업을 찾을 수 없음: Job ID {job_id}")
            return
        
        # 소요 시간 계산 (timezone-aware)
        duration = int((datetime.now(timezone.utc) - batch_job.started_at).total_seconds())
        
        # 결과 업데이트
        batch_job.status = "success" if not error_message else "failed"
        batch_job.updated_count = result.get("updated", 0)
        batch_job.skipped_count = result.get("skipped", 0)
        batch_job.error_count = result.get("errors", 0)
        batch_job.finished_at = datetime.now(timezone.utc)
        batch_job.duration_seconds = duration
        batch_job.error_message = error_message
        
        await self.db.commit()
        
        status_emoji = "✅" if not error_message else "❌"
        logger.info(f"{status_emoji} 배치 작업 완료 - Job ID: {job_id}, 소요시간: {duration}초")
    
    async def get_recent_batch_jobs(
        self, 
        job_type: str = None, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """최근 배치 작업 로그 조회"""
        query = select(WeeklyBatchJobModel).order_by(desc(WeeklyBatchJobModel.started_at))
        
        if job_type:
            query = query.where(WeeklyBatchJobModel.job_type == job_type)
        
        query = query.limit(limit)
        
        result = await self.db.execute(query)
        jobs = result.scalars().all()
        
        return [job.to_dict() for job in jobs]
    
    async def check_all_jobs_completed(self, week: str) -> bool:
        """특정 주차의 모든 도메인 작업이 완료되었는지 확인"""
        required_jobs = ["disclosure", "issue", "stockprice"]
        
        for job_type in required_jobs:
            query = (
                select(WeeklyBatchJobModel)
                .where(
                    and_(
                        WeeklyBatchJobModel.week == week,
                        WeeklyBatchJobModel.job_type == job_type,
                        WeeklyBatchJobModel.status == "success"
                    )
                )
                .order_by(desc(WeeklyBatchJobModel.started_at))
                .limit(1)
            )
            
            result = await self.db.execute(query)
            completed_job = result.scalar_one_or_none()
            
            if not completed_job:
                logger.info(f"⏳ {job_type} 작업이 아직 완료되지 않음 - Week: {week}")
                return False
        
        logger.info(f"✅ 모든 도메인 작업 완료 확인 - Week: {week}")
        return True 