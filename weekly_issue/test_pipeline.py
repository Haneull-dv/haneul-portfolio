#!/usr/bin/env python3
"""
News Pipeline Test Script
뉴스 파이프라인 API 테스트용 스크립트
"""
import requests
import json
import time

def test_news_pipeline():
    """뉴스 파이프라인 API 테스트"""
    base_url = "http://localhost:8089"
    
    print("🧪 뉴스 파이프라인 테스트 시작")
    print("=" * 50)
    
    # 서버 상태 확인
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ 서버 실행 중!")
        else:
            print("❌ 서버 상태 확인 실패")
            return
    except requests.exceptions.RequestException:
        print("❌ 서버가 실행되지 않았습니다!")
        print("   서버를 먼저 실행해주세요: cd app && python -m uvicorn main:app --port 8089")
        return
    
    # 테스트 케이스 1: 기본 기업 리스트로 테스트
    print("\n📊 테스트 1: 기본 기업 리스트 사용")
    try:
        start_time = time.time()
        response = requests.post(
            f"{base_url}/issue/news",
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 테스트 성공! (소요시간: {elapsed_time:.2f}초)")
            print(f"   📰 총 수집: {result.get('total_collected', 0)}개")
            print(f"   🔍 키워드 필터 통과: {result.get('after_keyword_filter', 0)}개")
            print(f"   🤖 AI 분류 통과: {result.get('after_classification', 0)}개")
            print(f"   📝 최종 요약: {result.get('final_summaries', 0)}개")
            
            # 결과 샘플 출력
            results = result.get('results', [])
            if results:
                print(f"\n📄 결과 샘플 (상위 3개):")
                for i, item in enumerate(results[:3], 1):
                    print(f"   {i}. 기업: {item.get('corp')}")
                    print(f"      요약: {item.get('summary', '')[:100]}...")
                    print(f"      신뢰도: {item.get('confidence', 0):.4f}")
                    print()
        else:
            print(f"❌ 테스트 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ 테스트 타임아웃 (60초 초과)")
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    
    # 테스트 케이스 2: 특정 기업으로 테스트
    print("\n📊 테스트 2: 특정 기업 리스트 사용")
    test_companies = ["크래프톤", "엔씨소프트"]
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{base_url}/issue/news",
            json=test_companies,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 테스트 성공! (소요시간: {elapsed_time:.2f}초)")
            print(f"   처리 기업: {result.get('companies_processed', [])}")
            print(f"   최종 요약: {result.get('final_summaries', 0)}개")
        else:
            print(f"❌ 테스트 실패: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 테스트 완료!")

if __name__ == "__main__":
    test_news_pipeline() 