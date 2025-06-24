# test_inference.py - 뉴스 요약 모델 추론 테스트
import requests
import json
import time

def test_summarization():
    """학습 데이터와 동일한 형태의 뉴스로 요약 테스트"""
    
    # 🎯 학습 데이터와 유사한 형태의 테스트 샘플들
    test_samples = [
        {
            "name": "게임주 급등 뉴스",
            "news": {
                "title": "이게 얼마 만이냐 엔씨소프트, 신작 기대감에 8% 급등[핫종목]",
                "description": """18일 한국거래소에 따르면 엔씨소프트(036570)는 전일 대비 1만 5000원(8.73%) 오른 18만 6900원에 거래를 마쳤다. 카카오게임즈(293490)도 전일 대비 950원(5.73%) 오른 1만 7520원에 장을 마감했다.
이외에 넷마블(251270)(5.61%), 데브시스터즈(194480)(5.13%), 크래프톤(259960)(4.08%) 등이 강세였다. 장현국 대표가 이끄는 넥써쓰(205500)도 블록체인 게임 4종의 온보딩 계약을 체결했다는 소식에 9.98% 올랐다.
게임주 상승은 하반기 신작에 대한 기대감이 커진 영향이다. 이번 6월 미국 SGF를 비롯해 8월에는 독일의 게임스컴, 9월에는 일본의 도쿄게임쇼가 예정돼 있으며, 각 게임사들은 각 사의 게임을 출품할 것으로 예상된다."""
            },
            "expected_summary": "엔씨소프트 등 게임주들이 하반기 신작 기대감으로 급등"
        },
        
        {
            "name": "AI 기술 발표",
            "news": {
                "title": "자체 개발한 AI 플랫폼 '하이퍼클로바' 기반 서비스 공개",
                "description": """최근 기업 발표에 따르면 자체 개발한 AI 플랫폼 '하이퍼클로바' 기반 새로운 서비스 개발 공개와 관련한 내용이 공식적으로 확인되었다. 해당 이슈는 AI업계 및 투자자 사이에서 주목을 받고 있으며, 여러 매체를 통해 세부 내용과 기업 측 입장이 보도되고 있다."""
            },
            "expected_summary": "자체 개발한 AI 플랫폼 '하이퍼클로바' 기반 서비스 공개"
        },
        
        {
            "name": "투자/M&A 뉴스",
            "news": {
                "title": "제3자배정증자 방식의 유상증자 결정",
                "description": """최근 기업 발표에 따르면 제3자배정증자 방식의 유상증자 결정과 관련한 내용이 공식적으로 확인되었다. 해당 이슈는 투자업계 및 주주들 사이에서 주목을 받고 있으며, 여러 매체를 통해 세부 내용과 기업 측 입장이 보도되고 있다."""
            },
            "expected_summary": "제3자배정증자 방식의 유상증자 결정"
        },
        
        {
            "name": "게임 출시 소식",
            "news": {
                "title": "신작 MMORPG '나이트 크로우' 사전 예약 시작",
                "description": """최근 기업 발표에 따르면 신작 MMORPG '나이트 크로우'의 프리뷰 영상 공개 및 사전 예약 시작과 관련한 내용이 공식적으로 확인되었다. 해당 이슈는 게임업계 및 게이머들 사이에서 주목을 받고 있으며, 여러 매체를 통해 세부 내용과 출시 일정이 보도되고 있다."""
            },
            "expected_summary": "신작 MMORPG '나이트 크로우' 사전 예약 시작"
        }
    ]
    
    # FastAPI inference 엔드포인트
    URL = "http://localhost:8003/api/v1/summarize"
    
    print("🚀 뉴스 요약 모델 테스트 시작")
    print("=" * 60)
    
    success_count = 0
    total_count = len(test_samples)
    
    for i, sample in enumerate(test_samples, 1):
        print(f"\n📰 테스트 {i}/{total_count}: {sample['name']}")
        print("-" * 40)
        
        try:
            # 요청 데이터 준비 (SummarizeRequest 스키마에 맞춤)
            payload = {"news": sample["news"]}
            
            print(f"📝 입력 헤드라인: {sample['news']['title']}")
            print(f"📄 입력 디스크립션: {sample['news']['description'][:100]}...")
            print(f"🎯 예상 요약: {sample['expected_summary']}")
            
            # API 호출
            start_time = time.time()
            response = requests.post(URL, json=payload, timeout=30)
            end_time = time.time()
            
            if response.ok:
                result = response.json()
                actual_summary = result.get("summary", "")
                title_field = result.get("title", "")
                status = result.get("status", "unknown")
                
                print(f"✅ 응답 상태: {status}")
                print(f"⚡ 처리 시간: {end_time - start_time:.2f}초")
                print(f"📋 실제 요약: {actual_summary}")
                print(f"🏷️  title 필드: {title_field}")
                
                # 요약 품질 간단 평가
                if actual_summary and len(actual_summary.strip()) > 0:
                    print("✅ 요약 생성 성공")
                    success_count += 1
                    
                    # 한 줄인지 확인
                    if "\n" not in actual_summary.strip():
                        print("✅ 한 줄 요약 성공")
                    else:
                        print("⚠️  여러 줄 요약 (한 줄 요약 목표와 다름)")
                        
                    # title과 summary 일치 확인
                    if title_field == actual_summary:
                        print("✅ title과 summary 필드 일치")
                    else:
                        print("⚠️  title과 summary 필드 불일치")
                else:
                    print("❌ 요약 생성 실패 (빈 결과)")
                    
            else:
                print(f"❌ API 호출 실패: {response.status_code}")
                print(f"   에러 메시지: {response.text}")
                
        except requests.exceptions.Timeout:
            print("❌ 요청 타임아웃 (30초 초과)")
        except requests.exceptions.ConnectionError:
            print("❌ 연결 오류 - 서버가 실행 중인지 확인하세요")
        except Exception as e:
            print(f"❌ 예외 발생: {str(e)}")
    
    # 전체 결과 요약
    print("\n" + "=" * 60)
    print(f"🎯 테스트 결과 요약")
    print(f"   성공: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
    
    if success_count == total_count:
        print("🎉 모든 테스트 성공!")
    elif success_count > 0:
        print("⚠️  일부 테스트 실패")
    else:
        print("❌ 모든 테스트 실패 - 서버 상태를 확인하세요")

def test_server_health():
    """서버 상태 확인"""
    try:
        health_url = "http://localhost:8003/api/v1/health"
        response = requests.get(health_url, timeout=5)
        
        if response.ok:
            print("✅ 서버 상태: 정상")
            return True
        else:
            print(f"⚠️  서버 응답 이상: {response.status_code}")
            return False
    except:
        print("❌ 서버에 연결할 수 없습니다")
        return False

if __name__ == "__main__":
    print("🔍 뉴스 요약 모델 추론 테스트")
    print("학습 데이터와 동일한 형태의 입력으로 테스트")
    print("=" * 60)
    
    # 1. 서버 상태 확인
    print("1️⃣  서버 상태 확인")
    if not test_server_health():
        print("\n❌ 서버가 실행되지 않았습니다.")
        print("다음 명령으로 서버를 시작하세요:")
        print("cd slm-summarizer-inference && python main.py")
        exit(1)
    
    print("\n2️⃣  요약 성능 테스트")
    # 2. 요약 테스트 실행
    test_summarization()
