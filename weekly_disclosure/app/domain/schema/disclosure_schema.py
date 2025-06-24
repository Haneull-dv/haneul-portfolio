from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# === 기본 공시 아이템 ===
class DisclosureItemBase(BaseModel):
    """공시 아이템 기본 스키마"""
    company_name: str = Field(..., description="회사명", example="크래프톤")
    stock_code: str = Field(..., description="종목코드", example="259960")
    disclosure_title: str = Field(..., description="공시 제목", example="단일판매·공급계약 체결")
    disclosure_date: str = Field(..., description="공시 날짜", example="20241220")
    report_name: str = Field(..., description="보고서명", example="단일판매·공급계약 체결")

class DisclosureItemCreate(DisclosureItemBase):
    """공시 아이템 생성 스키마"""
    pass

class DisclosureItemUpdate(BaseModel):
    """공시 아이템 수정 스키마"""
    company_name: Optional[str] = None
    stock_code: Optional[str] = None
    disclosure_title: Optional[str] = None
    disclosure_date: Optional[str] = None
    report_name: Optional[str] = None

class DisclosureItem(DisclosureItemBase):
    """공시 아이템 응답 스키마"""
    id: int = Field(..., description="공시 ID")
    created_at: Optional[datetime] = Field(None, description="생성 시간")
    updated_at: Optional[datetime] = Field(None, description="수정 시간")
    
    class Config:
        from_attributes = True

# === API 응답 스키마 ===
class DisclosureResponse(BaseModel):
    """공시 조회 API 응답 스키마"""
    status: str = Field(..., description="응답 상태", example="success")
    message: str = Field(..., description="응답 메시지", example="최근 7일간 게임기업 공시 조회 완료")
    disclosures: List[DisclosureItem] = Field(..., description="공시 목록")
    total_count: int = Field(..., description="총 공시 개수", example=15)

class DisclosureListResponse(BaseModel):
    """공시 목록 조회 응답 스키마"""
    status: str = Field("success", description="응답 상태")
    message: str = Field("공시 목록 조회 완료", description="응답 메시지")
    data: List[DisclosureItem] = Field(..., description="공시 데이터 목록")
    total_count: int = Field(..., description="총 개수")
    page: int = Field(1, description="현재 페이지")
    page_size: int = Field(20, description="페이지 크기")

# === 요청 스키마 ===
class DisclosureFetchRequest(BaseModel):
    """공시 수집 요청 스키마"""
    start_date: Optional[str] = Field(None, description="시작 날짜 (YYYYMMDD)", example="20241213")
    end_date: Optional[str] = Field(None, description="종료 날짜 (YYYYMMDD)", example="20241220")
    company_codes: Optional[List[str]] = Field(None, description="대상 기업 코드 목록", example=["259960", "036570"])

class DisclosureSearchRequest(BaseModel):
    """공시 검색 요청 스키마"""
    company_name: Optional[str] = Field(None, description="회사명")
    stock_code: Optional[str] = Field(None, description="종목코드")
    start_date: Optional[str] = Field(None, description="시작 날짜")
    end_date: Optional[str] = Field(None, description="종료 날짜")
    page: int = Field(1, ge=1, description="페이지 번호")
    page_size: int = Field(20, ge=1, le=100, description="페이지 크기")

# === 에러 응답 ===
class ErrorResponse(BaseModel):
    """에러 응답 스키마"""
    status: str = Field("error", description="응답 상태")
    message: str = Field(..., description="에러 메시지")
    error_code: Optional[str] = Field(None, description="에러 코드")
    details: Optional[dict] = Field(None, description="에러 세부사항")
