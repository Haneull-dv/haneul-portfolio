#!/usr/bin/env python3
"""
News Classifier Inference Microservice
MSA 구조에서 모델 추론을 담당하는 FastAPI 서버
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# API 라우터 import
from app.api.classifier_router import router as classifier_router

# FastAPI 앱 설정
app = FastAPI(
    title="News Classifier Inference API",
    description="뉴스 텍스트 중요도 분류를 위한 추론 마이크로서비스",
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
app.include_router(classifier_router)

@app.get("/")
async def root():
    return {
        "service": "news-classifier-inference",
        "status": "running",
        "version": "1.0.0",
        "endpoint": "/predict"
    }

if __name__ == "__main__":
    print("=== News Classifier Inference Service ===")
    print("🚀 Starting FastAPI server...")
    print("📖 API Documentation: http://localhost:8087/docs")
    print("=" * 40)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8087,
        reload=True,
        log_level="info"
    )
