"""
요약 모델 학습 관련 도메인 모델
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TrainingConfig(BaseModel):
    """학습 설정 모델"""
    model_name: str = Field("dnotitia/Llama-DNA-1.0-8B-Instruct", description="사용할 모델명")
    dataset_path: str = Field("./data/final_input_output_dataset_filtered.csv", description="데이터셋 경로")
    output_dir: str = Field("./outputs", description="출력 디렉터리")
    max_seq_length: int = Field(512, description="최대 시퀀스 길이")
    per_device_train_batch_size: int = Field(1, description="디바이스당 배치 크기")
    gradient_accumulation_steps: int = Field(4, description="그래디언트 누적 스텝")
    num_train_epochs: int = Field(15, description="학습 에포크 수")
    learning_rate: float = Field(2e-4, description="학습률")
    fp16: bool = Field(True, description="FP16 사용 여부")
    save_steps: int = Field(100, description="저장 스텝")

class TrainingStatus(BaseModel):
    """학습 상태 모델"""
    is_training: bool = Field(False, description="학습 중 여부")
    current_step: int = Field(0, description="현재 스텝")
    total_steps: int = Field(0, description="총 스텝")
    status: str = Field("idle", description="상태")
    start_time: Optional[datetime] = Field(None, description="시작 시간")
    end_time: Optional[datetime] = Field(None, description="종료 시간")
    result: Optional[Dict[str, Any]] = Field(None, description="학습 결과")
    error: Optional[str] = Field(None, description="에러 메시지")

class TrainingResult(BaseModel):
    """학습 결과 모델"""
    status: str = Field(..., description="학습 상태")
    train_runtime: float = Field(0.0, description="학습 실행 시간")
    train_samples_per_second: float = Field(0.0, description="초당 샘플 수")
    train_loss: float = Field(0.0, description="학습 손실")
    output_dir: str = Field(..., description="출력 디렉터리")
    total_steps: int = Field(0, description="총 스텝 수")

class LoRAConfig(BaseModel):
    """LoRA 설정 모델"""
    r: int = Field(64, description="LoRA rank")
    alpha: int = Field(16, description="LoRA alpha")
    dropout: float = Field(0.1, description="LoRA dropout")
    target_modules: List[str] = Field(["q_proj", "v_proj"], description="타겟 모듈")
    bias: str = Field("none", description="bias 설정")
    task_type: str = Field("CAUSAL_LM", description="태스크 타입")

"""
뉴스 요약 모델 학습 도메인 모델
"""
class TrainingRequest(BaseModel):
    """학습 요청 모델"""
    epochs: Optional[int] = Field(15, description="학습 에포크 수")
    batch_size: Optional[int] = Field(1, description="배치 크기")
    learning_rate: Optional[float] = Field(2e-4, description="학습률")
    max_seq_length: Optional[int] = Field(512, description="최대 시퀀스 길이")

class TrainingResponse(BaseModel):
    """학습 응답 모델"""
    status: str = Field(..., description="학습 상태")
    message: str = Field(..., description="응답 메시지")
    training_id: Optional[str] = Field(None, description="학습 ID")

class TrainingStatusResponse(BaseModel):
    """학습 상태 응답 모델"""
    is_training: bool = Field(..., description="학습 중 여부")
    current_step: int = Field(..., description="현재 스텝")
    total_steps: int = Field(..., description="총 스텝")
    status: str = Field(..., description="상태")
    result: Optional[Dict[str, Any]] = Field(None, description="학습 결과")
    error: Optional[str] = Field(None, description="에러 메시지") 