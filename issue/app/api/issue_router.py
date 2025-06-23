from fastapi import APIRouter
from typing import List
from app.domain.controller.issue_controller import issue_controller
from app.domain.model.data_schema import NewsPipelineRequest, NewsPipelineResponse, ErrorResponse

router = APIRouter(prefix="/issue", tags=["issue"])

@router.get("/important-news")
async def get_important_news():
    """
    중요한 뉴스를 반환하는 엔드포인트
    """
    print(f"🤍1 라우터 진입")
    return issue_controller.get_important_news()

@router.post("/news", response_model=NewsPipelineResponse)
async def process_news_pipeline(request: NewsPipelineRequest = None):
    """
    뉴스 파이프라인 처리 엔드포인트
    기업명 리스트를 받아 뉴스 수집 -> 필터링 -> 요약 과정을 거쳐 결과 반환
    """
    print(f"🤍1 뉴스 파이프라인 라우터 진입")
    
    # 요청이 없으면 기본값 사용
    if request is None:
        request = NewsPipelineRequest()
    
    return await issue_controller.process_news_pipeline(request.companies)
