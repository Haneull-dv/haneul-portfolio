#!/usr/bin/env python3
"""
News Classifier Training Microservice
MSA 구조에서 모델 학습을 담당하는 FastAPI 서버
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# API 라우터 import
from app.api.training_router import router as training_router

# FastAPI 앱 설정
app = FastAPI(
    title="News Classifier Training API",
    description="뉴스 텍스트 분류 모델 학습을 위한 마이크로서비스",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 운영환경에서는 구체적인 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(training_router)

@app.get("/")
async def root():
    return {
        "service": "news-classifier-training",
        "status": "running",
        "version": "1.0.0",
        "endpoint": "/api/v1/train"
    }

if __name__ == "__main__":
    print("=== News Classifier Training Service ===")
    print("🚀 Starting FastAPI server...")
    print("📖 API Documentation: http://localhost:8001/docs")
    print("=" * 40)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
