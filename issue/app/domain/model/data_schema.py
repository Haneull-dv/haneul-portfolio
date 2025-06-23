"""
Issue 서비스의 데이터 스키마 정의
뉴스 파이프라인에서 사용되는 모든 요청/응답 모델
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ===== 네이버 뉴스 관련 스키마 =====
class NaverNewsItem(BaseModel):
    """네이버 뉴스 아이템"""
    title: str = Field(..., description="뉴스 제목")
    originallink: str = Field(..., description="원본 링크")
    link: str = Field(..., description="네이버 뉴스 링크")
    description: str = Field(..., description="뉴스 본문")
    pubDate: str = Field(..., description="발행일")

class NaverNewsResponse(BaseModel):
    """네이버 뉴스 API 응답"""
    lastBuildDate: str
    total: int
    start: int
    display: int
    items: List[NaverNewsItem]

# ===== 키워드 필터링 관련 스키마 =====
class FilteredNews(BaseModel):
    """키워드 필터링된 뉴스"""
    title: str
    description: str
    company: str
    matched_keywords: List[str]
    original_data: NaverNewsItem

# ===== AI 분류기 관련 스키마 =====
class ClassifierRequest(BaseModel):
    """분류기 요청"""
    text: str = Field(..., description="분류할 텍스트")

class ClassifierResponse(BaseModel):
    """분류기 응답"""
    result: Dict[str, Any] = Field(..., description="분류 결과")

class ClassificationResult(BaseModel):
    """분류 결과"""
    text: str
    label: int
    confidence: float

# ===== 요약기 관련 스키마 =====
class NewsInput(BaseModel):
    """요약기용 뉴스 입력"""
    title: str = Field(..., description="뉴스 제목")
    description: str = Field(..., description="뉴스 본문")

class SummarizeRequest(BaseModel):
    """요약 요청"""
    news: NewsInput = Field(..., description="요약할 뉴스")
    max_new_tokens: Optional[int] = Field(100, description="최대 생성 토큰 수")
    temperature: Optional[float] = Field(0.7, description="생성 온도")
    top_p: Optional[float] = Field(0.9, description="Top-p 샘플링")

class SummarizeResponse(BaseModel):
    """요약 응답"""
    title: str = Field(..., description="원본 뉴스 제목")
    summary: str = Field(..., description="생성된 요약")
    status: str = Field(..., description="처리 상태")
    error: Optional[str] = Field(None, description="에러 메시지")

# ===== 뉴스 파이프라인 관련 스키마 =====
class ProcessedNews(BaseModel):
    """처리된 뉴스 (분류 + 필터링 완료)"""
    title: str
    description: str
    company: str
    matched_keywords: List[str]
    classification: ClassificationResult
    original_data: NaverNewsItem

class SummarizedNews(BaseModel):
    """요약 완료된 뉴스"""
    corp: str = Field(..., description="회사명")
    summary: str = Field(..., description="요약 내용")
    original_title: str = Field(..., description="원본 제목")
    confidence: float = Field(..., description="분류 신뢰도")
    matched_keywords: List[str] = Field(..., description="매칭된 키워드")

# ===== API 요청/응답 스키마 =====
class NewsPipelineRequest(BaseModel):
    """뉴스 파이프라인 요청"""
    companies: Optional[List[str]] = Field(
        default=["크래프톤", "엔씨소프트", "넷마블", "펄어비스", "카카오게임즈", "위메이드", "네오위즈", "NHN", "컴투스"],
        description="검색할 회사 목록"
    )
    display: Optional[int] = Field(default=100, description="검색할 뉴스 개수")

class NewsPipelineResponse(BaseModel):
    """뉴스 파이프라인 응답"""
    success: bool = Field(..., description="처리 성공 여부")
    message: str = Field(..., description="처리 결과 메시지")
    data: List[SummarizedNews] = Field(..., description="요약된 뉴스 목록")
    stats: Dict[str, int] = Field(..., description="처리 통계")

# ===== 에러 스키마 =====
class ErrorResponse(BaseModel):
    """에러 응답"""
    success: bool = Field(default=False, description="처리 성공 여부")
    error: str = Field(..., description="에러 메시지")
    details: Optional[Dict[str, Any]] = Field(None, description="에러 상세 정보")

# ===== 헬스체크 스키마 =====
class HealthCheckResponse(BaseModel):
    """헬스체크 응답"""
    service: str = Field(..., description="서비스명")
    status: str = Field(..., description="서비스 상태")
    timestamp: datetime = Field(default_factory=datetime.now, description="체크 시간")
    dependencies: Optional[Dict[str, str]] = Field(None, description="의존 서비스 상태")
