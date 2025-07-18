from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import os
import sys
import uvicorn

# 경로 설정
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

# DB 관련 import
from app.config.db.base import Base
from app.config.db.db_singleton import db_singleton
from app.domain.model.weekly_model import WeeklyDataModel, WeeklyBatchJobModel
from app.domain.model.disclosure_model import DisclosureModel

# 라우터 import
from app.api.disclosure_router import router as disclosure_router
from app.api.n8n_disclosure_router import router as n8n_disclosure_router
from app.api.cqrs_disclosure_router import router as cqrs_disclosure_router

load_dotenv()
ENV = os.getenv("ENV", "development")

print("🚨 ENV =", os.getenv("ENV"))
print("🚨 DATABASE_URL =", os.getenv("DATABASE_URL"))

# ✅ lifespan 기반 비동기 DB 테이블 생성
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("📌 DB 테이블 생성 중...")
    async with db_singleton.engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ DB 테이블 생성 완료")
    yield

# FastAPI 앱 정의
app = FastAPI(title="Game Company Disclosure Service", lifespan=lifespan)

@app.get("/debug/config")
def debug_config():
    """🔧 설정 디버깅용"""
    from app.config import settings
    return {
        "env": ENV,
        "database_url": settings.DATABASE_URL,
        "dart_api_key": settings.DART_API_KEY,
        "dart_api_key_length": len(settings.DART_API_KEY) if settings.DART_API_KEY else 0,
        "dart_base_url": settings.DART_BASE_URL,
        "hardcoded": False,
        "message": "Configs loaded from environment variables"
    }

# CORS 설정
if ENV == "production":
    allow_origins = [
        "https://www.haneull.com",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://portfolio-v0-02-2gdu3pezg-haneull-dvs-projects.vercel.app",
        "https://disclosure.haneull.com",
        "https://conan.ai.kr"
    ]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://portfolio-v0-02-1hkt...g4n-haneull-dvs-projects.vercel.app",
        "https://haneull.com",
        "https://conan.ai.kr"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(disclosure_router, prefix="/disclosures", tags=["게임기업 공시"])
app.include_router(n8n_disclosure_router, tags=["n8n 자동화"])
app.include_router(cqrs_disclosure_router, tags=["CQRS 패턴"])

print(f"🤍0 메인 진입 - 게임기업 공시 서비스 시작 (lifespan 기반)")

# 로컬 실행
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8090))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
