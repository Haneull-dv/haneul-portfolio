from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

# DB 모듈 import
from weekly_db.db.db_builder import get_db_session
from weekly_db.db.weekly_service import WeeklyDataService, WeeklyBatchService
from weekly_db.db.weekly_unified_model import WeeklyDataModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/weekly", tags=["weekly-frontend"])

@router.get("/table-data")
async def get_weekly_table_data(
    week: Optional[str] = Query(None, description="주차 (YYYY-MM-DD), None이면 최신 주차"),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    📊 프론트엔드용: 특정 주차의 모든 데이터 조회
    
    해당 주차의 공시/이슈/주가 데이터를 모두 조회하여 표 형태로 반환
    프론트엔드에서 /weekly/table-data?week=2025-01-13 형태로 호출
    
    Args:
        week: 조회할 주차 (YYYY-MM-DD)
    
    Returns:
        {
            "week": "2025-01-13",
            "companies": {
                "엔씨소프트": {
                    "disclosure": "...",
                    "issue": "...", 
                    "stockprice": "..."
                },
                ...
            },
            "summary": {...}
        }
    """
    
    try:
        weekly_service = WeeklyDataService(db)
        
        # week가 없으면 가장 최신 주차 사용
        if not week:
            available_weeks = await weekly_service.get_available_weeks(limit=1)
            if not available_weeks:
                raise HTTPException(status_code=404, detail="수집된 주차 데이터가 없습니다")
            week = available_weeks[0]
        
        logger.info(f"📊 주차별 테이블 데이터 조회 - Week: {week}")
        
        # 해당 주차의 모든 데이터 조회
        all_data = await weekly_service.get_weekly_data(week=week)
        
        if not all_data:
            raise HTTPException(status_code=404, detail=f"주차 {week}에 대한 데이터가 없습니다")
        
        # 기업별로 데이터 그룹핑
        companies_data = {}
        categories_count = {"disclosure": 0, "issue": 0, "stockprice": 0}
        
        for item in all_data:
            company_name = item["company_name"]
            category = item["category"]
            content = item["content"]
            
            # 기업별 데이터 구조 초기화
            if company_name not in companies_data:
                companies_data[company_name] = {
                    "disclosure": None,
                    "issue": None,
                    "stockprice": None,
                    "stock_code": item.get("stock_code")
                }
            
            # 카테고리별 데이터 저장
            companies_data[company_name][category] = {
                "content": content,
                "collected_at": item["collected_at"],
                "metadata": item.get("metadata", {})
            }
            
            categories_count[category] += 1
        
        # 주차 요약 정보
        summary = await weekly_service.get_weekly_summary(week)
        
        return {
            "week": week,
            "companies": companies_data,
            "summary": {
                "total_companies": len(companies_data),
                "categories_count": categories_count,
                "total_records": len(all_data),
                **summary
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 주차별 테이블 데이터 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"주차별 데이터 조회 중 오류 발생: {str(e)}"
        )


@router.get("/available-weeks")
async def get_available_weeks(
    limit: int = Query(20, description="조회할 주차 개수"),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """📅 사용 가능한 주차 목록 조회 (프론트엔드용)"""
    
    try:
        weekly_service = WeeklyDataService(db)
        weeks = await weekly_service.get_available_weeks(limit=limit)
        
        # 각 주차별 데이터 개수 조회
        weeks_with_count = []
        for week in weeks:
            summary = await weekly_service.get_weekly_summary(week)
            weeks_with_count.append({
                "week": week,
                "total_records": summary["total_records"],
                "total_companies": summary["total_companies"],
                "categories": summary["categories"]
            })
        
        return {
            "available_weeks": weeks_with_count,
            "total_weeks": len(weeks),
            "latest_week": weeks[0] if weeks else None
        }
        
    except Exception as e:
        logger.error(f"❌ 주차 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"주차 목록 조회 중 오류 발생: {str(e)}"
        )


@router.get("/summary/{week}")
async def get_week_summary(
    week: str,
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """📈 특정 주차 요약 통계"""
    
    try:
        weekly_service = WeeklyDataService(db)
        summary = await weekly_service.get_weekly_summary(week)
        
        if summary["total_records"] == 0:
            raise HTTPException(status_code=404, detail=f"주차 {week}에 대한 데이터가 없습니다")
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 주차 요약 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"주차 요약 조회 중 오류 발생: {str(e)}"
        )


@router.get("/batch-jobs")
async def get_batch_jobs_status(
    job_type: Optional[str] = Query(None, description="작업 타입 (disclosure/issue/stockprice)"),
    limit: int = Query(10, description="조회할 작업 개수"),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """🔧 배치 작업 상태 조회 (관리자용)"""
    
    try:
        batch_service = WeeklyBatchService(db)
        jobs = await batch_service.get_recent_jobs(job_type=job_type, limit=limit)
        
        # 성공/실패 통계
        success_count = len([j for j in jobs if j["status"] == "success"])
        failed_count = len([j for j in jobs if j["status"] == "failed"])
        running_count = len([j for j in jobs if j["status"] == "running"])
        
        return {
            "recent_jobs": jobs,
            "total_jobs": len(jobs),
            "statistics": {
                "success_count": success_count,
                "failed_count": failed_count,
                "running_count": running_count
            }
        }
        
    except Exception as e:
        logger.error(f"❌ 배치 작업 상태 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"배치 작업 상태 조회 중 오류 발생: {str(e)}"
        )


@router.get("/current-week")
async def get_current_week_info() -> Dict[str, Any]:
    """📅 현재 주차 정보"""
    
    try:
        current_week = WeeklyDataModel.get_current_week_monday()
        year, week_number = WeeklyDataModel.get_week_info(current_week)
        
        return {
            "current_week": current_week,
            "year": year,
            "week_number": week_number,
            "description": f"{year}년 {week_number}주차 ({current_week} 시작)"
        }
        
    except Exception as e:
        logger.error(f"❌ 현재 주차 정보 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"현재 주차 정보 조회 중 오류 발생: {str(e)}"
        ) 