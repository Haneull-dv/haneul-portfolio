from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
from pathlib import Path

# 프로젝트 루트 경로 설정
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# 라우터 import
from weekly_db.api.weekly_api import router as weekly_router
from weekly_db.api.weekly_cqrs_api import router as weekly_cqrs_router
from weekly_db.api.n8n_cqrs_orchestrator import router as n8n_cqrs_router

app = FastAPI(
    title="Weekly Data Service",
    description="주차별 통합 데이터 조회 서비스 (프론트엔드용)",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(weekly_router)  # 기존 API (하위 호환성)
app.include_router(weekly_cqrs_router)  # CQRS 패턴 API
app.include_router(n8n_cqrs_router)  # n8n 오케스트레이터 API

@app.get("/")
async def root():
    """📋 Weekly Data Service 정보"""
    return {
        "service": "Weekly Data Service",
        "version": "1.0.0",
        "description": "주차별 통합 데이터 조회 서비스",
        "purpose": "n8n으로 수집된 데이터를 프론트엔드에서 조회",
        "endpoints": {
            "table_data": "/weekly/table-data?week=YYYY-MM-DD",
            "available_weeks": "/weekly/available-weeks",
            "week_summary": "/weekly/summary/{week}",
            "batch_jobs": "/weekly/batch-jobs",
            "current_week": "/weekly/current-week"
        },
        "data_categories": ["disclosure", "issue", "stockprice"],
        "collection_method": "n8n automation (Mon 7AM)"
    }

@app.get("/health")
async def health_check():
    """💚 헬스체크"""
    return {"status": "healthy", "service": "weekly_data"}

print("🗄️📊 Weekly Data Service 시작 - 통합 데이터 조회 서비스") 