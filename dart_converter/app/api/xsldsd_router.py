from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from typing import Dict, List, Any, Optional
from app.domain.controller.xsldsd_controller import xsldsd_controller

# 라우터 생성
router = APIRouter(
    tags=["Dart Converter"],
    responses={404: {"description": "Not found"}},
)


@router.get("/health")
async def health_check():
    try:
        print("💚 /health 라우터 호출됨")
        return {"status": "ok"}
    except Exception as e:
        print("🔥 /health 예외 발생:", e)
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@router.post("/upload", response_model=Dict[str, Any])
async def upload_excel(
    file: UploadFile = File(...),
    sheet_names: Optional[List[str]] = Query(None, description="변환할 특정 시트 이름 목록 (예: D210000, D310000)", alias="sheet_name")
):
    """
    엑셀 파일을 업로드하고 JSON으로 변환합니다.
    특정 시트만 변환하려면 쿼리 파라미터로 sheet_name을 여러 개 지정할 수 있습니다.
    
    Args:
        file: 업로드할 엑셀 파일
        sheet_names: 변환할 특정 시트 이름 목록 (지정하지 않으면 모든 시트 변환)
        
    사용 예시:
        - 모든 시트 변환: /xsldsd/upload
        - 특정 시트만 변환: /xsldsd/upload?sheet_name=D210000&sheet_name=D310000
        
    Returns:
        Dict[str, Any]: 파일 정보와 변환된 JSON 데이터
    """
    try:
        print(f"✅ /upload 라우터 진입: file={file.filename}, sheet_names={sheet_names}")
        result = await xsldsd_controller.upload_excel_file(file, sheet_names)
        return result
    except Exception as e:
        print(f"🔥 /upload 예외 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload Excel file: {str(e)}")