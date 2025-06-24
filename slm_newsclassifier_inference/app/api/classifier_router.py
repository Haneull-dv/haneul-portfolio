from fastapi import APIRouter, HTTPException
import sys
import os

# 도메인 모델 스키마 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from domain.model.prediction_models import PredictionRequest, PredictionResponse

# 도메인 컨트롤러 계층 import
from domain.controller.classifier_controller import classifier_controller

router = APIRouter(tags=["classifier"])

@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    뉴스 텍스트 분류 예측 엔드포인트
    
    - **text**: 분류할 뉴스 텍스트 (단일 문자열 또는 문자열 리스트)
    - **returns**: 예측 결과 (단일 결과 또는 결과 리스트)
    """
    try:
        # 컨트롤러를 통한 예측 실행
        if isinstance(request.text, str):
            # 단일 텍스트 예측
            result = classifier_controller.predict_text(request.text)
            return PredictionResponse(result=result)
        elif isinstance(request.text, list):
            # 배치 텍스트 예측
            results = classifier_controller.predict_batch_texts(request.text)
            return PredictionResponse(result=results)
        else:
            raise HTTPException(status_code=400, detail="text는 문자열 또는 문자열 리스트여야 합니다.")
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"예측 중 오류가 발생했습니다: {str(e)}")

@router.get("/health")
async def health_check():
    """
    서비스 상태 확인
    """
    return {"status": "healthy", "service": "news-classifier-inference"} 