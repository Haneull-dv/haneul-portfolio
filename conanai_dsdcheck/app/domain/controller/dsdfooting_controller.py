from fastapi import UploadFile, HTTPException
from app.domain.service.dsdfooting_service import DSDFootingService
from app.domain.model.dsdfooting_schema import FootingResponse
import logging

class DSDFootingController:
    """재무제표 검증 컨트롤러"""
    
    def __init__(self):
        self.service = DSDFootingService()
    
    async def check_footing(self, file: UploadFile) -> FootingResponse:
        """
        D210000 연결재무상태표 합계검증 수행
        
        **처리 과정:**
        1. 엑셀 파일에서 D210000 시트 찾기
        2. 5행에서 연도 헤더 추출 (2024-12-31, 2023-12-31, 2022-12-31)
        3. 6행~53행에서 계정과목별 금액 데이터 추출
        4. 연도별로 합계검증 수행
        5. 검증 결과를 계층적 구조로 반환
        
        Args:
            file (UploadFile): 검증할 D210000 연결재무상태표 엑셀 파일
            
        Returns:
            FootingResponse: 연도별 합계검증 결과를 포함하는 JSON 응답
            - total_sheets: 검증된 총 시트 수 (1개)
            - mismatch_count: 총 불일치 항목 수
            - results: 시트별 검증 결과 목록
                - sheet: 시트 코드 ("D210000")
                - title: 시트 제목 ("연결재무상태표")
                - results_by_year: 연도별 검증 결과 딕셔너리
                    - key: 연도 ("2024-12-31", "2023-12-31", "2022-12-31")
                    - value: 검증 항목 목록
                        - item: 항목명 (예: "자산총계", "유동자산")
                        - expected: 기대값 (하위 항목들의 합)
                        - actual: 실제값 (엑셀에서 읽은 값)
                        - is_match: 일치 여부 (true/false)
                        - children: 하위 항목 검증 결과 (재귀적 구조)
        
        **검증 규칙:**
        - 자산총계 = 유동자산 + 비유동자산
        - 부채총계 = 유동부채 + 비유동부채
        - 자본총계 = 지배기업의소유지분 + 비지배지분
        - 자본과부채총계 = 부채총계 + 자본총계
        - 특수검증: 자산총계 = 부채총계 + 자본총계
        """
        try:
            # 파일 컨텐츠 읽기
            contents = await file.read()
            
            # 서비스 호출하여 검증 수행
            result = self.service.check_footing(contents)
            
            logging.info(f"Successfully validated {result.total_sheets} sheets with {result.mismatch_count} mismatches")
            return result
            
        except Exception as e:
            logging.error(f"Failed to process file {file.filename}: {str(e)}")
            raise