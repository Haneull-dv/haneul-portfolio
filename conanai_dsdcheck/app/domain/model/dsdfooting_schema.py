from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class FootingResultItem(BaseModel):
    """개별 검증 항목 결과"""
    item: str = Field(..., description="검증 항목명")
    expected: Optional[float] = Field(None, description="기대값 (합계)")
    actual: Optional[float] = Field(None, description="실제값")
    is_match: bool = Field(..., description="일치 여부")
    children: Optional[List[FootingResultItem]] = Field(None, description="하위 항목 목록")

class YearlyFootingSheetResult(BaseModel):
    """시트별 연도별 검증 결과"""
    sheet: str = Field(..., description="시트 코드 (예: D210000)")
    title: str = Field(..., description="시트 제목 (예: 재무상태표 - 연결)")
    results_by_year: Dict[str, List[FootingResultItem]] = Field(
        ..., 
        description="연도별 검증 결과 (key: 연도, value: 검증 항목 목록)"
    )

class FootingResponse(BaseModel):
    """전체 검증 결과 응답"""
    results: List[YearlyFootingSheetResult] = Field(..., description="시트별 검증 결과 목록")
    total_sheets: int = Field(..., description="검증된 총 시트 수")
    mismatch_count: int = Field(..., description="불일치 항목 수")