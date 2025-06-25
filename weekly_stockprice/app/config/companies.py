"""
게임 기업 정보 설정
"""
from typing import Dict, List

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

# 기업명 리스트
COMPANY_NAMES: List[str] = list(GAME_COMPANIES.values())

# 종목코드 리스트
STOCK_CODES: List[str] = list(GAME_COMPANIES.keys())

# 기업별 상세 정보 (확장 가능)
COMPANY_INFO = {
    "036570": {"name": "엔씨소프트", "market": "KOSPI", "sector": "게임"},
    "251270": {"name": "넷마블", "market": "KOSPI", "sector": "게임"},
    "259960": {"name": "크래프톤", "market": "KOSPI", "sector": "게임"},
    "263750": {"name": "펄어비스", "market": "KOSDAQ", "sector": "게임"},
    "078340": {"name": "컴투스", "market": "KOSDAQ", "sector": "게임"},
    "112040": {"name": "위메이드", "market": "KOSDAQ", "sector": "게임"},
    "293490": {"name": "카카오게임즈", "market": "KOSPI", "sector": "게임"},
    "095660": {"name": "네오위즈", "market": "KOSDAQ", "sector": "게임"},
    "181710": {"name": "NHN", "market": "KOSPI", "sector": "게임/IT"},
    "069080": {"name": "웹젠", "market": "KOSDAQ", "sector": "게임"},
    "225570": {"name": "넥슨게임즈", "market": "KOSPI", "sector": "게임"}
} 