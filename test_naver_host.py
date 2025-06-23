#!/usr/bin/env python3
"""
Host 환경에서 네이버 뉴스 API 테스트
"""
import requests

def test_with_manual_keys():
    print("🧪 Host 환경에서 네이버 API 테스트")
    print("=" * 50)
    
    # 수동으로 키 입력 (테스트용)
    client_id = input("NAVER_CLIENT_ID 입력: ").strip()
    client_secret = input("NAVER_CLIENT_SECRET 입력: ").strip()
    
    if not client_id or not client_secret:
        print("❌ 키가 입력되지 않았습니다!")
        return
    
    print(f"🔍 입력된 값:")
    print(f"   - Client ID: {client_id[:4]}*** (길이: {len(client_id)})")
    print(f"   - Client Secret: {client_secret[:4]}*** (길이: {len(client_secret)})")
    
    # API 호출
    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret
    }
    params = {
        "query": "테스트",
        "display": 1,
        "start": 1,
        "sort": "date"
    }
    
    try:
        print(f"\n🚀 Host에서 API 호출...")
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        print(f"📋 응답 결과:")
        print(f"   - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Host에서 API 호출 성공!")
            data = response.json()
            print(f"   - 검색 결과: {len(data.get('items', []))}개")
        else:
            print(f"❌ Host에서도 실패: {response.status_code}")
            print(f"   - 응답: {response.text}")
            
    except Exception as e:
        print(f"❌ Host 테스트 중 오류: {str(e)}")

if __name__ == "__main__":
    test_with_manual_keys() 