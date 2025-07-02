import requests
import json

# API 기본 정보
BASE_URL = "http://localhost:8006"
COMPANY = "네이버"
YEAR = "2025"
REPORT_CODE = "11013"

def test_flexible_kpi():
    """유연한 KPI API 테스트"""
    print("🧪 [유연한 KPI API 테스트]")
    print("=" * 50)
    
    url = f"{BASE_URL}/flexible-kpi/{COMPANY}"
    params = {"bsns_year": YEAR, "reprt_code": REPORT_CODE}
    
    try:
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ [성공] 기업: {data['company_name']}")
            print(f"📊 [데이터 품질] {data['data_quality_score']}")
            print(f"🎯 [성공률] {data['calculation_summary']['success_rate']}")
            print(f"📈 [계산된 KPI] {data['total_kpi_count']}개")
            
            # 카테고리별 결과
            for category, kpis in data['categories'].items():
                if kpis:
                    print(f"\n📁 [{category}] {len(kpis)}개")
                    for kpi_name, kpi_data in kpis.items():
                        print(f"  • {kpi_name}: {kpi_data['value']} {kpi_data['unit']} ({kpi_data['calculation_method']})")
            
        else:
            print(f"❌ [실패] Status: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ [오류] {e}")

def test_comparison():
    """기존 vs 유연한 방법 비교"""
    print("\n🔄 [방법 비교 테스트]")
    print("=" * 50)
    
    url = f"{BASE_URL}/kpi-comparison/{COMPANY}"
    params = {"bsns_year": YEAR, "reprt_code": REPORT_CODE}
    
    try:
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            legacy = data['comparison']['legacy_method']
            flexible = data['comparison']['flexible_method']
            
            print(f"🏢 기업: {data['company_name']}")
            print(f"📊 기존 방법: {legacy['total_kpis']}개 KPI")
            print(f"🆕 유연한 방법: {flexible['total_kpis']}개 KPI (성공률: {flexible['success_rate']})")
            print(f"📈 데이터 품질: {flexible['data_quality']}")
            
        else:
            print(f"❌ [실패] Status: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ [오류] {e}")

def test_account_coverage():
    """계정 커버리지 분석"""
    print("\n🔍 [계정 커버리지 분석]")
    print("=" * 50)
    
    url = f"{BASE_URL}/account-coverage/{COMPANY}"
    params = {"bsns_year": YEAR, "reprt_code": REPORT_CODE}
    
    try:
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            
            print(f"📊 전체 표준 계정: {data['total_standard_accounts']}개")
            print(f"✅ 사용 가능한 계정: {data['available_accounts']['count']}개")
            print(f"❌ 누락된 계정: {data['missing_accounts']['count']}개")
            print(f"📈 커버리지: {data['coverage_rate']}")
            
            print(f"\n✅ 사용 가능한 계정:")
            for account in data['available_accounts']['list']:
                print(f"  • {account}")
            
            print(f"\n❌ 누락된 계정:")
            for account in data['missing_accounts']['list']:
                print(f"  • {account}")
            
        else:
            print(f"❌ [실패] Status: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ [오류] {e}")

if __name__ == "__main__":
    test_flexible_kpi()
    test_comparison()
    test_account_coverage() 