"""
Disclosure 서비스 설정
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# BASE 경로 설정 (repo 루트 기준)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# 환경 분기
ENV = os.getenv("ENV", "development")

# 환경파일 로드
env_path = BASE_DIR / "weekly_disclosure" / f".env.{ENV}"
load_dotenv(dotenv_path=env_path)

# 데이터베이스 설정
DATABASE_URL = os.getenv("DATABASE_URL")

# 공시 조회 기본 설정
DEFAULT_DAYS_BACK = int(os.getenv("DEFAULT_DAYS_BACK", 7))
DEFAULT_PAGE_SIZE = int(os.getenv("DEFAULT_PAGE_SIZE", 100))

# DART API 설정
DART_API_KEY = os.getenv("DART_API_KEY")
DART_BASE_URL = os.getenv("DART_BASE_URL", "https://opendart.fss.or.kr/api")

# 기타 설정
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", 10))
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", 5))
