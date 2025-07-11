"""
게임 기업 정보 설정
"""
from typing import Dict

# 🎮 게임기업 종목코드 및 회사명 매핑
# 주가 서비스와 동일한 목록 사용
GAME_COMPANIES: Dict[str, str] = {
    # 🇰🇷 한국
    "035420": "네이버",
    "035720": "카카오",
    "259960": "크래프톤",
    "036570": "엔씨소프트",
    "251270": "넷마블",
    "263750": "펄어비스",
    "293490": "카카오게임즈",
    "225570": "넥슨게임즈",
    "112040": "위메이드",
    "095660": "네오위즈",
    "181710": "NHN",
    "078340": "컴투스",
    "192080": "더블유게임즈",
    "145720": "더블다운인터액티브",
    "089500": "그라비티",
    "194480": "데브시스터즈",
    "069080": "웹젠",
    "067000": "조이시티",
    "950190": "미투젠",
    "123420": "위메이드플레이",
    "201490": "미투온",
    "348030": "모비릭스",
    "052790": "액토즈소프트",
    "331520": "밸로프",
    "205500": "넥써쓰",
    "462870": "시프트업",
    "060240": "네오위즈",
    "299910": "넷마블",
    "063080": "컴투스홀딩스",
}

# 기업 개수
TOTAL_COMPANIES = len(GAME_COMPANIES)

# 기업명 리스트 (검색용)
COMPANY_NAMES = list(GAME_COMPANIES.values())

# 종목코드 리스트 (API 호출용)
STOCK_CODES = list(GAME_COMPANIES.keys()) 


