"""
Issue 서비스 설정
"""

# 뉴스 수집 설정
DEFAULT_NEWS_COUNT = 100  # 기업당 수집할 뉴스 개수
NEWS_SEARCH_DAYS = 7  # 뉴스 검색 기간 (일)

# AI 분석 설정
CONFIDENCE_THRESHOLD = 0.7  # AI 분류 신뢰도 임계값
MIN_SUMMARY_LENGTH = 50  # 최소 요약 길이

# API 연동 설정
CLASSIFIER_URL = "http://classifier:8087/classify"
SUMMARIZER_URL = "http://summarizer:8088/summarize"

# 요청 설정
REQUEST_TIMEOUT = 15  # 초
MAX_RETRY_COUNT = 3  # 최대 재시도 횟수 