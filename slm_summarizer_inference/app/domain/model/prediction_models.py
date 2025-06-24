"""
요약 모델 추론 관련 도메인 모델
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class NewsInput(BaseModel):
    """뉴스 입력 모델"""
    title: str = Field(..., description="뉴스 제목")
    description: str = Field(..., description="뉴스 본문")

class SummarizeRequest(BaseModel):
    """요약 요청 모델"""
    news: NewsInput = Field(..., description="요약할 뉴스")
    max_new_tokens: Optional[int] = Field(100, description="최대 생성 토큰 수")
    temperature: Optional[float] = Field(0.7, description="생성 온도")
    top_p: Optional[float] = Field(0.9, description="Top-p 샘플링")

class BatchSummarizeRequest(BaseModel):
    """배치 요약 요청 모델"""
    news_list: List[NewsInput] = Field(..., description="요약할 뉴스 리스트")
    max_new_tokens: Optional[int] = Field(100, description="최대 생성 토큰 수")
    temperature: Optional[float] = Field(0.7, description="생성 온도")

class SummarizeResponse(BaseModel):
    """요약 응답 모델"""
    title: str = Field(..., description="원본 뉴스 제목")
    summary: str = Field(..., description="생성된 요약")
    status: str = Field(..., description="처리 상태")
    error: Optional[str] = Field(None, description="에러 메시지")

class BatchSummarizeResponse(BaseModel):
    """배치 요약 응답 모델"""
    results: List[SummarizeResponse] = Field(..., description="요약 결과 리스트")
    total_count: int = Field(..., description="총 처리 건수")
    success_count: int = Field(..., description="성공 건수")
    error_count: int = Field(..., description="실패 건수")

class ModelStatus(BaseModel):
    """모델 상태 모델"""
    model_loaded: bool = Field(..., description="모델 로딩 상태")
    model_path: str = Field(..., description="모델 경로")
    base_model: str = Field(..., description="베이스 모델명")
    device: str = Field(..., description="사용 디바이스")
    status: str = Field(..., description="상태") 