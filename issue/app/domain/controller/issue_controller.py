from typing import List, Dict
from app.domain.service.issue_service import issue_service
from app.domain.service.news_pipeline_service import news_pipeline_service
from app.domain.model.data_schema import NewsPipelineResponse, SummarizedNews

class IssueController:
    def __init__(self):
        self.issue_service = issue_service
        self.news_pipeline_service = news_pipeline_service
    
    def get_important_news(self) -> List[Dict]:
        """
        중요한 뉴스를 가져오는 컨트롤러 메서드
        """
        print(f"🤍2 컨트롤러 진입")
        return self.issue_service.get_important_news()
    
    async def process_news_pipeline(self, companies: List[str]) -> NewsPipelineResponse:
        """
        뉴스 파이프라인 처리를 위한 컨트롤러 메서드
        """
        print(f"🤍2 뉴스 파이프라인 컨트롤러 진입")
        
        try:
            result = await self.news_pipeline_service.process_news_pipeline(companies)
            
            # 결과를 NewsPipelineResponse 형태로 변환
            summarized_news = []
            for item in result.get("data", []):
                summarized_news.append(SummarizedNews(**item))
            
            return NewsPipelineResponse(
                success=result.get("success", True),
                message=result.get("message", "뉴스 파이프라인 처리 완료"),
                data=summarized_news,
                stats=result.get("stats", {})
            )
        except Exception as e:
            print(f"❌ 뉴스 파이프라인 처리 중 오류: {str(e)}")
            return NewsPipelineResponse(
                success=False,
                message=f"뉴스 파이프라인 처리 실패: {str(e)}",
                data=[],
                stats={"error": 1}
            )

# 싱글톤 인스턴스
issue_controller = IssueController()
