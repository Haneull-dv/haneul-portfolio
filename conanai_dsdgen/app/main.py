from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .api.xsldsd_router import router as xsldsd_router

load_dotenv()
app = FastAPI(title="DSDGen Service")

# 환경에 따라 origins 다르게 관리
ENV = os.getenv("ENV", "development")  # 기본값 development

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

app.include_router(xsldsd_router, prefix="/dsdgen")

