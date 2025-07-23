import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.dsdfooting_router import router as dsdfooting_router
from .api.dsdcheck_router import router as dsdcheck_router

#하늘이 대박바보
# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="재무제표 검증 서비스",
    version="1.0.0",
    description="DSD 공시용 재무데이터 검증 서비스"
)

# --- CORS 설정 (환경에 따라 분기) ---
ENV = os.getenv("ENV", "development")  # .env 파일에 ENV 변수가 없으면 'development'로 간주

if ENV == "production":
    allow_origins = [
        "https://www.haneull.com",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://portfolio-v0-02-2gdu3pezg-haneull-dvs-projects.vercel.app",
        "https://dsdgen.haneull.com",
        "https://conan.ai.kr"
    ]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",  # vercel 미리보기
        "https://portfolio-v0-02-1hkt...g4n-haneull-dvs-projects.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- CORS 설정 끝 ---

# 라우터 등록
app.include_router(dsdfooting_router)
app.include_router(dsdcheck_router)

@app.get("/")
async def root():
    return {"message": "재무제표 검증 서비스 API"} 