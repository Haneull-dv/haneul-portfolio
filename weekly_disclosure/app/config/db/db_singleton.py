from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

# ENV 환경변수 확인
ENV = os.getenv("ENV", "development")

# 개발 환경에서만 .env 로드
if ENV == "development":
    dotenv_path = Path(__file__).resolve().parent.parent.parent / "postgres/.env"
    if dotenv_path.exists():
        load_dotenv(dotenv_path=dotenv_path)
        print(f"😍[DB] .env 파일 로드됨: {dotenv_path}")
    else:
        print(f"😍[DB] .env 파일 없음: {dotenv_path}")
else:
    print("😍[DB] 운영/배포 환경: .env 파일 로드하지 않음")

print(f"😍[DB] ENV={ENV}")
print(f"😍[DB] DATABASE_URL={os.getenv('DATABASE_URL')}")

# Base 클래스 생성
Base = declarative_base()

class DatabaseSingleton:
    """Weekly 서비스들을 위한 공통 DB 싱글톤 클래스"""
    
    _instance: Optional['DatabaseSingleton'] = None
    _engine = None
    _session_factory = None
    
    def __new__(cls) -> 'DatabaseSingleton':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """DB 엔진 및 세션 팩토리 초기화"""
        # 환경변수에서 DB URL 가져오기 (기본값 제공)
        database_url = os.getenv("DATABASE_URL")
        
        print(f"🗄️ DB 초기화 - URL: {database_url}")
        
        # 비동기 엔진 생성
        self._engine = create_async_engine(
            database_url,
            echo=False,  # SQL 로깅 (개발시에는 True)
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={
            "server_settings": {
                "application_name": "weekly_services",
            }
        }
        )
        
        # 세션 팩토리 생성
        self._session_factory = async_sessionmaker(
            bind=self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )
        
        print("🗄️ DB 싱글톤 초기화 완료")
    
    @property
    def engine(self):
        """비동기 DB 엔진 반환"""
        return self._engine
    
    @property
    def session_factory(self):
        """비동기 세션 팩토리 반환"""
        return self._session_factory
    
    async def get_session(self) -> AsyncSession:
        """새로운 비동기 세션 생성"""
        if not self._session_factory:
            raise RuntimeError("DB가 초기화되지 않았습니다")
        
        return self._session_factory()
    
    async def close(self):
        """DB 연결 종료"""
        if self._engine:
            await self._engine.dispose()
            print("🗄️ DB 연결 종료 완료")

# 글로벌 싱글톤 인스턴스
db_singleton = DatabaseSingleton()

# FastAPI 의존성 주입용 함수
async def get_weekly_session():
    """FastAPI 의존성 주입을 위한 세션 생성 함수"""
    session = await db_singleton.get_session()
    try:
        yield session
    finally:
        await session.close()
