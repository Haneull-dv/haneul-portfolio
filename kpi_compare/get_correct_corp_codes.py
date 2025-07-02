import os
import requests
import zipfile
import io
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()

DART_API_KEY = os.getenv("DART_API_KEY")

def download_and_extract_corpcode():
    """DART API에서 기업코드 XML을 다운로드하고 압축 해제"""
    print("📥 [DART API] 기업코드 XML 다운로드 중...")
    
    params = {"crtfc_key": DART_API_KEY}
    
    try:
        response = requests.get("https://opendart.fss.or.kr/api/corpCode.xml", 
                              params=params, timeout=30)
        
        if response.status_code == 200:
            print("✅ [다운로드 성공]")
            
            # ZIP 파일로 압축되어 있음
            with zipfile.ZipFile(io.BytesIO(response.content)) as zip_file:
                # ZIP 내부 파일명 확인
                file_names = zip_file.namelist()
                print(f"📋 [ZIP 내용] {file_names}")
                
                if file_names:
                    # 첫 번째 파일 (보통 CORPCODE.xml) 읽기
                    xml_content = zip_file.read(file_names[0]).decode('utf-8')
                    
                    # XML 파일로 저장
                    with open("CORPCODE.xml", "w", encoding="utf-8") as f:
                        f.write(xml_content)
                    
                    print("✅ [압축해제 완료] CORPCODE.xml 저장")
                    return True
                else:
                    print("❌ [압축해제 실패] ZIP 파일이 비어있음")
                    return False
        else:
            print(f"❌ [다운로드 실패] Status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ [오류] {e}")
        return False

def search_game_companies():
    """XML에서 게임 관련 기업들 검색"""
    
    try:
        # XML 파싱
        tree = ET.parse("CORPCODE.xml")
        root = tree.getroot()
        
        print("🎮 [게임 관련 기업 검색]")
        print("=" * 60)
        
        # 검색할 키워드들 (정식 기업명 포함)
        game_keywords = [
            "카카오", "주식회사카카오", "KAKAO", 
            "크래프톤", "KRAFTON",
            "엔씨소프트", "NCSOFT",
            "넷마블", "NETMARBLE", 
            "펄어비스", "PEARL ABYSS",
            "위메이드", "WEMADE",
            "네오위즈", "NEOWIZ",
            "NHN", "엔에이치엔",
            "넥슨", "NEXON",
            "시프트업", "SHIFTUP", "SHIFT UP",
            "게임", "GAME", "GAMES",
            "엔터테인먼트", "ENTERTAINMENT"
        ]
        
        found_companies = []
        
        # 모든 기업 정보 순회
        for company in root.findall('.//list'):
            corp_code = company.find('corp_code')
            corp_name = company.find('corp_name')
            
            if corp_code is not None and corp_name is not None:
                corp_code_text = corp_code.text
                corp_name_text = corp_name.text
                
                # 키워드 매칭 확인
                for keyword in game_keywords:
                    if keyword.upper() in corp_name_text.upper():
                        found_companies.append({
                            "corp_name": corp_name_text,
                            "corp_code": corp_code_text
                        })
                        print(f"✅ [발견] {corp_name_text} → {corp_code_text}")
                        break
        
        print(f"\n🎯 [게임 관련 기업 총 {len(found_companies)}개 발견]")
        return found_companies
        
    except Exception as e:
        print(f"❌ [XML 파싱 오류] {e}")
        return []

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
        response = requests.get("https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json", 
                              params=params, timeout=10)
        
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

def main():
    print("🚀 [DART 기업코드 검색기 v2] 시작")
    print("=" * 60)
    
    if not DART_API_KEY:
        print("❌ DART_API_KEY가 설정되지 않았습니다.")
        return
    
    # 1. 기업코드 XML 다운로드 및 압축 해제
    if not download_and_extract_corpcode():
        print("❌ XML 다운로드 실패로 종료")
        return
    
    # 2. 게임 관련 기업들 검색
    game_companies = search_game_companies()
    
    if not game_companies:
        print("❌ 게임 관련 기업을 찾을 수 없습니다.")
        return
    
    # 3. 재무데이터 조회 테스트
    print(f"\n📊 [재무데이터 테스트]")
    print("=" * 60)
    
    valid_companies = []
    
    for company in game_companies:
        corp_code = company["corp_code"]
        corp_name = company["corp_name"]
        
        if test_corp_code(corp_code, corp_name):
            valid_companies.append(company)
    
    # 4. 결과 출력
    print(f"\n📝 [업데이트된 companies.py 코드]")
    print("=" * 60)
    print('"""')
    print("KPI 비교 서비스에서 지원하는 기업 목록 (DART API에서 직접 검색)")
    print('"""')
    print("SUPPORTED_COMPANIES = [")
    print("    {'corp_name': '네이버', 'corp_code': '00126380'},  # 확인됨")
    
    for company in valid_companies:
        print(f"    {{'corp_name': '{company['corp_name']}', 'corp_code': '{company['corp_code']}'}},")
    
    print("]")
    
    print(f"\n✅ [완료] 총 {len(valid_companies)}개 게임기업 발견 및 검증 완료")

if __name__ == "__main__":
    main() 