from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 공통 DB 모듈 import
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

# 라우터 import
from app.api.disclosure_router import router as disclosure_router

app = FastAPI(title="Game Company Disclosure Service")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(disclosure_router, prefix="/disclosures", tags=["게임기업 공시"])

print(f"🤍0 메인 진입 - 게임기업 공시 서비스 시작 (DI 기반)")