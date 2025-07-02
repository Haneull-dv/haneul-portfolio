import requests
import json
import time

def test_kpi_api():
    base_url = "http://localhost:8000"
    
    # 서버가 실행될 때까지 잠시 대기
    print("🔄 서버 시작 대기 중...")
    time.sleep(3)
    
    try:
        # 1. 기업 검색 테스트
        print("\n1️⃣ 기업 검색 테스트")
        search_response = requests.get(f"{base_url}/kpi/search?query=네오위즈")
        print(f"Status: {search_response.status_code}")
        if search_response.status_code == 200:
            search_data = search_response.json()
            print(f"검색 결과: {json.dumps(search_data, ensure_ascii=False, indent=2)}")
        else:
            print(f"오류: {search_response.text}")
            return
        
        # 2. 보고서 목록 조회 테스트
        print("\n2️⃣ 보고서 목록 조회 테스트")
        reports_response = requests.get(f"{base_url}/kpi/네오위즈/reports")
        print(f"Status: {reports_response.status_code}")
        if reports_response.status_code == 200:
            reports_data = reports_response.json()
            print(f"보고서 개수: {len(reports_data)}")
            if reports_data:
                print(f"첫 번째 보고서: {json.dumps(reports_data[0], ensure_ascii=False, indent=2)}")
                
                # 3. KPI 계산 테스트 (첫 번째 보고서 사용)
                print("\n3️⃣ KPI 계산 테스트")
                first_report = reports_data[0]
                rcept_no = first_report['rcept_no']
                # 보고서에서 연도와 보고서 코드 추출
                bsns_year = first_report.get('bsns_year', '2024')
                
                # 보고서 타입에 따른 코드 설정
                report_nm = first_report.get('report_nm', '')
                if '사업보고서' in report_nm:
                    reprt_code = '11011'
                elif '반기보고서' in report_nm:
                    reprt_code = '11012'
                elif '1분기' in report_nm:
                    reprt_code = '11013'
                elif '3분기' in report_nm:
                    reprt_code = '11014'
                else:
                    reprt_code = '11011'  # 기본값
                
                kpi_url = f"{base_url}/kpi/네오위즈/report/{rcept_no}/kpi?bsns_year={bsns_year}&reprt_code={reprt_code}"
                print(f"요청 URL: {kpi_url}")
                
                kpi_response = requests.get(kpi_url)
                print(f"Status: {kpi_response.status_code}")
                if kpi_response.status_code == 200:
                    kpi_data = kpi_response.json()
                    print(f"KPI 결과:")
                    print(f"  - 기업명: {kpi_data.get('company_name')}")
                    print(f"  - 총 KPI 개수: {kpi_data.get('total_kpi_count')}")
                    print(f"  - 대분류별 KPI:")
                    for category, kpis in kpi_data.get('categories', {}).items():
                        print(f"    {category}: {len(kpis)}개")
                        # 각 카테고리에서 첫 번째 KPI 샘플 출력
                        if kpis:
                            print(f"      예시: {kpis[0]['kpi_name']} = {kpis[0]['value']} {kpis[0]['unit']}")
                else:
                    print(f"KPI 계산 오류: {kpi_response.text}")
            else:
                print("보고서가 없습니다.")
        else:
            print(f"보고서 조회 오류: {reports_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.")
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")

if __name__ == "__main__":
    test_kpi_api() 