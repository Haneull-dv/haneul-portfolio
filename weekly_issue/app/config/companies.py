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

# 기업명 리스트 (뉴스 검색용)
COMPANY_NAMES: List[str] = list(GAME_COMPANIES.values())

# 종목코드 리스트
STOCK_CODES: List[str] = list(GAME_COMPANIES.keys())

# 기본 분석 대상 기업 (테스트/데모용)
DEFAULT_COMPANIES: List[str] = ["크래프톤", "넷마블", "엔씨소프트"]

# 기업별 키워드 매핑 (뉴스 필터링 정확도 향상용)
COMPANY_KEYWORDS = {
    "크래프톤": ["KRAFTON", "배틀그라운드", "PUBG", "배그"],
    "넷마블": ["Netmarble", "리니지2M", "세븐나이츠"],
    "엔씨소프트": ["NCsoft", "리니지", "블레이드앤소울", "길드워즈"],
    "펄어비스": ["Pearl Abyss", "검은사막", "검은사막모바일"],
    "컴투스": ["Com2uS", "서머너즈워", "골프스타"],
    "위메이드": ["Wemade", "미르4", "위믹스"],
    "카카오게임즈": ["Kakao Games", "오딘", "아키에이지"],
    "네오위즈": ["Neowiz", "피파온라인4", "P의거짓"],
    "NHN": ["한게임", "페이코"],
    "웹젠": ["Webzen", "뮤온라인", "R2온라인"],
    "넥슨게임즈": ["Nexon Games", "메이플스토리", "카트라이더", "던전앤파이터"]
} 