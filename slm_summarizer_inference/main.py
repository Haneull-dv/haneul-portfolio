#!/usr/bin/env python3
"""
News Summarizer Inference Microservice
MSA 구조에서 모델 추론을 담당하는 FastAPI 서버
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os
from app.api.summarize_router import router as summarize_router

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# FastAPI 앱 설정
app = FastAPI(
    title="News Summarizer Inference API",
    description="뉴스 요약 모델 추론을 위한 마이크로서비스",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정 (n8n HTTP request 연동을 위함)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 운영환경에서는 구체적인 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(summarize_router)

@app.get("/")
async def root():
    return {
        "service": "news-summarizer-inference",
        "status": "running",
        "version": "1.0.0",
        "endpoint": "/summarize"
    }

if __name__ == "__main__":
    print("=== News Summarizer Inference Service ===")
    print("🚀 Starting FastAPI server...")
    print("📖 API Documentation: http://localhost:8088/docs")
    print("=" * 40)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8088,
        reload=True,
        log_level="info"
    ) 