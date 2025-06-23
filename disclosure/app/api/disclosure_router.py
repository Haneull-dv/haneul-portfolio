from fastapi import APIRouter, HTTPException
from app.domain.controller.disclosure_controller import DisclosureController
from app.domain.model.data_schema import DisclosureResponse

router = APIRouter()

@router.get("/fetch", response_model=DisclosureResponse)
async def fetch_disclosures():
    """🎮 게임기업 공시 정보를 가져오는 엔드포인트"""
    print("🚀1 라우터 진입 - 공시 조회 요청")
    
    try:
        controller = DisclosureController()
        result = await controller.fetch_game_companies_disclosures()
        print("🚀2 라우터 - 컨트롤러 호출 완료")
        return result
    except Exception as e:
        print(f"❌ 라우터 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"공시 조회 중 오류 발생: {str(e)}")

@router.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    print("💚 헬스체크 진입")
    return {"status": "healthy", "service": "disclosure"} 