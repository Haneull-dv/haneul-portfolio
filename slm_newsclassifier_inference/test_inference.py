#!/usr/bin/env python3
"""
News Classifier Inference Test Script
이전 infer.py처럼 테스트 데이터를 실행하고 결과를 확인하는 스크립트
"""
import requests
import json
import time

def test_inference_api():
    """API를 통한 추론 테스트"""
    base_url = "http://localhost:8000"
    
    # 테스트 데이터
    test_texts = [
        "엔씨소프트, MMORPG '블레이드앤소울2' 글로벌 출시",
        "넥슨, 2분기 역대 최대 실적 기록",
        "게임 산업에 대한 정부 규제 완화 논의",
        "애플, 새로운 아이폰 출시 루머",
        "해외 투자자, 한국 증시에 관심 낮아져",
        "강아지가 산책하다가 귀여움을 받음",
        "비가 오는 날씨에 우산 판매량 증가",
        "카트라이더의 새로운 맵 \"아이스월드\" 출시",
        "리니지 새로운 캐릭터 \"이즈원\" 공개",
        "텐센트, 넥슨 인수 소식",
        "위믹스 상장폐지 소식에 주가 급락",
        "지배구조 재편으로 esg 투자 증가",
        "오픈월드, \"아케이드\"맵 전체 업데이트",
        "개발자 \"파이널 판타지16\" 출시 예정에 법적 대응",
        "지속가능경영보고서 최초 발간",
        "농협은행과 mou 체결하여 채무 조정 소식",
        "엔씨소프트 등 게임주 '장중 급등'...3대 이슈는?",
        "pubg: 배틀그라운드, 국가대항전 'pnc 2025' 서울에서 개최",
        "아이돌 콜라보 늦추자 … 크래프톤, 2분기 실적 주춤",
        "크래프톤, 배틀그라운드 국가대항전 'pnc 2025' 개최"
    ]
    
    print("=" * 80)
    print("🧪 News Classifier Inference API Test")
    print("=" * 80)
    
    # 서버 상태 확인
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running!")
            server_info = response.json()
            print(f"   Service: {server_info.get('service', 'N/A')}")
            print(f"   Status: {server_info.get('status', 'N/A')}")
            print(f"   Version: {server_info.get('version', 'N/A')}")
        else:
            print("❌ Server check failed")
            return
    except requests.exceptions.RequestException:
        print("❌ Server is not running!")
        print("   Please start the inference service first:")
        print("   cd slm-newsclassifier-inference && python main.py")
        return
    
    print("\n" + "=" * 80)
    print("📊 Testing Individual Predictions")
    print("=" * 80)
    
    # 개별 테스트
    success_count = 0
    total_count = len(test_texts)
    
    for i, text in enumerate(test_texts, 1):
        try:
            print(f"\n[{i:2d}/{total_count}] Testing: {text[:50]}{'...' if len(text) > 50 else ''}")
            
            # API 호출
            payload = {"text": text}
            response = requests.post(
                f"{base_url}/api/v1/predict",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                pred_result = result['result']
                print(f"         🎯 Label: {pred_result['label']} | Confidence: {pred_result['confidence']:.4f}")
                success_count += 1
            else:
                print(f"         ❌ Error: {response.status_code} - {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"         ⏰ Timeout error")
        except requests.exceptions.RequestException as e:
            print(f"         ❌ Request error: {e}")
        except Exception as e:
            print(f"         ❌ Unexpected error: {e}")
    
    # 배치 테스트
    print("\n" + "=" * 80)
    print("📊 Testing Batch Prediction")
    print("=" * 80)
    
    try:
        print(f"🔄 Processing {len(test_texts)} texts in batch...")
        
        payload = {"text": test_texts}
        response = requests.post(
            f"{base_url}/api/v1/predict",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            batch_results = result['result']
            print(f"✅ Batch prediction successful! Processed {len(batch_results)} texts")
            
            # 결과 요약
            label_counts = {}
            for pred_result in batch_results:
                label = pred_result['label']
                label_counts[label] = label_counts.get(label, 0) + 1
            
            print("\n📈 Label Distribution:")
            for label, count in sorted(label_counts.items()):
                print(f"   Label {label}: {count} texts ({count/len(batch_results)*100:.1f}%)")
                
        else:
            print(f"❌ Batch prediction failed: {response.status_code} - {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ Batch prediction timeout")
    except Exception as e:
        print(f"❌ Batch prediction error: {e}")
    
    # 결과 요약
    print("\n" + "=" * 80)
    print("📋 Test Summary")
    print("=" * 80)
    print(f"Total tests: {total_count}")
    print(f"Successful: {success_count}")
    print(f"Failed: {total_count - success_count}")
    print(f"Success rate: {success_count/total_count*100:.1f}%")
    
    if success_count == total_count:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Please check the logs above.")

if __name__ == "__main__":
    test_inference_api() 