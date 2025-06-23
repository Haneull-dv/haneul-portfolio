from app.domain.service.disclosure_service import DisclosureService
from app.domain.model.data_schema import DisclosureResponse

class DisclosureController:
    def __init__(self):
        self.service = DisclosureService()
        print("🎯1 컨트롤러 초기화 완료")

    async def fetch_game_companies_disclosures(self) -> DisclosureResponse:
        """게임기업들의 최신 공시 정보를 조회"""
        print("🎯2 컨트롤러 진입 - 공시 조회 시작")
        
        try:
            result = await self.service.get_game_companies_disclosures()
            print(f"🎯3 컨트롤러 - 서비스 호출 완료, 총 {len(result.disclosures)}개 공시 조회")
            return result
        except Exception as e:
            print(f"❌ 컨트롤러 에러: {str(e)}")
            raise e 