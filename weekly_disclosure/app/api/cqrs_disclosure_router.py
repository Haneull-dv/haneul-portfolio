"""
CQRS 패턴 적용 Disclosure Command Side API

DDD + CQRS 구조:
- Command Side: disclosure 도메인 데이터를 로컬 테이블(disclosures)에 저장
- Projection: 로컬 저장 완료 후 weekly_data 테이블로 projection 전송
- Event-Driven: n8n 자동화와 연동
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from datetime import datetime, timezone
import logging
import httpx
import sys
import os

# 프로젝트 루트 추가 (weekly_db 모듈 접근)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# 도메인 서비스 import
from app.domain.controller.disclosure_controller import DisclosureController
from app.domain.service.disclosure_service import DisclosureService
from weekly_db.db.db_builder import get_db_session

# 설정 import
from app.config.companies import GAME_COMPANIES, TOTAL_COMPANIES

# 주차 계산 utility import
from weekly_db.db.weekly_unified_model import WeeklyDataModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cqrs-disclosure")


@router.post("/collect-and-project")
async def collect_disclosure_with_cqrs(
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    [CQRS Command Side] 공시 데이터 수집 → 로컬 저장 → Projection
    
    CQRS 패턴 적용:
    1. Command Side: 공시 데이터를 disclosure 도메인의 로컬 테이블에 저장
    2. Projection: 로컬 저장 완료 후 weekly_data 테이블로 projection 전송
    3. Event-Driven: 배치 작업 로그로 다른 서비스와 동기화
    
    n8n에서 매주 자동으로 호출됩니다.
    """
    job_id = None
    week = WeeklyDataModel.get_current_week()
    
    try:
        logger.info(f"🔧 [CQRS Command] Disclosure 수집 시작 - Week: {week}")
        
        # ==========================================
        # 1. 배치 작업 시작 로그 (CQRS Monitoring)
        # ==========================================
        async with httpx.AsyncClient(timeout=30.0) as client:
            batch_start_response = await client.post(
                "http://weekly_data:8091/weekly-cqrs/domain-command/disclosure",
                params={
                    "week": week,
                    "action": "start_job"
                }
            )
            batch_start_result = batch_start_response.json()
            job_id = batch_start_result.get("job_id")
            
            logger.info(f"📝 [CQRS] 배치 작업 시작 로그 - Job ID: {job_id}")
        
        # ==========================================
        # 2. Command Side: 로컬 도메인 테이블에 저장
        # ==========================================
        
        # Disclosure Controller로 데이터 수집
        controller = DisclosureController(db)
        logger.info(f"🔍 [CQRS Command] 공시 데이터 수집 - {TOTAL_COMPANIES}개 기업")
        
        disclosure_results = await controller.fetch_game_companies_disclosures()
        logger.info(f"📋 [CQRS Command] 공시 수집 완료 - {len(disclosure_results.disclosures)}건")
        
        # 로컬 테이블 저장 통계
        local_updated = 0
        local_skipped = 0
        projection_data = []  # weekly_data로 보낼 projection 데이터
        
        # ==========================================
        # 3. 로컬 테이블 저장 및 Projection 데이터 준비
        # ==========================================
        
        for disclosure in disclosure_results.disclosures:
            try:
                # 종목코드로 기업명 찾기
                company_name = GAME_COMPANIES.get(
                    disclosure.get("stock_code"), 
                    disclosure.get("company_name", "Unknown")
                )
                
                # 로컬 테이블 저장은 기존 DisclosureService에서 이미 처리됨
                # (controller.fetch_game_companies_disclosures() 내부에서 저장)
                local_updated += 1
                
                # Projection용 데이터 준비 (weekly_data 테이블로 전송할 형태)
                projection_item = {
                    "company_name": company_name,
                    "content": f"[{disclosure.get('disclosure_date')}] {disclosure.get('disclosure_title')} - {disclosure.get('report_name')}",
                    "stock_code": disclosure.get("stock_code"),
                    "metadata": {
                        "disclosure_title": disclosure.get("disclosure_title"),
                        "disclosure_date": disclosure.get("disclosure_date"),
                        "report_name": disclosure.get("report_name"),
                        "stock_code": disclosure.get("stock_code"),
                        "source": "dart_api",
                        "cqrs_pattern": "command_to_projection"
                    }
                }
                
                projection_data.append(projection_item)
                
                logger.debug(f"✅ [CQRS Command] 로컬 저장 및 Projection 준비: {company_name}")
                
            except Exception as e:
                logger.error(f"❌ [CQRS Command] 개별 공시 처리 실패: {str(e)}")
                local_skipped += 1
        
        # ==========================================
        # 4. Projection: weekly_data 테이블로 전송
        # ==========================================
        
        logger.info(f"🔄 [CQRS Projection] weekly_data로 projection 시작 - {len(projection_data)}건")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            projection_response = await client.post(
                "http://weekly_data:8091/weekly-cqrs/project-domain-data",
                params={
                    "category": "disclosure", 
                    "week": week
                },
                json=projection_data
            )
            projection_result = projection_response.json()
            
            logger.info(f"✅ [CQRS Projection] Projection 완료 - Updated: {projection_result.get('updated', 0)}")
        
        # ==========================================
        # 5. 배치 작업 완료 로그
        # ==========================================
        
        final_result = {
            "local_updated": local_updated,
            "local_skipped": local_skipped,
            "projection_updated": projection_result.get("updated", 0),
            "projection_skipped": projection_result.get("skipped", 0),
            "total_collected": len(disclosure_results.disclosures)
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            await client.post(
                "http://weekly_data:8091/weekly-cqrs/domain-command/disclosure",
                params={
                    "week": week,
                    "action": "finish_job"
                },
                json={
                    "job_id": job_id,
                    "result": final_result
                }
            )
            
            logger.info(f"📝 [CQRS] 배치 작업 완료 로그 - Job ID: {job_id}")
        
        # ==========================================
        # 6. 최종 응답
        # ==========================================
        
        return {
            "status": "success",
            "week": week,
            "cqrs_pattern": "command_side_completed",
            "local_storage": {
                "updated": local_updated,
                "skipped": local_skipped,
                "table": "disclosures"
            },
            "projection": {
                "updated": projection_result.get("updated", 0),
                "skipped": projection_result.get("skipped", 0),
                "table": "weekly_data"
            },
            "total_companies": TOTAL_COMPANIES,
            "total_collected": len(disclosure_results.disclosures),
            "job_id": job_id,
            "collected_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        error_message = f"Disclosure CQRS 처리 실패: {str(e)}"
        logger.error(f"❌ [CQRS Command] {error_message}")
        
        # 배치 작업 실패 로그
        if job_id:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(
                        "http://weekly_data:8091/weekly-cqrs/domain-command/disclosure",
                        params={
                            "week": week,
                            "action": "finish_job"
                        },
                        json={
                            "job_id": job_id,
                            "result": {"updated": 0, "skipped": 0, "errors": 1},
                            "error_message": error_message
                        }
                    )
            except Exception as log_error:
                logger.error(f"❌ [CQRS] 실패 로그 기록 실패: {str(log_error)}")
        
        raise HTTPException(
            status_code=500,
            detail=f"CQRS Disclosure 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/cqrs-status")
async def get_disclosure_cqrs_status() -> Dict[str, Any]:
    """
    [CQRS 모니터링] Disclosure Command Side 상태 확인
    
    현재 disclosure 도메인의 CQRS 패턴 적용 상태를 확인합니다.
    """
    return {
        "service": "weekly_disclosure",
        "cqrs_pattern": "command_side",
        "responsibilities": {
            "command": "disclosure 데이터를 로컬 disclosures 테이블에 저장",
            "projection": "로컬 데이터를 weekly_data 테이블로 projection 전송",
            "monitoring": "배치 작업 로그로 작업 완료 상태 추적"
        },
        "local_table": "disclosures",
        "projection_table": "weekly_data", 
        "category": "disclosure",
        "companies_count": TOTAL_COMPANIES,
        "weekly_automation": "n8n 스케줄러와 연동",
        "architecture": "DDD + CQRS + EDA"
    } 