"""
게임 기업 정보 설정
"""
from typing import Dict

# 주요 게임기업 정보 (종목코드: 기업명)
GAME_COMPANIES: Dict[str, str] = {
    "036570": "엔씨소프트",
    "251270": "넷마블", 
    "259960": "크래프톤",
    "263750": "펄어비스",
    "078340": "컴투스",
    "112040": "위메이드",
    "293490": "카카오게임즈",
    "095660": "네오위즈",
    "181710": "NHN",
    "069080": "웹젠",
    "225570": "넥슨게임즈"
}

# 기업 개수
TOTAL_COMPANIES = len(GAME_COMPANIES)

# 기업명 리스트 (검색용)
COMPANY_NAMES = list(GAME_COMPANIES.values())

# 종목코드 리스트 (API 호출용)
STOCK_CODES = list(GAME_COMPANIES.keys()) 