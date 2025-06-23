import asyncio
from typing import List, Dict
from .naver_news_service import naver_news_service
from .keyword_filter_service import keyword_filter_service
from .classifier_service import classifier_service
from .summary_service import summary_service

class NewsPipelineService:
    def __init__(self):
        self.naver_service = naver_news_service
        self.keyword_filter = keyword_filter_service
        self.classifier = classifier_service
        self.summary = summary_service
    
    async def process_news_pipeline(self, companies: List[str]) -> Dict:
        """
        전체 뉴스 파이프라인 처리
        1. 네이버 뉴스 수집
        2. 키워드 1차 필터링
        3. AI 모델 2차 분류
        4. 요약 생성
        """
        print(f"🤍3 뉴스 파이프라인 서비스 진입 - 기업 수: {len(companies)}")
        
        try:
            # 1단계: 모든 기업의 뉴스 수집
            print("📰 1단계: 뉴스 수집 시작")
            all_news = []
            
            # 동시에 모든 기업 뉴스 수집
            tasks = [self.naver_service.fetch_news_for_company(company) for company in companies]
            news_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in news_results:
                if isinstance(result, list):
                    all_news.extend(result)
                else:
                    print(f"뉴스 수집 중 오류: {result}")
            
            print(f"✅ 1단계 완료: 총 {len(all_news)}개 뉴스 수집")
            
            if not all_news:
                return {
                    "status": "success",
                    "message": "수집된 뉴스가 없습니다.",
                    "total_collected": 0,
                    "after_keyword_filter": 0,
                    "after_classification": 0,
                    "final_summaries": 0,
                    "results": []
                }
            
            # 2단계: 키워드 기반 1차 필터링
            print("🔍 2단계: 키워드 필터링 시작")
            keyword_filtered_news = self.keyword_filter.filter_by_keywords(all_news)
            
            if not keyword_filtered_news:
                return {
                    "status": "success",
                    "message": "키워드 필터링을 통과한 뉴스가 없습니다.",
                    "total_collected": len(all_news),
                    "after_keyword_filter": 0,
                    "after_classification": 0,
                    "final_summaries": 0,
                    "results": []
                }
            
            # 3단계: AI 모델 2차 분류
            print("🤖 3단계: AI 분류 시작")
            classified_news = await self.classifier.classify_news(keyword_filtered_news)
            
            if not classified_news:
                return {
                    "status": "success",
                    "message": "AI 분류를 통과한 뉴스가 없습니다.",
                    "total_collected": len(all_news),
                    "after_keyword_filter": len(keyword_filtered_news),
                    "after_classification": 0,
                    "final_summaries": 0,
                    "results": []
                }
            
            # 4단계: 요약 생성
            print("📝 4단계: 요약 생성 시작")
            final_results = await self.summary.summarize_news(classified_news)
            
            # 결과 정리
            pipeline_result = {
                "status": "success",
                "message": "뉴스 파이프라인 처리 완료",
                "total_collected": len(all_news),
                "after_keyword_filter": len(keyword_filtered_news),
                "after_classification": len(classified_news),
                "final_summaries": len(final_results),
                "companies_processed": companies,
                "results": final_results
            }
            
            print(f"🎉 파이프라인 완료: 최종 {len(final_results)}개 요약 생성")
            return pipeline_result
            
        except Exception as e:
            print(f"❌ 파이프라인 처리 중 오류: {str(e)}")
            return {
                "status": "error",
                "message": f"파이프라인 처리 중 오류 발생: {str(e)}",
                "total_collected": 0,
                "after_keyword_filter": 0,
                "after_classification": 0,
                "final_summaries": 0,
                "results": []
            }

# 싱글톤 인스턴스
news_pipeline_service = NewsPipelineService() 