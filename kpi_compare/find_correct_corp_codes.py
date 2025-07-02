import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

DART_API_KEY = os.getenv("DART_API_KEY")
DART_API_URL = "https://opendart.fss.or.kr/api"

# 테스트할 기업들
TEST_COMPANIES = [
    "카카오",
    "크래프톤", 
    "엔씨소프트",
    "넷마블",
    "펄어비스",
    "카카오게임즈",
    "넥슨게임즈",
    "위메이드",
    "네오위즈",
    "NHN",
    "시프트업"
]

def find_corp_code(company_name):
    """기업명으로 정확한 기업코드 찾기"""
    print(f"\n🔍 [기업검색] '{company_name}' 검색 중...")
    
    # 기업개황 검색 API 사용
    params = {
        "crtfc_key": DART_API_KEY,
        "corp_name": company_name
    }
    
    try:
        response = requests.get(f"{DART_API_URL}/corpCode.xml", params=params, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ [검색성공] {company_name}")
            
            # XML 파싱해서 기업코드 추출
            content = response.text
            
            # 간단한 XML 파싱
            if f"<corp_name>{company_name}</corp_name>" in content:
                start = content.find(f"<corp_name>{company_name}</corp_name>")
                if start != -1:
                    # corp_code 찾기 (corp_name 앞에 있음)
                    before_corp_name = content[:start]
                    corp_code_start = before_corp_name.rfind("<corp_code>") + len("<corp_code>")
                    corp_code_end = before_corp_name.rfind("</corp_code>")
                    
                    if corp_code_start > len("<corp_code>") - 1 and corp_code_end > corp_code_start:
                        corp_code = before_corp_name[corp_code_start:corp_code_end]
                        print(f"📋 [기업코드] {company_name} → {corp_code}")
                        return corp_code
            
            print(f"⚠️ [코드찾기실패] {company_name} - XML에서 코드 추출 실패")
            return None
            
        else:
            print(f"❌ [API실패] {company_name} - Status: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ [오류] {company_name} - {e}")
        return None

def test_corp_code(corp_code, company_name):
    """기업코드로 재무데이터 조회 테스트"""
    params = {
        "crtfc_key": DART_API_KEY,
        "corp_code": corp_code,
        "bsns_year": "2024",
        "reprt_code": "11011",  # 사업보고서
        "fs_div": "CFS"
    }
    
    try:
        response = requests.get(f"{DART_API_URL}/fnlttSinglAcntAll.json", params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "000":
                account_count = len(data.get("list", []))
                print(f"✅ [테스트성공] {company_name}({corp_code}) - {account_count}개 계정")
                return True
            else:
                print(f"⚠️ [데이터없음] {company_name}({corp_code}) - {data.get('message')}")
                return False
        else:
            print(f"❌ [테스트실패] {company_name}({corp_code}) - Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ [테스트오류] {company_name}({corp_code}) - {e}")
        return False

def download_corpcode_xml():
    """전체 기업코드 XML 다운로드"""
    print("📥 [XML다운로드] 전체 기업코드 XML 다운로드 중...")
    
    params = {"crtfc_key": DART_API_KEY}
    
    try:
        response = requests.get(f"{DART_API_URL}/corpCode.xml", params=params, timeout=30)
        
        if response.status_code == 200:
            # XML 파일 저장
            with open("corpcode.xml", "w", encoding="utf-8") as f:
                f.write(response.text)
            print("✅ [다운로드완료] corpcode.xml 저장")
            return True
        else:
            print(f"❌ [다운로드실패] Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ [다운로드오류] {e}")
        return False

def search_in_xml(company_name):
    """XML 파일에서 기업 검색"""
    try:
        with open("corpcode.xml", "r", encoding="utf-8") as f:
            content = f.read()
        
        # 기업명 검색
        if company_name in content:
            print(f"🔍 [XML검색] '{company_name}' 발견")
            
            # 여러 결과가 있을 수 있으므로 모든 매칭 찾기
            results = []
            start_pos = 0
            
            while True:
                pos = content.find(f"<corp_name>{company_name}", start_pos)
                if pos == -1:
                    break
                
                # 해당 기업의 corp_code 찾기
                record_start = content.rfind("<list>", 0, pos)
                record_end = content.find("</list>", pos)
                
                if record_start != -1 and record_end != -1:
                    record = content[record_start:record_end]
                    
                    # corp_code 추출
                    code_start = record.find("<corp_code>") + len("<corp_code>")
                    code_end = record.find("</corp_code>")
                    
                    if code_start > len("<corp_code>") - 1 and code_end > code_start:
                        corp_code = record[code_start:code_end]
                        
                        # corp_name 추출 (확인용)
                        name_start = record.find("<corp_name>") + len("<corp_name>")
                        name_end = record.find("</corp_name>")
                        corp_name = record[name_start:name_end]
                        
                        results.append({"corp_code": corp_code, "corp_name": corp_name})
                
                start_pos = pos + 1
            
            return results
        else:
            print(f"❌ [XML검색실패] '{company_name}' 없음")
            return []
            
    except Exception as e:
        print(f"❌ [XML읽기오류] {e}")
        return []

def main():
    print("🚀 [DART 기업코드 검색기] 시작")
    print("=" * 60)
    
    if not DART_API_KEY:
        print("❌ DART_API_KEY가 설정되지 않았습니다.")
        return
    
    # 1. 전체 기업코드 XML 다운로드
    if not download_corpcode_xml():
        print("❌ XML 다운로드 실패로 종료")
        return
    
    results = []
    
    # 2. 각 기업별로 검색
    for company in TEST_COMPANIES:
        print(f"\n{'='*20} {company} {'='*20}")
        
        # XML에서 검색
        xml_results = search_in_xml(company)
        
        if xml_results:
            for result in xml_results:
                corp_code = result["corp_code"]
                corp_name = result["corp_name"]
                
                print(f"📋 [발견] {corp_name} → {corp_code}")
                
                # 재무데이터 조회 테스트
                if test_corp_code(corp_code, corp_name):
                    results.append({
                        "corp_name": corp_name,
                        "corp_code": corp_code,
                        "status": "✅ 정상"
                    })
                else:
                    results.append({
                        "corp_name": corp_name,
                        "corp_code": corp_code,
                        "status": "⚠️ 데이터없음"
                    })
        else:
            results.append({
                "corp_name": company,
                "corp_code": "미발견",
                "status": "❌ 검색실패"
            })
    
    # 3. 결과 출력
    print(f"\n{'='*60}")
    print("📊 [최종 결과]")
    print("=" * 60)
    
    for result in results:
        print(f"{result['corp_name']:15} | {result['corp_code']:10} | {result['status']}")
    
    # 4. Python 코드 생성
    print(f"\n📝 [업데이트된 companies.py 코드]")
    print("=" * 60)
    
    print("SUPPORTED_COMPANIES = [")
    print("    {'corp_name': '네이버', 'corp_code': '00126380'},  # 확인됨")
    
    for result in results:
        if result['corp_code'] != "미발견" and "정상" in result['status']:
            print(f"    {{'corp_name': '{result['corp_name']}', 'corp_code': '{result['corp_code']}'}},")
    
    print("]")

if __name__ == "__main__":
    main() 