"""
뉴스 요약 모델 학습 API 라우터
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from ..domain.controller.summarizer_trainer_controller import SummarizerTrainerController
from ..domain.model.training_models import TrainingRequest, TrainingResponse, TrainingStatusResponse

router = APIRouter(prefix="/api/v1", tags=["training"])

# 컨트롤러 인스턴스
trainer_controller = SummarizerTrainerController()

@router.get("/")
async def root():
    """서비스 상태 확인"""
    return await trainer_controller.get_service_info()

@router.get("/status", response_model=TrainingStatusResponse)
async def get_training_status():
    """학습 상태 조회"""
    try:
        result = await trainer_controller.get_training_status()
        return TrainingStatusResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train", response_model=TrainingResponse)
async def start_training(request: TrainingRequest, background_tasks: BackgroundTasks):
    """학습 시작"""
    try:
        result = await trainer_controller.start_training(request.dict(), background_tasks)
        return TrainingResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_training():
    """학습 중단"""
    try:
        return await trainer_controller.stop_training()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """헬스 체크"""
    return await trainer_controller.health_check() 