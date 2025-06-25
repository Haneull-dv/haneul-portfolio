"""
Disclosure 서비스 설정
"""

# OpenDART API 설정
DART_API_KEY = "7c0bec1f1e1b81e5c11ed943e2be640cc0867823"
DART_BASE_URL = "https://opendart.fss.or.kr/api"

# 조회 설정
DEFAULT_DAYS_BACK = 7  # 기본 조회 기간 (일)
DEFAULT_PAGE_SIZE = 100  # 페이지당 항목 수

# API 요청 설정
REQUEST_TIMEOUT = 10  # 초
MAX_CONCURRENT_REQUESTS = 5  # 최대 동시 요청 수 