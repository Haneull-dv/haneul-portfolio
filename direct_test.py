#!/usr/bin/env python3
"""
호스트 환경에서 네이버 API 직접 테스트
"""
import requests
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수에서 API 키 가져오기
client_id = os.getenv('NAVER_CLIENT_ID')
client_secret = os.getenv('NAVER_CLIENT_SECRET')

print("🏠 호스트 환경에서 네이버 API 테스트")
print("=" * 50)

if not client_id or not client_secret:
    print("❌ 환경 변수에서 API 키를 찾을 수 없습니다.")
    print("수동으로 입력해주세요:")
    client_id = input("NAVER_CLIENT_ID: ").strip()
    client_secret = input("NAVER_CLIENT_SECRET: ").strip()

print(f"🔍 사용할 API 키:")
print(f"  - Client ID: {client_id[:4]}***{client_id[-4:] if len(client_id) > 8 else client_id}")
print(f"  - Client Secret: {client_secret[:2]}***{client_secret[-2:] if len(client_secret) > 4 else client_secret}")

# 여러 헤더 조합으로 테스트
test_cases = [
    {
        "name": "기본 헤더",
        "headers": {
            "X-Naver-Client-Id": client_id,
            "X-Naver-Client-Secret": client_secret
        }
    },
    {
        "name": "User-Agent 추가",
        "headers": {
            "X-Naver-Client-Id": client_id,
            "X-Naver-Client-Secret": client_secret,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    },
    {
        "name": "완전한 User-Agent",
        "headers": {
            "X-Naver-Client-Id": client_id,
            "X-Naver-Client-Secret": client_secret,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    }
]

url = "https://openapi.naver.com/v1/search/news.json"
params = {
    "query": "테스트",
    "display": 1,
    "start": 1,
    "sort": "date"
}

for i, test_case in enumerate(test_cases, 1):
    print(f"\n🧪 테스트 {i}: {test_case['name']}")
    print("-" * 30)
    
    try:
        response = requests.get(url, headers=test_case['headers'], params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 성공!")
            data = response.json()
            print(f"총 뉴스 수: {data.get('total', 0)}")
            break
        else:
            print(f"❌ 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 예외 발생: {e}")

print(f"\n🔍 추가 확인사항:")
print(f"1. 네이버 개발자센터에서 서비스 상태 확인")
print(f"2. API 사용량 제한 확인")
print(f"3. 서비스 URL 설정이 저장되었는지 확인") 