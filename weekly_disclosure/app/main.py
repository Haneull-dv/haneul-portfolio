from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from app.api.disclosure_router import router as disclosure_router
from app.api.n8n_disclosure_router import router as n8n_disclosure_router
from app.api.cqrs_disclosure_router import router as cqrs_disclosure_router

load_dotenv()
app = FastAPI(title="Game Company Disclosure Service")

ENV = os.getenv("ENV", "development")

if ENV == "production":
    allow_origins = [
        "https://haneull.com",
        "https://conan.ai.kr",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
    ]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://portfolio-v0-02-1hkt...g4n-haneull-dvs-projects.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(disclosure_router, prefix="/disclosures", tags=["게임기업 공시"])
app.include_router(n8n_disclosure_router, tags=["n8n 자동화"])
app.include_router(cqrs_disclosure_router, tags=["CQRS 패턴"])

print(f"🤍0 메인 진입 - 게임기업 공시 서비스 시작 (DI 기반)")
