from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .api.xsldsd_router import router as xsldsd_router

load_dotenv()
app = FastAPI()

# 환경에 따라 origins 다르게 관리
ENV = os.getenv("ENV", "development")  # 기본값 development

if ENV == "production":
    allow_origins = [
        "https://haneull.com",  # 커스텀 도메인
        "https://conan.ai.kr",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",  # vercel 공식 도메인(운영/테스트용)
        # 필요하다면 다른 공식 도메인 추가
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

app.include_router(xsldsd_router, prefix="/dsdgen")

