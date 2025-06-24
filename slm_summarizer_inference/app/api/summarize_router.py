"""
뉴스 요약 모델 추론 API 라우터
"""
from fastapi import APIRouter, HTTPException
from typing import List
from ..domain.controller.summarizer_controller import SummarizerController
from ..domain.model.prediction_models import SummarizeRequest, SummarizeResponse, BatchSummarizeRequest, BatchSummarizeResponse

router = APIRouter(tags=["summarize"])

# 컨트롤러 인스턴스
summarizer_controller = SummarizerController()

@router.get("/")
async def root():
    """서비스 상태 확인"""
    return await summarizer_controller.get_service_info()

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """단일 텍스트 요약"""
    try:
        result = await summarizer_controller.summarize_single(request.dict())
        return SummarizeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize/batch", response_model=BatchSummarizeResponse)
async def summarize_batch(request: BatchSummarizeRequest):
    """배치 텍스트 요약"""
    try:
        result = await summarizer_controller.summarize_batch(request.dict())
        return BatchSummarizeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/status")
async def get_model_status():
    """모델 상태 확인"""
    try:
        return await summarizer_controller.get_model_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/model/reload")
async def reload_model():
    """모델 재로딩"""
    try:
        return await summarizer_controller.reload_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """헬스 체크"""
    return await summarizer_controller.health_check() 