import requests
import time

print("🏥 Health Check 테스트")

try:
    response = requests.get("http://localhost:8088/health", timeout=5)
    print(f"📥 Health Check 응답: {response.status_code}")
    print(f"📥 응답 내용: {response.text}")
except Exception as e:
    print(f"❌ Health Check 실패: {e}")

print("\n🧪 간단한 API 테스트 (타임아웃 60초)")
try:
    response = requests.post(
        "http://localhost:8088/summarize",
        json={
            "news": {
                "title": "테스트",
                "description": "간단한 테스트입니다."
            }
        },
        timeout=60
    )
    print(f"📥 API 테스트 응답: {response.status_code}")
    print(f"📥 응답 내용: {response.text}")
except Exception as e:
    print(f"❌ API 테스트 실패: {e}") 