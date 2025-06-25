"""
CQRS 패턴 적용 Weekly Data API

DDD + CQRS 구조:
- Query Side: 프론트엔드용 통합 데이터 조회 (읽기 전용)
- Projection Management: 도메인 데이터를 Query 모델로 동기화
- Event-Driven: n8n 자동화와 연동된 projection 트리거
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional, List
import logging

# CQRS 패턴 서비스 import
from ..db.weekly_cqrs_service import (
    WeeklyQueryService, 
    WeeklyProjectionService, 
    WeeklyBatchLogService
)
from ..db.db_singleton import get_weekly_session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/weekly-cqrs", tags=["weekly-cqrs"])


# ============================================
# QUERY SIDE APIs (읽기 전용)
# ============================================

@router.get("/table-data")
async def get_weekly_table_data(
    week: str = Query(..., description="주차 (YYYY-MM-DD 형식)"),
    categories: Optional[str] = Query(None, description="필터링할 카테고리 (쉼표로 구분)"),
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Query Side] 특정 주차의 통합 테이블 데이터 조회
    
    프론트엔드에서 주차별로 모든 기업의 disclosure, issue, stockprice 데이터를 
    통합하여 조회할 수 있습니다.
    
    이 API는 읽기 전용이며, weekly_data 테이블의 projection 데이터를 조회합니다.
    """
    try:
        logger.info(f"🔍 [CQRS Query] Weekly table data 요청 - Week: {week}")
        
        # 카테고리 필터링 처리
        category_list = None
        if categories:
            category_list = [cat.strip() for cat in categories.split(",")]
        
        # CQRS Query Service 사용
        query_service = WeeklyQueryService(db)
        result = await query_service.get_weekly_table_data(week, category_list)
        
        logger.info(f"✅ [CQRS Query] 조회 완료 - {result['summary']['total_companies']}개 기업")
        return result
        
    except Exception as e:
        logger.error(f"❌ [CQRS Query] Weekly table data 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/available-weeks")
