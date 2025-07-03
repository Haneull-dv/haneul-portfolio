from fastapi import Depends
from ..service.kpi_compare_service import KpiCompareService

class KpiCompareController:
    def __init__(self, service: KpiCompareService = Depends()):
        """
        FastAPI의 의존성 주입 시스템을 통해 KpiCompareService 인스턴스를 받습니다.
        더 이상 Controller가 Service를 직접 생성하지 않습니다.
        """
        self.service = service

    async def search_company(self, query: str):
        return await self.service.search_company(query)

    async def get_reports(self, query: str):
        return await self.service.get_reports(query)

    async def get_kpi_for_report(self, query: str, rcept_no: str, bsns_year: str, reprt_code: str):
        return await self.service.get_kpi_for_report(query, rcept_no, bsns_year, reprt_code)