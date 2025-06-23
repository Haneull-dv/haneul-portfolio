import os
import requests
import json
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

class NaverNewsService:
    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self.base_url = "https://openapi.naver.com/v1/search/news.json"
        
        # 디버깅: 환경 변수 로딩 상태 확인
        print(f"🔍 [DEBUG] 환경 변수 로딩 상태:")
        print(f"   - NAVER_CLIENT_ID: {self.client_id[:4] if self.client_id else 'None'}***")
        print(f"   - NAVER_CLIENT_SECRET: {self.client_secret[:4] if self.client_secret else 'None'}***")
        print(f"   - Base URL: {self.base_url}")
    
    async def fetch_news_for_company(self, company: str, display: int = 100) -> List[Dict]:
        """
        특정 기업의 뉴스를 네이버 API로 가져오기
        """
        print(f"🤍3-1 네이버 뉴스 서비스 진입 - 기업: {company}")
        
        if not self.client_id or not self.client_secret:
            error_msg = f"NAVER API 키가 설정되지 않았습니다. client_id: {bool(self.client_id)}, client_secret: {bool(self.client_secret)}"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        params = {
            "query": company,
            "display": display,
            "start": 1,
            "sort": "date"
        }
        
        # 디버깅: API 호출 정보 로그
        print(f"🔍 [DEBUG] API 호출 정보:")
        print(f"   - URL: {self.base_url}")
        print(f"   - Headers: X-Naver-Client-Id={self.client_id[:4]}***, X-Naver-Client-Secret={self.client_secret[:4]}***")
        print(f"   - Params: {params}")
        
        try:
            print(f"📡 API 호출 시작...")
            response = requests.get(self.base_url, headers=headers, params=params, timeout=10)
            
            # 디버깅: 응답 상태 상세 로그
            print(f"🔍 [DEBUG] API 응답:")
            print(f"   - Status Code: {response.status_code}")
            print(f"   - Response Headers: {dict(response.headers)}")
            print(f"   - Response Text (first 200 chars): {response.text[:200]}...")
            
            if response.status_code == 401:
                print(f"❌ 401 Unauthorized 에러 발생!")
                print(f"   - 사용된 Client ID: {self.client_id[:4]}***")
                print(f"   - 사용된 Client Secret: {self.client_secret[:4]}***")
                print(f"   - 전체 응답 내용: {response.text}")
                
                # 환경 변수를 다시 한번 확인
                current_id = os.getenv("NAVER_CLIENT_ID")
                current_secret = os.getenv("NAVER_CLIENT_SECRET")
                print(f"   - 현재 환경 변수 재확인:")
                print(f"     NAVER_CLIENT_ID: {current_id[:4] if current_id else 'None'}***")
                print(f"     NAVER_CLIENT_SECRET: {current_secret[:4] if current_secret else 'None'}***")
                
                raise Exception(f"네이버 API 인증 실패 (401): {response.text}")
            
            response.raise_for_status()
            
            data = response.json()
            news_items = data.get("items", [])
            
            # 필요한 필드만 추출
            processed_news = []
            for item in news_items:
                processed_news.append({
                    "company": company,
                    "title": self._clean_html_tags(item.get("title", "")),
                    "description": self._clean_html_tags(item.get("description", "")),
                    "link": item.get("link", ""),
                    "pubDate": item.get("pubDate", "")
                })
            
            print(f"✅ {company}: {len(processed_news)}개 뉴스 수집 완료")
            return processed_news
            
        except requests.exceptions.RequestException as e:
            print(f"❌ {company} 뉴스 수집 실패: {str(e)}")
            return []
        except Exception as e:
            print(f"❌ {company} 뉴스 처리 중 오류: {str(e)}")
            return []
    
    def _clean_html_tags(self, text: str) -> str:
        """
        HTML 태그 제거
        """
        import re
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)

# 싱글톤 인스턴스
naver_news_service = NaverNewsService()
print(f"🚨 최종 확인: {naver_news_service.client_id}") 