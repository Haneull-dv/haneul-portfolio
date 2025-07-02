import re

def search_game_companies():
    """XML에서 게임 관련 기업들 검색"""
    
    try:
        with open("corpcode.xml", "r", encoding="utf-8") as f:
            content = f.read()
        
        print("🎮 [게임 관련 기업 검색]")
        print("=" * 60)
        
        # 검색할 키워드들
        game_keywords = [
            "카카오", "크래프톤", "엔씨", "넷마블", "펄어비스", 
            "위메이드", "네오위즈", "NHN", "넥슨", "시프트업",
            "게임", "소프트", "엔터테인먼트", "NCSOFT", "Krafton",
            "KAKAO", "Netmarble", "Wemade", "Neowiz", "NEXON",
            "PearlAbyss", "ShiftUp"
        ]
        
        found_companies = set()
        
        # 각 키워드로 검색
        for keyword in game_keywords:
            print(f"\n🔍 [검색] '{keyword}' 포함 기업...")
            
            # 대소문자 구분 없이 검색
            pattern = re.compile(f".*{keyword}.*", re.IGNORECASE)
            
            # XML에서 모든 corp_name 태그 찾기
            corp_names = re.findall(r"<corp_name>(.*?)</corp_name>", content)
            
            matches = []
            for corp_name in corp_names:
                if pattern.match(corp_name):
                    matches.append(corp_name)
            
            # 중복 제거
            unique_matches = list(set(matches))
            
            if unique_matches:
                print(f"📋 [발견] {len(unique_matches)}개 기업:")
                for match in sorted(unique_matches):
                    print(f"  • {match}")
                    found_companies.add(match)
            else:
                print(f"❌ [없음] '{keyword}' 포함 기업 없음")
        
        # 최종 결과
        print(f"\n🎯 [게임 관련 기업 총 {len(found_companies)}개 발견]")
        print("=" * 60)
        
        game_companies = sorted(list(found_companies))
        
        for i, company in enumerate(game_companies, 1):
            print(f"{i:2d}. {company}")
        
        return game_companies
        
    except Exception as e:
        print(f"❌ [오류] {e}")
        return []

def get_corp_codes(company_names):
    """기업명 리스트로 기업코드들 가져오기"""
    
    try:
        with open("corpcode.xml", "r", encoding="utf-8") as f:
            content = f.read()
        
        results = []
        
        for company_name in company_names:
            # 정확한 기업명으로 검색
            pattern = f"<corp_name>{company_name}</corp_name>"
            
            if pattern in content:
                # 해당 기업의 기록 찾기
                start = content.find(pattern)
                record_start = content.rfind("<list>", 0, start)
                record_end = content.find("</list>", start)
                
                if record_start != -1 and record_end != -1:
                    record = content[record_start:record_end]
                    
                    # corp_code 추출
                    code_match = re.search(r"<corp_code>(.*?)</corp_code>", record)
                    
                    if code_match:
                        corp_code = code_match.group(1)
                        results.append({
                            "corp_name": company_name,
                            "corp_code": corp_code
                        })
                        print(f"✅ {company_name:30} → {corp_code}")
                    else:
                        print(f"❌ {company_name:30} → 코드 없음")
                else:
                    print(f"❌ {company_name:30} → 기록 없음")
            else:
                print(f"❌ {company_name:30} → 이름 없음")
        
        return results
        
    except Exception as e:
        print(f"❌ [오류] {e}")
        return []

def main():
    print("🚀 [DART XML 게임기업 검색기] 시작")
    print("=" * 60)
    
    # 1. 게임 관련 기업들 검색
    game_companies = search_game_companies()
    
    if not game_companies:
        print("❌ 게임 관련 기업을 찾을 수 없습니다.")
        return
    
    print(f"\n📋 [기업코드 추출]")
    print("=" * 60)
    
    # 2. 기업코드들 가져오기
    results = get_corp_codes(game_companies)
    
    # 3. companies.py 형태로 출력
    print(f"\n📝 [companies.py 업데이트 코드]")
    print("=" * 60)
    print('"""')
    print("KPI 비교 서비스에서 지원하는 기업 목록")
    print('"""')
    print("SUPPORTED_COMPANIES = [")
    print("    {'corp_name': '네이버', 'corp_code': '00126380'},  # 확인됨")
    
    for result in results:
        print(f"    {{'corp_name': '{result['corp_name']}', 'corp_code': '{result['corp_code']}'}},")
    
    print("]")

if __name__ == "__main__":
    main() 