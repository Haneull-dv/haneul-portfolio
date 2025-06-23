import requests
import asyncio
from typing import List, Dict

class ClassifierService:
    def __init__(self):
        self.classifier_url = "http://newsclassifier:8087/predict"
    
    async def classify_news(self, news_list: List[Dict]) -> List[Dict]:
        """
        2차 중요도 분류 모델로 뉴스 제목 분류
        """
        print(f"🤍3-3 분류기 서비스 진입 - 총 {len(news_list)}개 뉴스")
        
        if not news_list:
            return []
        
        classified_news = []
        
        try:
            # 배치로 분류 시도
            titles = [news["title"] for news in news_list]
            
            response = requests.post(
                self.classifier_url,
                json={"text": titles},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                batch_results = result.get("result", [])
                
                # 결과와 원본 뉴스 매칭
                for i, news in enumerate(news_list):
                    if i < len(batch_results):
                        prediction = batch_results[i]
                        news["classification"] = {
                            "label": prediction.get("label"),
                            "confidence": prediction.get("confidence")
                        }
                        
                        # 라벨이 1인 경우만 통과
                        if prediction.get("label") == 1:
                            classified_news.append(news)
                
                print(f"✅ 분류기 처리 완료: {len(classified_news)}개 뉴스가 중요도 기준 통과")
                return classified_news
            
            else:
                print(f"❌ 분류기 API 호출 실패: {response.status_code}")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 분류기 호출 중 네트워크 오류: {str(e)}")
            return []
        except Exception as e:
            print(f"❌ 분류기 처리 중 오류: {str(e)}")
            return []

# 싱글톤 인스턴스
classifier_service = ClassifierService() 