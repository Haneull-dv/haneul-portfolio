from ..service.kpi_compare_service import KpiCompareService

class KpiCompareController:
    def __init__(self):
        self.service = KpiCompareService()

    async def search_company(self, query: str):
        return await self.service.search_company(query)

    async def get_reports(self, query: str):
        # query = 회사명/종목코드/8자리코드 전부 허용!
        return await self.service.get_reports(query)

    async def get_kpi_for_report(self, query: str, rcept_no: str, bsns_year: str, reprt_code: str):
        # rcept_no는 그대로 사용, 회사 식별자(query)만 통일
        return await self.service.get_kpi_for_report(query, rcept_no, bsns_year, reprt_code)
