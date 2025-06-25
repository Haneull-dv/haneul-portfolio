"""
n8n CQRS Orchestrator API

DDD + CQRS + EDA + n8n 통합 구조:
- Command Orchestration: 모든 도메인 서비스의 CQRS Command Side 작업 조율
- Projection Management: 모든 도메인 완료 후 통합 projection 실행  
- Event-Driven Automation: n8n 스케줄러와 완전 연동
- Monitoring & Logging: 전체 프로세스 모니터링

n8n Workflow:
1. 매주 월요일 오전 7시 → /orchestrate-weekly-collection 호출
2. 모든 도메인 서비스 CQRS 작업 완료 대기
3. 완료 후 자동으로 통합 projection 실행
4. 프론트엔드에서 즉시 조회 가능
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging
import httpx
import asyncio

# CQRS 서비스 import  
from ..db.weekly_cqrs_service import (
    WeeklyQueryService,
    WeeklyProjectionService, 
    WeeklyBatchLogService
)
from ..db.db_singleton import get_weekly_session
from ..db.weekly_unified_model import WeeklyDataModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/n8n-cqrs", tags=["n8n-cqrs-orchestrator"])


# ============================================
# n8n 메인 오케스트레이션 API
# ============================================

@router.post("/orchestrate-weekly-collection")
async def orchestrate_weekly_collection(
    week: Optional[str] = Query(None, description="대상 주차 (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [n8n CQRS Orchestrator] 주간 데이터 수집 전체 프로세스 오케스트레이션
    """
    
    if not week:
        week = WeeklyDataModel.get_current_week()
    
    orchestration_id = f"orchestration_{week}_{int(datetime.now().timestamp())}"
    
    try:
        logger.info(f"🎭 [n8n CQRS Orchestrator] 주간 수집 오케스트레이션 시작")
        
        # 모든 도메인 서비스에 CQRS 작업 요청
        domain_services = [
            {"name": "disclosure", "url": "http://disclosure:8090/cqrs-disclosure/collect-and-project"},
            {"name": "issue", "url": "http://issue:8089/cqrs-issue/collect-and-project"},
            {"name": "stockprice", "url": "http://stockprice:9006/cqrs-stockprice/collect-and-project"}
        ]
        
        domain_results = {}
        failed_services = []
        
        # 모든 도메인 서비스를 병렬로 실행
        async def call_domain_service(service_info):
            service_name = service_info["name"]
            service_url = service_info["url"]
            
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    response = await client.post(service_url)
                    result = response.json()
                    
                    if result.get("status") == "success":
                        return service_name, result
                    else:
                        return service_name, None
                        
            except Exception as e:
                logger.error(f"❌ [n8n ← {service_name}] CQRS 요청 실패: {str(e)}")
                return service_name, None
        
        # 병렬 실행
        tasks = [call_domain_service(service) for service in domain_services]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 결과 정리
        for result in results:
            if isinstance(result, Exception):
                continue
                
            service_name, service_result = result
            if service_result:
                domain_results[service_name] = service_result
            else:
                failed_services.append(service_name)
        
        successful_services = list(domain_results.keys())
        
        # 통합 Aggregation 실행  
        aggregation_result = None
        if len(successful_services) > 0:
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    aggregation_response = await client.post(
                        f"http://weekly_data:8091/weekly-cqrs/aggregate-weekly-data",
                        params={"week": week}
                    )
                    aggregation_result = aggregation_response.json()
                    
            except Exception as e:
                logger.error(f"❌ [n8n Orchestrator] 통합 Aggregation 실패: {str(e)}")
        
        return {
            "status": "completed" if not failed_services else "partial_success",
            "orchestration_id": orchestration_id,
            "week": week,
            "cqrs_pattern": "full_orchestration",
            "domain_results": domain_results,
            "successful_services": successful_services,
            "failed_services": failed_services,
            "aggregation": aggregation_result,
            "orchestrated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"n8n 오케스트레이션 중 오류가 발생했습니다: {str(e)}"
        )


# ============================================
# n8n 모니터링 및 상태 확인 API
# ============================================

