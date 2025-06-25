from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# 공통 DB 모듈 import
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# 라우터 import
from app.api.issue_router import router as issue_router
from app.api.n8n_issue_router import router as n8n_issue_router

app = FastAPI(title="Weekly Issue Analysis Service")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(issue_router)
app.include_router(n8n_issue_router, tags=["n8n 자동화"])

print(f"🤍0 메인 진입 - 이슈 분석 서비스 시작 (DI 기반)")