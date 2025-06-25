from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from datetime import datetime
import logging

# 공통 DB 모듈 import
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from weekly_db.db.db_builder import get_db_session
from weekly_db.db.weekly_service import WeeklyDataService, WeeklyBatchService
from weekly_db.db.weekly_unified_model import WeeklyDataModel

# Disclosure 서비스 import
from app.domain.controller.disclosure_controller import DisclosureController
from app.config.companies import GAME_COMPANIES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/n8n", tags=["n8n-automation"])

@router.post("/collect-disclosure")
async def collect_disclosure_for_n8n(
    week: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    🤖 n8n 자동화: 전체 게임기업 공시 정보 수집
    
    매주 월요일 오전 7시에 n8n이 자동 호출
    config에 등록된 모든 게임기업의 공시 정보를 일괄 수집하여 weekly_data 테이블에 누적 저장
    
    Args:
        week: 대상 주차 (YYYY-MM-DD, None이면 현재 주)
    
    Returns:
        {"status": "success", "updated": 8, "skipped": 3, "week": "2025-01-13"}
    """
    
    if not week:
        week = WeeklyDataModel.get_current_week_monday()
    
    logger.info(f"🤖 n8n 공시 수집 시작 - Week: {week}, Companies: {len(GAME_COMPANIES)}")
    
    # 배치 작업 시작 로그
    batch_service = WeeklyBatchService(db)
    job_id = await batch_service.start_batch_job("disclosure", week)
    
    try:
        # 1. 기존 Disclosure Controller로 데이터 수집
        controller = DisclosureController(db_session=db)
        all_company_names = list(GAME_COMPANIES.values())  # 기업명 리스트
        
        logger.info(f"🔍 공시 데이터 수집 시작 - {len(all_company_names)}개 기업")
        disclosure_results = await controller.fetch_game_companies_disclosures()
        
        logger.info(f"📋 공시 수집 완료 - {len(disclosure_results.disclosures)}건")
        
        # 2. weekly_data 테이블용 데이터 변환
        weekly_items = []
        for disclosure in disclosure_results.disclosures:
            # 종목코드로 기업명 찾기
            company_name = GAME_COMPANIES.get(disclosure.get("stock_code"), disclosure.get("company_name"))
            
            weekly_item = {
                "company_name": company_name,
                "content": f"[{disclosure.get('disclosure_date')}] {disclosure.get('disclosure_title')} - {disclosure.get('report_name')}",
                "stock_code": disclosure.get("stock_code"),
                "metadata": {
                    "disclosure_title": disclosure.get("disclosure_title"),
                    "disclosure_date": disclosure.get("disclosure_date"),
                    "report_name": disclosure.get("report_name"),
                    "stock_code": disclosure.get("stock_code"),
                    "source": "dart_api"
                }
            }
            weekly_items.append(weekly_item)
        
        # 3. WeeklyDataService로 통합 테이블에 저장
        weekly_service = WeeklyDataService(db)
        result = await weekly_service.bulk_upsert_weekly_data(
            weekly_items=weekly_items,
            category="disclosure",
            week=week
        )
        
        # 4. 배치 작업 완료 로그
        await batch_service.finish_batch_job(job_id, result)
        
        logger.info(f"✅ n8n 공시 수집 완료 - {result}")
        
        return {
            "status": result["status"],
            "updated": result["updated"],
            "skipped": result["skipped"],
            "errors": result["errors"],
            "week": result["week"],
            "total_companies": len(all_company_names),
            "job_id": job_id
        }
        
    except Exception as e:
        logger.error(f"❌ n8n 공시 수집 실패: {str(e)}")
        
        # 배치 작업 실패 로그
        await batch_service.finish_batch_job(job_id, {}, str(e))
        
        raise HTTPException(
            status_code=500, 
            detail=f"공시 데이터 수집 중 오류 발생: {str(e)}"
        )


@router.get("/disclosure/status")
async def get_disclosure_collection_status(
    week: Optional[str] = None,
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    📊 공시 수집 상태 조회
    
    특정 주차의 공시 데이터 수집 현황을 반환
    """
    if not week:
        week = WeeklyDataModel.get_current_week_monday()
    
    try:
        weekly_service = WeeklyDataService(db)
        
        # 해당 주차 공시 데이터 조회
        disclosure_data = await weekly_service.get_weekly_data(
            week=week, 
            category="disclosure"
        )
        
        # 배치 작업 로그 조회
        batch_service = WeeklyBatchService(db)
        recent_jobs = await batch_service.get_recent_jobs(job_type="disclosure", limit=5)
        
        return {
            "week": week,
            "disclosure_count": len(disclosure_data),
            "companies_collected": len(set(item["company_name"] for item in disclosure_data)),
            "total_target_companies": len(GAME_COMPANIES),
            "recent_jobs": recent_jobs,
            "sample_data": disclosure_data[:3] if disclosure_data else []
        }
        
    except Exception as e:
        logger.error(f"❌ 공시 수집 상태 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"공시 수집 상태 조회 중 오류 발생: {str(e)}"
        )


@router.get("/disclosure/weeks")
async def get_available_disclosure_weeks(
    limit: int = 10,
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """📅 공시 데이터가 있는 주차 목록 조회"""
    try:
        weekly_service = WeeklyDataService(db)
        weeks = await weekly_service.get_available_weeks(limit=limit)
        
        return {
            "available_weeks": weeks,
            "total_weeks": len(weeks),
            "latest_week": weeks[0] if weeks else None
        }
        
    except Exception as e:
        logger.error(f"❌ 주차 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"주차 목록 조회 중 오류 발생: {str(e)}"
        ) 