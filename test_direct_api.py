import requests
import json

# 올바른 형식으로 API 테스트
url = "http://localhost:8088/summarize"
payload = {
    "news": {
        "title": "크래프톤, 배틀그라운드 신규 맵 추가 업데이트 발표",
        "description": "크래프톤이 인기 게임 배틀그라운드에 새로운 맵을 추가하는 대규모 업데이트를 발표했습니다. 이번 업데이트에는 새로운 게임 모드와 함께 다양한 기능 개선사항이 포함되어 있습니다."
    }
}

headers = {
    "Content-Type": "application/json"
}

print("🧪 올바른 형식으로 API 테스트")
print(f"📤 URL: {url}")
print(f"📤 Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")

try:
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    print(f"📥 응답 상태: {response.status_code}")
    print(f"📥 응답 내용: {response.text}")
except Exception as e:
    print(f"❌ 오류: {e}") 