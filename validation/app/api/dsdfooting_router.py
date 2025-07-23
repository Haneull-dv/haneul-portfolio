from fastapi import APIRouter, UploadFile, File, HTTPException
from app.domain.controller.dsdfooting_controller import DSDFootingController
from app.domain.model.dsdfooting_schema import FootingResponse

router = APIRouter(prefix="/api/v1/dsdfooting", tags=["재무제표 검증"])

controller = DSDFootingController()

@router.post("/check-footing", response_model=FootingResponse)
async def check_footing(file: UploadFile = File(...)) -> FootingResponse:
    """
    D210000 연결재무상태표의 합계검증을 수행합니다.
    
    **엑셀 파일 구조:**
    - 5행: 연도 헤더 (B열: 2024-12-31, C열: 2023-12-31, D열: 2022-12-31)  
    - 6행-53행: 계정과목과 금액 데이터
    - A열: 계정과목명
    - B열: 2024년 금액
    - C열: 2023년 금액  
    - D열: 2022년 금액
    
    **지원 계정과목 구조:**
    ```
    자산총계 = 유동자산 + 비유동자산
    ├── 유동자산 = 현금및현금성자산 + 매출채권및기타채권 + 당기법인세자산 + 금융자산 + 기타자산 + 재고자산 + 매각예정비유동자산
    └── 비유동자산 = 매출채권및기타채권 + 관계기업투자 + 유형자산 + 사용권자산 + 투자부동산 + 무형자산 + 금융자산 + 순확정급여자산 + 기타자산 + 이연법인세자산
    
    부채총계 = 유동부채 + 비유동부채
    ├── 유동부채 = 매입채무및기타채무 + 금융부채 + 리스부채 + 당기법인세부채 + 충당부채 + 매각예정비유동부채 + 기타부채
    └── 비유동부채 = 매입채무및기타채무 + 금융부채 + 리스부채 + 충당부채 + 기타부채 + 순확정급여부채 + 이연법인세부채
    
    자본총계 = 지배기업의소유지분 + 비지배지분
    └── 지배기업의소유지분 = 자본금 + 주식발행초과금 + 이익잉여금 + 기타자본
    
    자본과부채총계 = 부채총계 + 자본총계
    ```
    
    **특수 검증 규칙:**
    - 자산부채자본일치: 자산총계 = 부채총계 + 자본총계
    - 부채자본합계일치: 자본과부채총계 = 부채총계 + 자본총계
    
    Args:
        file (UploadFile): D210000 연결재무상태표 엑셀 파일 (xlsx)
    
    Returns:
        FootingResponse: 검증 결과
        - total_sheets: 검증된 시트 수 (1개)
        - mismatch_count: 불일치 항목 수
        - results: 연도별 검증 결과
            - sheet: "D210000"
            - title: "연결재무상태표"
            - results_by_year: 연도별 검증 결과 딕셔너리
                - key: "YYYY-12-31" (예: "2024-12-31", "2023-12-31", "2022-12-31")
                - value: 검증 항목 목록
                    - item: 검증 항목명
                    - expected: 기대값 (하위 항목들의 합)
                    - actual: 실제값 (엑셀에서 읽은 값)
                    - is_match: 일치 여부 (true/false)
                    - children: 하위 항목 검증 결과 (재귀적 구조)
    """
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Excel file required")
        
    try:
        return await controller.check_footing(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def health_check():
    return {"message": "Hello World from dsdfooting"}
