from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

# 공통 DB 모듈 import
import sys
import os

from app.config.db.db_singleton import db_singleton
from app.config.db.db_builder import get_db_session
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../..'))
from app.config.db.db_singleton import db_singleton

# 서비스 모듈 import
from app.domain.controller.disclosure_controller import DisclosureController
from app.domain.schema.disclosure_schema import DisclosureResponse
from app.domain.schema.disclosure_schema import DisclosureListResponse

router = APIRouter()

# ========== 공시 데이터 수집 엔드포인트 ==========

@router.get("/fetch", response_model=DisclosureResponse)
async def fetch_disclosures(db: AsyncSession = Depends(get_db_session)):
    """🎮 게임기업 공시 정보를 가져오고 DB에 저장"""
    print("🚀1 라우터 진입 - 공시 조회 요청")
    
    try:
        controller = DisclosureController()
        result = await controller.fetch_game_companies_disclosures(db_session=db)
        print("🚀2 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"공시 조회 중 오류 발생: {str(e)}")

# ========== DB 조회 전용 엔드포인트 ==========

@router.get("/recent-with-companies")
async def get_recent_disclosures_with_companies(
    days: int = Query(7, description="조회할 일수"),
    db: AsyncSession = Depends(get_db_session)
):
    """📋 DB에서 최근 N일간의 공시 정보 + 기업 정보 조회 (프론트엔드용)"""
    print(f"🚀1 DB 조회 라우터 진입 (기업정보 포함) - 최근 {days}일")
    
    try:
        controller = DisclosureController()
        disclosures_result = await controller.get_recent_disclosures_from_db(days=days, db_session=db)
        
        # 공시 데이터에서 기업 정보 추출
        companies_set = set()
        for disclosure in disclosures_result.data:
            if disclosure.company_name and disclosure.stock_code:
                companies_set.add((disclosure.stock_code, disclosure.company_name))
        
        # 기업 정보 목록 생성
        companies = [
            {
                "symbol": stock_code,
                "name": company_name,
                "country": "KR"  # 기본값으로 한국 설정
            }
            for stock_code, company_name in companies_set
        ]
        
        print(f"🚀2 DB 조회 라우터 (기업정보 포함) - 공시: {len(disclosures_result.data)}개, 기업: {len(companies)}개")
        
        return {
            "status": "success",
            "message": f"공시 정보 및 기업 정보 조회 완료",
            "disclosures": disclosures_result.data,
            "companies": companies,
            "total_disclosures": len(disclosures_result.data),
            "total_companies": len(companies)
        }
        
    except Exception as e:
        print(f"❌ DB 조회 라우터 (기업정보 포함) 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"DB 조회 중 오류 발생: {str(e)}")

@router.get("/recent", response_model=DisclosureListResponse)
async def get_recent_disclosures(
    days: int = Query(7, description="조회할 일수"),
    db: AsyncSession = Depends(get_db_session)
):
    """📋 DB에서 최근 N일간의 공시 정보 조회"""
    print(f"🚀1 DB 조회 라우터 진입 - 최근 {days}일")
    
    try:
        controller = DisclosureController()
        result = await controller.get_recent_disclosures_from_db(days=days, db_session=db)
        print("🚀2 DB 조회 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ DB 조회 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"DB 조회 중 오류 발생: {str(e)}")

@router.get("/search", response_model=DisclosureListResponse)
async def search_disclosures(
    company_name: Optional[str] = Query(None, description="회사명"),
    stock_code: Optional[str] = Query(None, description="종목코드"),
    page: int = Query(1, description="페이지 번호"),
    page_size: int = Query(20, description="페이지 크기"),
    db: AsyncSession = Depends(get_db_session)
):
    """🔍 DB에서 공시 정보 검색"""
    print(f"🚀1 검색 라우터 진입 - 회사: {company_name}, 코드: {stock_code}")
    
    try:
        controller = DisclosureController()
        result = await controller.search_disclosures(
            company_name=company_name,
            stock_code=stock_code,
            page=page,
            page_size=page_size,
            db_session=db
        )
        print("🚀2 검색 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ 검색 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")

# ========== 헬스체크 엔드포인트 ==========

@router.get("/health")
async def health_check():
    """💚 헬스체크 엔드포인트"""
    print("💚 헬스체크 진입")
    return {"status": "healthy", "service": "disclosure"}

@router.get("/")
async def root():
    """📋 서비스 정보"""
    return {
        "service": "Game Company Disclosure Service",
        "version": "1.0.0",
        "description": "게임기업 공시 정보 수집 및 조회 서비스",
        "endpoints": {
            "fetch": "/disclosures/fetch",
            "recent": "/disclosures/recent",
            "search": "/disclosures/search",
            "health": "/disclosures/health"
        }
    } 