@router.get("/orchestration-status/{week}")
async def get_orchestration_status(
    week: str,
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [n8n 모니터링] 특정 주차의 오케스트레이션 상태 확인
    
    n8n에서 작업 진행 상황을 모니터링하고 재시도 여부를 결정하는데 사용합니다.
    """
    try:
        logger.info(f"🔍 [n8n Monitoring] 오케스트레이션 상태 확인 - Week: {week}")
        
        batch_service = WeeklyBatchLogService(db)
        query_service = WeeklyQueryService(db)
        
        # 1. 각 도메인 서비스별 배치 작업 상태
        domain_status = {}
        for service_name in ["disclosure", "issue", "stockprice"]:
            recent_jobs = await batch_service.get_recent_batch_jobs(service_name, 1)
            
            if recent_jobs and recent_jobs[0]["week"] == week:
                job = recent_jobs[0]
                domain_status[service_name] = {
                    "status": job["status"],
                    "job_id": job["id"],
                    "started_at": job["started_at"],
                    "finished_at": job["finished_at"],
                    "updated_count": job.get("updated_count", 0),
                    "duration_seconds": job.get("duration_seconds", 0)
                }
            else:
                domain_status[service_name] = {
                    "status": "not_started",
                    "job_id": None,
                    "started_at": None,
                    "finished_at": None,
                    "updated_count": 0,
                    "duration_seconds": 0
                }
        
        # 2. 통합 projection 상태
        try:
            week_summary = await query_service.get_week_summary(week)
            projection_status = {
                "status": "completed" if week_summary["total_records"] > 0 else "no_data",
                "total_records": week_summary["total_records"],
                "total_companies": week_summary["total_companies"],
                "categories": week_summary["categories"]
            }
        except:
            projection_status = {
                "status": "no_data",
                "total_records": 0,
                "total_companies": 0,
                "categories": {}
            }
        
        # 3. 전체 완료 상태 판단
        all_completed = await batch_service.check_all_jobs_completed(week)
        
        return {
            "week": week,
            "overall_status": "completed" if all_completed else "in_progress",
            "all_jobs_completed": all_completed,
            "domain_status": domain_status,
            "projection_status": projection_status,
            "ready_for_frontend": projection_status["status"] == "completed",
            "cqrs_pattern": "orchestration_monitoring"
        }
        
    except Exception as e:
        logger.error(f"❌ [n8n Monitoring] 상태 확인 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"상태 확인 중 오류가 발생했습니다: {str(e)}")


@router.post("/retry-failed-services")
async def retry_failed_services(
    week: str = Query(..., description="대상 주차"),
    services: Optional[str] = Query(None, description="재시도할 서비스 (쉼표로 구분)"),
    db: AsyncSession = Depends(get_weekly_session)
) -> Dict[str, Any]:
    """
    [n8n 복구] 실패한 도메인 서비스만 재시도
    
    특정 서비스만 실패했을 때 해당 서비스만 재실행합니다.
    """
    try:
        logger.info(f"🔄 [n8n Retry] 실패 서비스 재시도 - Week: {week}")
        
        if services:
            service_list = [s.strip() for s in services.split(",")]
        else:
            # 자동으로 실패한 서비스 탐지
            batch_service = WeeklyBatchLogService(db)
            service_list = []
            
            for service_name in ["disclosure", "issue", "stockprice"]:
                recent_jobs = await batch_service.get_recent_batch_jobs(service_name, 1)
                if not recent_jobs or recent_jobs[0]["status"] == "failed":
                    service_list.append(service_name)
        
        if not service_list:
            return {
                "status": "no_retry_needed",
                "message": "재시도가 필요한 서비스가 없습니다.",
                "week": week
            }
        
        logger.info(f"🎯 [n8n Retry] 재시도 대상 서비스: {service_list}")
        
        # 개별 서비스만 재실행 (전체 오케스트레이션과 동일한 로직이지만 선택적)
        service_urls = {
            "disclosure": "http://disclosure:8090/cqrs-disclosure/collect-and-project",
            "issue": "http://issue:8089/cqrs-issue/collect-and-project", 
            "stockprice": "http://stockprice:9006/cqrs-stockprice/collect-and-project"
        }
        
        retry_results = {}
        for service_name in service_list:
            if service_name in service_urls:
                try:
                    async with httpx.AsyncClient(timeout=300.0) as client:
                        response = await client.post(service_urls[service_name])
                        result = response.json()
                        retry_results[service_name] = result
                        
                        logger.info(f"✅ [n8n Retry] {service_name} 재시도 완료")
                        
                except Exception as e:
                    logger.error(f"❌ [n8n Retry] {service_name} 재시도 실패: {str(e)}")
                    retry_results[service_name] = {"status": "failed", "error": str(e)}
        
        return {
            "status": "retry_completed",
            "week": week,
            "retried_services": service_list,
            "retry_results": retry_results,
            "cqrs_pattern": "selective_retry"
        }
        
    except Exception as e:
        logger.error(f"❌ [n8n Retry] 재시도 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서비스 재시도 중 오류가 발생했습니다: {str(e)}")


# ============================================
# n8n 설정 및 헬스체크 API  
# ============================================

@router.get("/health-check")
async def n8n_health_check() -> Dict[str, Any]:
    """
    [n8n Health Check] 전체 CQRS 시스템 상태 확인
    
    n8n에서 작업 실행 전 시스템 상태를 확인합니다.
    """
    try:
        logger.info(f"🏥 [n8n Health] 시스템 상태 확인")
        
        # 각 서비스별 헬스체크
        service_health = {}
        services = [
            {"name": "weekly_data", "url": "http://weekly_data:8091/"},
            {"name": "disclosure", "url": "http://disclosure:8090/"},
            {"name": "issue", "url": "http://issue:8089/"},
            {"name": "stockprice", "url": "http://stockprice:9006/"}
        ]
        
        for service in services:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(service["url"])
                    service_health[service["name"]] = {
                        "status": "healthy" if response.status_code == 200 else "unhealthy",
                        "status_code": response.status_code
                    }
            except Exception as e:
                service_health[service["name"]] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
        
        # 전체 시스템 상태 판단
        all_healthy = all([s["status"] == "healthy" for s in service_health.values()])
        
        return {
            "overall_status": "healthy" if all_healthy else "degraded",
            "services": service_health,
            "cqrs_ready": all_healthy,
            "architecture": "DDD + CQRS + EDA + n8n",
            "checked_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ [n8n Health] 헬스체크 실패: {str(e)}")
        return {
            "overall_status": "unhealthy",
            "error": str(e),
            "cqrs_ready": False
        }


@router.get("/cqrs-architecture")
async def get_cqrs_architecture() -> Dict[str, Any]:
    """
    [n8n Documentation] CQRS 아키텍처 및 워크플로우 안내
    
    n8n 워크플로우 설계 시 참고할 수 있는 아키텍처 정보를 제공합니다.
    """
    return {
        "architecture": "DDD + CQRS + EDA + n8n Automation",
        "pattern_description": "Command Query Responsibility Segregation with Event-Driven Architecture",
        
        "command_side": {
            "description": "각 도메인 서비스에서 자신의 로컬 테이블에 데이터 저장",
            "services": {
                "weekly_disclosure": {
                    "table": "disclosures",
                    "endpoint": "/cqrs-disclosure/collect-and-project",
                    "port": 8090
                },
                "weekly_issue": {
                    "table": "issues", 
                    "endpoint": "/cqrs-issue/collect-and-project",
                    "port": 8089
                },
                "weekly_stockprice": {
                    "table": "stock_prices",
                    "endpoint": "/cqrs-stockprice/collect-and-project", 
                    "port": 9006
                }
            }
        },
        
        "query_side": {
            "description": "읽기 전용 통합 테이블에서 프론트엔드용 데이터 제공",
            "service": "weekly_data",
            "table": "weekly_data", 
            "port": 8091,
            "endpoints": {
                "frontend_query": "/weekly-cqrs/table-data",
                "projection_management": "/weekly-cqrs/project-domain-data",
                "aggregation": "/weekly-cqrs/aggregate-weekly-data"
            }
        },
        
        "n8n_workflow": {
            "description": "n8n에서 전체 프로세스를 자동화",
            "schedule": "매주 월요일 오전 7시",
            "main_endpoint": "/n8n-cqrs/orchestrate-weekly-collection",
            "monitoring_endpoint": "/n8n-cqrs/orchestration-status/{week}",
            "retry_endpoint": "/n8n-cqrs/retry-failed-services",
            "health_check": "/n8n-cqrs/health-check"
        },
        
        "data_flow": [
            "1. n8n 스케줄러 트리거",
            "2. 모든 도메인 서비스 병렬 실행 (Command Side)",
            "3. 각 서비스가 로컬 테이블 저장 + 개별 projection",
            "4. 모든 작업 완료 후 통합 aggregation",
            "5. 프론트엔드에서 즉시 조회 가능"
        ],
        
        "benefits": [
            "도메인 서비스 간 완전한 분리 (마이크로서비스)",
            "읽기/쓰기 성능 최적화",
            "장애 격리 및 복구 용이성",
            "확장성 및 유지보수성 향상",
            "Event-Driven 비동기 처리"
        ]
    } 