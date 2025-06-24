from fastapi import APIRouter, HTTPException
import sys
import os

# 도메인 모델 스키마 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from domain.model.training_models import TrainingRequest, TrainingResponse

# 도메인 컨트롤러 계층 import
from domain.controller.trainer_controller import trainer_controller

router = APIRouter(tags=["training"])

@router.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    """
    모델 학습 실행 엔드포인트
    
    - **data_path**: 학습 데이터 파일 경로
    - **output_dir**: 출력 디렉토리
    - **model_name**: 기본 모델 이름
    - **epochs**: 학습 에포크 수
    - **batch_size**: 배치 크기
    - **learning_rate**: 학습률
    """
    try:
        # 컨트롤러를 통한 학습 실행
        result = trainer_controller.execute_training(
            data_path=request.data_path,
            output_dir=request.output_dir,
            model_name=request.model_name,
            epochs=request.epochs,
            batch_size=request.batch_size,
            learning_rate=request.learning_rate
        )
        
        return TrainingResponse(
            status="success",
            message="학습이 성공적으로 완료되었습니다.",
            output_path=f"{request.output_dir}/model"
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"학습 중 오류가 발생했습니다: {str(e)}") 