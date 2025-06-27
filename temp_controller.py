"""
뉴스 요약 모델 추론 컨트롤러
API 라우터와 서비스 간의 중개 역할
"""
from typing import Dict, Any
from ..service.summarizer_service import SummarizerService

class SummarizerController:
    """요약 모델 추론 컨트롤러"""

    def __init__(self):
        self.summarizer_service = SummarizerService()

    async def get_service_info(self) -> Dict[str, str]:
        """서비스 정보 조회"""
        return await self.summarizer_service.get_service_info()

    async def summarize_single(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """단일 텍스트 요약 - 한 문장 요약 생성"""
        try:
            # 입력 데이터 추출
            title = request_data.get("news", {}).get("title", "")
            description = request_data.get("news", {}).get("description", "")
            max_new_tokens = request_data.get("max_new_tokens", 50)  # 한 문장이므로 토큰 수 줄임
            temperature = request_data.get("temperature", 0.7)
            top_p = request_data.get("top_p", 0.9)

            # 모델 로드 확인
            await self.summarizer_service._ensure_model_loaded()

            # 올바른 generate_summary 메서드 호출
            raw_summary = await self.summarizer_service.predictor.generate_summary(
                title=title,
                description=description,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p
            )

            # 줄바꿈 제거하고 앞뒤 공백 정리
            one_line = raw_summary.replace("\n", " ").strip()

            # title 필드에도 요약문을 담고, summary에도 동일하게 넣어줍니다.
            return {
                "title": one_line,
                "summary": one_line,
                "status": "success"
            }

        except Exception as e:
            # 에러 발생 시 원본 title 사용
            orig_title = request_data.get("news", {}).get("title", "")
            return {
                "title": orig_title,
                "summary": "",
                "status": "error",
                "error": str(e)
            }

    async def summarize_batch(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """배치 텍스트 요약"""
        return await self.summarizer_service.summarize_batch(request_data)

    async def get_model_status(self) -> Dict[str, Any]:
        """모델 상태 조회"""
        return await self.summarizer_service.get_model_status()

    async def reload_model(self) -> Dict[str, str]:
        """모델 재로딩"""
        return await self.summarizer_service.reload_model()

    async def health_check(self) -> Dict[str, str]:
        """헬스 체크"""
        return {"status": "healthy", "message": "Summarizer service is running"} 