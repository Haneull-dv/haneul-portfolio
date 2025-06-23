import requests
from typing import List, Dict
from ..model.data_schema import SummarizeRequest, NewsInput

class SummaryService:
    def __init__(self):
        self.summary_url = "http://summarizer:8088/summarize"
    
    async def summarize_news(self, news_list: List[Dict]) -> List[Dict]:
        """
        요약 모델로 뉴스 요약 생성
        """
        print(f"🤍3-4 요약 서비스 진입 - 총 {len(news_list)}개 뉴스")
        
        summarized_results = []
        
        for news in news_list:
            try:
                # 요약 모델에 제목과 본문 전송 (description 필드로 수정)
                payload = {
                   "news": {
                        "title": news.get("title", ""),
                        "description": news.get("description", "")
                    }
                }
                
                response = requests.post(
                    self.summary_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=15
                )
                
                if response.status_code == 200:
                    summary_result = response.json()
                    
                    summarized_results.append({
                        "corp": news.get("company"),
                        "summary": summary_result.get("summary", "요약 생성 실패"),
                        "original_title": news.get("title"),
                        "confidence": news.get("classification", {}).get("confidence", 0),
                        "matched_keywords": news.get("matched_keywords", [])
                    })
                    
                    print(f"✅ {news.get('company')} 뉴스 요약 완료")
                
                else:
                    print(f"❌ 요약 API 호출 실패: {response.status_code}, 응답: {response.text}")
                    # 요약 실패 시에도 기본 정보는 포함
                    summarized_results.append({
                        "corp": news.get("company"),
                        "summary": "요약 생성 실패",
                        "original_title": news.get("title"),
                        "confidence": news.get("classification", {}).get("confidence", 0),
                        "matched_keywords": news.get("matched_keywords", [])
                    })
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ {news.get('company')} 요약 중 네트워크 오류: {str(e)}")
                summarized_results.append({
                    "corp": news.get("company"),
                    "summary": "네트워크 오류로 요약 실패",
                    "original_title": news.get("title"),
                    "confidence": news.get("classification", {}).get("confidence", 0),
                    "matched_keywords": news.get("matched_keywords", [])
                })
            except Exception as e:
                print(f"❌ {news.get('company')} 요약 중 오류: {str(e)}")
                summarized_results.append({
                    "corp": news.get("company"),
                    "summary": "처리 중 오류 발생",
                    "original_title": news.get("title"),
                    "confidence": news.get("classification", {}).get("confidence", 0),
                    "matched_keywords": news.get("matched_keywords", [])
                })
        
        print(f"✅ 요약 처리 완료: 총 {len(summarized_results)}개")
        return summarized_results

# 싱글톤 인스턴스
summary_service = SummaryService() 