async def get_available_weeks(
    limit: int = Query(20, description="조회할 최대 주차 수"),
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Query Side] 사용 가능한 주차 목록 조회
    
    데이터가 있는 주차들의 목록과 각 주차별 통계를 반환합니다.
    읽기 전용 projection 데이터에서 조회합니다.
    """
    try:
        logger.info(f"🔍 [CQRS Query] Available weeks 요청 - Limit: {limit}")
        
        query_service = WeeklyQueryService(db)
        result = await query_service.get_available_weeks(limit)
        
        logger.info(f"✅ [CQRS Query] Available weeks 조회 완료 - {result['total_weeks']}개 주차")
        return result
        
    except Exception as e:
        logger.error(f"❌ [CQRS Query] Available weeks 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"주차 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/summary/{week}")
async def get_week_summary(
    week: str,
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Query Side] 특정 주차의 요약 통계
    
    해당 주차의 카테고리별 데이터 수, 기업 수 등 요약 정보를 제공합니다.
    읽기 전용 projection 데이터에서 조회합니다.
    """
    try:
        logger.info(f"🔍 [CQRS Query] Week summary 요청 - Week: {week}")
        
        query_service = WeeklyQueryService(db)
        result = await query_service.get_week_summary(week)
        
        logger.info(f"✅ [CQRS Query] Week summary 조회 완료 - {result['total_records']}건")
        return result
        
    except Exception as e:
        logger.error(f"❌ [CQRS Query] Week summary 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"주차 요약 조회 중 오류가 발생했습니다: {str(e)}")


# ============================================
# PROJECTION MANAGEMENT APIs (CQRS 동기화)
# ============================================

@router.post("/aggregate-weekly-data")
async def aggregate_weekly_projections(
    week: str = Query(..., description="대상 주차 (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Projection] 모든 도메인 서비스 데이터를 weekly_data로 projection
    
    이 API는 n8n에서 모든 수집 작업 완료 후 호출됩니다:
    1. 각 도메인 서비스(disclosure, issue, stockprice)가 로컬 테이블에 저장 완료
    2. n8n이 이 API를 호출하여 통합 projection 실행
    3. weekly_data 테이블에 읽기 전용 데이터 생성
    
    CQRS 패턴의 핵심: Command Side(각 서비스) → Query Side(weekly_data) 동기화
    """
    try:
        logger.info(f"🔄 [CQRS Projection] Weekly aggregation 시작 - Week: {week}")
        
        # 1. 모든 도메인 작업 완료 확인
        batch_service = WeeklyBatchLogService(db)
        all_completed = await batch_service.check_all_jobs_completed(week)
        
        if not all_completed:
            logger.warning(f"⚠️ [CQRS Projection] 아직 미완료된 도메인 작업 존재 - Week: {week}")
            return {
                "status": "waiting",
                "message": "일부 도메인 서비스의 데이터 수집이 아직 완료되지 않았습니다.",
                "week": week,
                "all_jobs_completed": False
            }
        
        # 2. Projection 실행
        projection_service = WeeklyProjectionService(db)
        result = await projection_service.aggregate_weekly_projections(week)
        
        logger.info(f"✅ [CQRS Projection] Weekly aggregation 완료 - Week: {week}")
        return result
        
    except Exception as e:
        logger.error(f"❌ [CQRS Projection] Weekly aggregation 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터 aggregation 중 오류가 발생했습니다: {str(e)}")


@router.post("/project-domain-data")
async def project_domain_data(
    category: str = Query(..., description="카테고리 (disclosure/issue/stockprice)"),
    week: str = Query(..., description="대상 주차 (YYYY-MM-DD)"),
    domain_data: List[Dict[str, Any]] = [],
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Projection] 특정 도메인 서비스 데이터를 weekly_data로 projection
    
    각 도메인 서비스에서 로컬 저장 완료 후 이 API를 호출하여
    weekly_data 테이블에 읽기 전용 projection을 생성합니다.
    
    사용 예시:
    - weekly_disclosure → project_domain_data(category="disclosure")
    - weekly_issue → project_domain_data(category="issue") 
    - weekly_stockprice → project_domain_data(category="stockprice")
    """
    try:
        logger.info(f"🔄 [CQRS Projection] Domain data projection 시작 - Category: {category}, Week: {week}")
        
        if category not in ["disclosure", "issue", "stockprice"]:
            raise HTTPException(status_code=400, detail="유효하지 않은 카테고리입니다.")
        
        projection_service = WeeklyProjectionService(db)
        result = await projection_service.project_weekly_data(category, week, domain_data)
        
        logger.info(f"✅ [CQRS Projection] Domain projection 완료 - {result['updated']}건 업데이트")
        return result
        
    except Exception as e:
        logger.error(f"❌ [CQRS Projection] Domain projection 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Domain projection 중 오류가 발생했습니다: {str(e)}")


# ============================================
# BATCH JOB MONITORING APIs
# ============================================

@router.get("/batch-jobs")
async def get_batch_jobs(
    job_type: Optional[str] = Query(None, description="작업 타입 필터"),
    limit: int = Query(10, description="조회할 최대 작업 수"),
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Monitoring] 배치 작업 로그 조회
    
    각 도메인 서비스의 작업 완료 상태를 모니터링하고
    projection 타이밍을 결정하는데 사용됩니다.
    """
    try:
        logger.info(f"🔍 [CQRS Monitoring] Batch jobs 요청 - Type: {job_type}, Limit: {limit}")
        
        batch_service = WeeklyBatchLogService(db)
        jobs = await batch_service.get_recent_batch_jobs(job_type, limit)
        
        return {
            "batch_jobs": jobs,
            "total_jobs": len(jobs),
            "job_type_filter": job_type,
            "cqrs_pattern": "monitoring"
        }
        
    except Exception as e:
        logger.error(f"❌ [CQRS Monitoring] Batch jobs 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"배치 작업 로그 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/projection-status/{week}")
async def get_projection_status(
    week: str,
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Monitoring] 특정 주차의 projection 상태 확인
    
    각 도메인 서비스의 작업 완료 상태와 projection 진행 상황을 확인합니다.
    n8n에서 aggregation 타이밍을 결정하는데 사용됩니다.
    """
    try:
        logger.info(f"🔍 [CQRS Monitoring] Projection status 확인 - Week: {week}")
        
        batch_service = WeeklyBatchLogService(db)
        query_service = WeeklyQueryService(db)
        
        # 1. 각 도메인 작업 완료 상태 확인
        all_completed = await batch_service.check_all_jobs_completed(week)
        
        # 2. 현재 projection 상태 확인
        summary = await query_service.get_week_summary(week)
        
        # 3. 각 도메인별 배치 작업 상태
        domain_status = {}
        for job_type in ["disclosure", "issue", "stockprice"]:
            recent_jobs = await batch_service.get_recent_batch_jobs(job_type, 1)
            if recent_jobs:
                domain_status[job_type] = {
                    "last_job_status": recent_jobs[0]["status"],
                    "last_completed": recent_jobs[0]["finished_at"],
                    "last_week": recent_jobs[0]["week"]
                }
            else:
                domain_status[job_type] = {
                    "last_job_status": "no_jobs",
                    "last_completed": None,
                    "last_week": None
                }
        
        return {
            "week": week,
            "all_jobs_completed": all_completed,
            "projection_ready": all_completed,
            "current_projections": summary,
            "domain_status": domain_status,
            "cqrs_pattern": "status_monitoring"
        }
        
    except Exception as e:
        logger.error(f"❌ [CQRS Monitoring] Projection status 확인 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Projection 상태 확인 중 오류가 발생했습니다: {str(e)}")


# ============================================
# COMMAND SIDE INTERFACE (도메인 서비스용)
# ============================================

@router.post("/domain-command/{service_name}")
async def handle_domain_command(
    service_name: str,
    week: str = Query(..., description="대상 주차"),
    action: str = Query(..., description="액션 (start_job/finish_job/project_data)"),
    data: Optional[Dict[str, Any]] = None,
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [CQRS Command Interface] 도메인 서비스에서 Command Side 작업 처리
    
    각 도메인 서비스(disclosure, issue, stockprice)에서 
    데이터 저장 및 projection 작업을 관리하는 통합 인터페이스입니다.
    
    Actions:
    - start_job: 배치 작업 시작 로그
    - finish_job: 배치 작업 완료 로그 
    - project_data: 로컬 데이터를 weekly_data로 projection
    """
    try:
        if service_name not in ["disclosure", "issue", "stockprice"]:
            raise HTTPException(status_code=400, detail="유효하지 않은 서비스명입니다.")
        
        logger.info(f"🔧 [CQRS Command] Domain command 요청 - Service: {service_name}, Action: {action}")
        
        batch_service = WeeklyBatchLogService(db)
        projection_service = WeeklyProjectionService(db)
        
        if action == "start_job":
            # 배치 작업 시작 로그
            job_id = await batch_service.start_batch_job(service_name, week)
            return {
                "status": "success",
                "action": "start_job",
                "job_id": job_id,
                "service": service_name,
                "week": week
            }
        
        elif action == "finish_job":
            # 배치 작업 완료 로그
            job_id = data.get("job_id") if data else None
            result = data.get("result", {}) if data else {}
            error_message = data.get("error_message") if data else None
            
            if not job_id:
                raise HTTPException(status_code=400, detail="job_id가 필요합니다.")
            
            await batch_service.finish_batch_job(job_id, result, error_message)
            return {
                "status": "success",
                "action": "finish_job",
                "job_id": job_id,
                "service": service_name
            }
        
        elif action == "project_data":
            # 도메인 데이터를 weekly_data로 projection
            domain_data = data.get("domain_data", []) if data else []
            
            result = await projection_service.project_weekly_data(
                service_name, week, domain_data
            )
            return {
                "status": "success",
                "action": "project_data",
                "service": service_name,
                "projection_result": result
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"지원하지 않는 액션입니다: {action}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [CQRS Command] Domain command 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Command 처리 중 오류가 발생했습니다: {str(e)}") 