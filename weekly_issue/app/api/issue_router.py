from fastapi import APIRouter, HTTPException, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

# 공통 DB 모듈 import
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))
from weekly_db.db.db_builder import get_db_session

# 서비스 모듈 import
from app.domain.controller.issue_controller import IssueController
from weekly_issue.app.domain.model.issue_model import NewsPipelineRequest, NewsPipelineResponse, ErrorResponse
from weekly_issue.app.domain.schema.issue_schema import IssueListResponse

router = APIRouter(prefix="/issue", tags=["issue"])

# ========== 뉴스 파이프라인 엔드포인트 ==========

@router.post("/news", response_model=NewsPipelineResponse)
async def process_news_pipeline(
    request: NewsPipelineRequest = Body(default_factory=NewsPipelineRequest),
    db: AsyncSession = Depends(get_db_session)
):
    """🔍 뉴스 파이프라인 처리 및 DB 저장
    
    기업명 리스트를 받아 뉴스 수집 → 필터링 → AI 분석 → 요약 과정을 거쳐 결과 반환
    """
    print(f"🤍1 뉴스 파이프라인 라우터 진입")
    
    try:
        controller = IssueController(db_session=db)
        result = await controller.process_news_pipeline(request.companies)
        print("🤍2 뉴스 파이프라인 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ 뉴스 파이프라인 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"뉴스 파이프라인 처리 중 오류 발생: {str(e)}")

@router.get("/important-news")
async def get_important_news(db: AsyncSession = Depends(get_db_session)):
    """📰 중요한 뉴스를 반환 (단순 조회용)"""
    print(f"🤍1 중요 뉴스 라우터 진입")
    
    try:
        controller = IssueController(db_session=db)
        result = controller.get_important_news()
        print("🤍2 중요 뉴스 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ 중요 뉴스 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"중요 뉴스 조회 중 오류 발생: {str(e)}")

# ========== DB 조회 전용 엔드포인트 ==========

@router.get("/recent", response_model=IssueListResponse)
async def get_recent_issues(
    days: int = Query(7, description="조회할 일수"),
    db: AsyncSession = Depends(get_db_session)
):
    """📋 DB에서 최근 N일간의 이슈 정보 조회"""
    print(f"🤍1 DB 조회 라우터 진입 - 최근 {days}일")
    
    try:
        controller = IssueController(db_session=db)
        result = await controller.get_recent_issues_from_db(days=days)
        print("🤍2 DB 조회 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ DB 조회 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"DB 조회 중 오류 발생: {str(e)}")

@router.get("/search", response_model=IssueListResponse)
async def search_issues(
    corp: Optional[str] = Query(None, description="기업명"),
    keyword: Optional[str] = Query(None, description="키워드"),
    min_confidence: Optional[float] = Query(None, description="최소 신뢰도"),
    page: int = Query(1, description="페이지 번호"),
    page_size: int = Query(20, description="페이지 크기"),
    db: AsyncSession = Depends(get_db_session)
):
    """🔍 DB에서 이슈 정보 검색"""
    print(f"🤍1 검색 라우터 진입 - 기업: {corp}, 키워드: {keyword}")
    
    try:
        controller = IssueController(db_session=db)
        result = await controller.search_issues(
            corp=corp,
            keyword=keyword,
            min_confidence=min_confidence,
            page=page,
            page_size=page_size
        )
        print("🤍2 검색 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ 검색 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")

@router.get("/high-confidence")
async def get_high_confidence_issues(
    min_confidence: float = Query(0.8, description="최소 신뢰도"),
    db: AsyncSession = Depends(get_db_session)
):
    """⭐ 고신뢰도 이슈 조회"""
    print(f"🤍1 고신뢰도 이슈 라우터 진입 - 임계값: {min_confidence}")
    
    try:
        controller = IssueController(db_session=db)
        result = await controller.get_high_confidence_issues(min_confidence=min_confidence)
        print("🤍2 고신뢰도 이슈 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ 고신뢰도 이슈 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"고신뢰도 이슈 조회 중 오류 발생: {str(e)}")

# ========== 헬스체크 엔드포인트 ==========

@router.get("/health")
async def health_check():
    """💚 헬스체크 엔드포인트"""
    print("💚 헬스체크 진입")
    return {"status": "healthy", "service": "issue_analysis"}

@router.get("/")
async def root():
    """📋 서비스 정보"""
    return {
        "service": "Weekly Issue Analysis Service",
        "version": "1.0.0",
        "description": "게임기업 뉴스 이슈 분석 및 AI 요약 서비스",
        "endpoints": {
            "news_pipeline": "/issue/news",
            "important_news": "/issue/important-news",
            "recent": "/issue/recent",
            "search": "/issue/search",
            "high_confidence": "/issue/high-confidence",
            "health": "/issue/health"
        }
    }
