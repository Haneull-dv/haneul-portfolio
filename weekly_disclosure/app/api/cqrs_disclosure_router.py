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
from app.domain.service.weekly_db_service import WeeklyDataService, WeeklyBatchService
from app.config.db.db_singleton import db_singleton
from app.config.db.db_builder import get_db_session

# 설정 import
from app.config.companies import GAME_COMPANIES, TOTAL_COMPANIES

# 주차 계산 utility import
from app.domain.model.weekly_model import WeeklyDataModel

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
    week = WeeklyDataModel.get_current_week_monday()
    batch_service = WeeklyBatchService(db_session=db)
    data_service = WeeklyDataService(db_session=db)
    job_id = None
    try:
        logger.info(f"🔧 [CQRS Command] Disclosure 수집 시작 - Week: {week}")
        # 1. 배치 작업 시작 로그 (CQRS Monitoring)
        job_id = await batch_service.start_batch_job(job_type="disclosure", week=week)
        # 2. Command Side: 로컬 도메인 테이블에 저장
        controller = DisclosureController()
        logger.info(f"🔍 [CQRS Command] 공시 데이터 수집 - {TOTAL_COMPANIES}개 기업")
        disclosure_results = await controller.fetch_game_companies_disclosures(db_session=db)
        logger.info(f"📋 [CQRS Command] 공시 수집 완료 - {len(disclosure_results.disclosures)}건")
        local_updated = 0
        local_skipped = 0
        projection_data = []
        for disclosure in disclosure_results.disclosures:
            try:
                company_name = GAME_COMPANIES.get(
                    disclosure.stock_code, 
                    disclosure.company_name
                )
                local_updated += 1
                projection_item = {
                    "company_name": company_name,
                    "content": f"[{disclosure.disclosure_date}] {disclosure.disclosure_title} - {disclosure.report_name}",
                    "stock_code": disclosure.stock_code,
                    "metadata": {
                        "disclosure_title": disclosure.disclosure_title,
                        "disclosure_date": disclosure.disclosure_date,
                        "report_name": disclosure.report_name,
                        "stock_code": disclosure.stock_code,
                        "source": "dart_api",
                        "cqrs_pattern": "command_to_projection"
                    }
                }
                projection_data.append(projection_item)
                logger.debug(f"✅ [CQRS Command] 로컬 저장 및 Projection 준비: {company_name}")
            except Exception as e:
                logger.error(f"❌ [CQRS Command] 개별 공시 처리 실패: {str(e)}")
                local_skipped += 1
        # 3. Projection: weekly_data 테이블로 저장
        logger.info(f"🔄 [CQRS Projection] weekly_data로 projection 시작 - {len(projection_data)}건")
        projection_result = await data_service.bulk_upsert_weekly_data(
            weekly_items=projection_data,
            category="disclosure",
            week=week
        )
        logger.info(f"✅ [CQRS Projection] Projection 완료 - Updated: {projection_result.get('updated', 0)}")
        # 4. 배치 작업 완료 로그
        final_result = {
            "local_updated": local_updated,
            "local_skipped": local_skipped,
            "projection_updated": projection_result.get("updated", 0),
            "projection_skipped": projection_result.get("skipped", 0),
            "total_collected": len(disclosure_results.disclosures)
        }
        await batch_service.finish_batch_job(
            job_id=job_id,
            result=final_result
        )
        # 5. 최종 응답
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
        if job_id:
            await batch_service.finish_batch_job(
                job_id=job_id,
                result={
                    "local_updated": 0,
                    "local_skipped": 0,
                    "projection_updated": 0,
                    "projection_skipped": 0,
                    "total_collected": 0
                },
                error_message=error_message
            )
        return {
            "status": "error",
            "message": "Disclosure CQRS 처리 중 오류가 발생했습니다.",
            "error": error_message
        }


@router.post("/project-disclosure-weekly")
async def project_disclosure_weekly(
    week: str = None,
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    [CQRS Projection Only] disclosure 도메인 데이터를 주차별 weekly_data 테이블로 projection (category='disclosure')
    - DART 재수집 없이 로컬 DB(disclosures) 기준 projection만 수행
    - week 미지정 시 이번주 월요일 기준
    """
    from app.domain.service.disclosure_service import DisclosureService
    from app.config.companies import GAME_COMPANIES, TOTAL_COMPANIES
    from app.domain.model.weekly_model import WeeklyDataModel
    from datetime import datetime, timezone
    logger.info(f"[Projection Only] Disclosure Projection 시작 - week: {week}")
    if not week:
        week = WeeklyDataModel.get_current_week_monday()
    data_service = WeeklyDataService(db_session=db)
    # 1. 로컬 DB에서 해당 주차 disclosure 데이터 조회
    disclosure_service = DisclosureService(db_session=db)
    disclosures = await disclosure_service.db_service.get_week_disclosures(week=week)
    local_skipped = 0
    local_updated = 0
    projection_data = []
    for disclosure in disclosures:
        try:
            company_name = GAME_COMPANIES.get(
                disclosure["stock_code"],
                disclosure["company_name"]
            )
            projection_item = {
                "company_name": company_name,
                "content": f"[{disclosure['disclosure_date']}] {disclosure['disclosure_title']} - {disclosure['report_name']}",
                "stock_code": disclosure["stock_code"],
                "metadata": {
                    "disclosure_title": disclosure["disclosure_title"],
                    "disclosure_date": disclosure["disclosure_date"],
                    "report_name": disclosure["report_name"],
                    "stock_code": disclosure["stock_code"],
                    "source": "dart_api",
                    "cqrs_pattern": "command_to_projection"
                }
            }
            projection_data.append(projection_item)
            local_updated += 1
        except Exception as e:
            logger.error(f"[Projection Only] 개별 disclosure 처리 실패: {str(e)}")
            local_skipped += 1
    # 2. Projection: weekly_data 테이블로 저장
    projection_result = await data_service.bulk_upsert_weekly_data(
        weekly_items=projection_data,
        category="disclosure",
        week=week
    )
    logger.info(f"[Projection Only] Projection 완료 - Updated: {projection_result.get('updated', 0)}")
    return {
        "status": "success",
        "week": week,
        "projection": {
            "updated": projection_result.get("updated", 0),
            "skipped": projection_result.get("skipped", 0),
            "errors": projection_result.get("errors", 0),
            "table": "weekly_data"
        },
        "total_companies": TOTAL_COMPANIES,
        "total_collected": len(disclosures),
        "collected_at": datetime.now(timezone.utc).isoformat()
    }


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