from fastapi import APIRouter, Depends, Query
from ..domain.controller.kpi_compare_controller import KpiCompareController

router = APIRouter(
    prefix="/kpi",
    tags=["KPI 비교"]
)

@router.get("/search", summary="기업 검색")
async def search_company(
    query: str = Query(..., description="검색할 기업명, 종목코드, DART 8자리 코드"),
    controller: KpiCompareController = Depends() # FastAPI가 Controller를 주입
):
    return await controller.search_company(query)

@router.get("/{query}/reports", summary="기업 보고서 목록 조회")
async def get_reports(
    query: str,
    controller: KpiCompareController = Depends() # FastAPI가 Controller를 주입
):
    return await controller.get_reports(query)

@router.get("/{query}/report/{rcept_no}/kpi", summary="보고서 기반 KPI 계산")
async def get_kpi_for_report(
    query: str,
    rcept_no: str,
    bsns_year: str = Query(..., description="사업연도 (예: 2023)", example="2023"),
    reprt_code: str = Query(..., description="보고서 코드 (11011: 사업보고서, 11012: 반기보고서, 11013: 1분기, 11014: 3분기)", example="11011"),
    controller: KpiCompareController = Depends() # FastAPI가 Controller를 주입
):
    return await controller.get_kpi_for_report(query, rcept_no, bsns_year, reprt_code)