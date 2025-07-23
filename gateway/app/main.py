from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys
import os
from dotenv import load_dotenv

# API Router imports
from app.api.proxy_router import router as proxy_router
from app.api.auth_router import router as auth_router

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("gateway-api")

# 환경변수 로드
load_dotenv()

# 애플리케이션 생명주기 관리
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Gateway API 서비스 시작")
    yield
    logger.info("🛑 Gateway API 서비스 종료")

# FastAPI 앱 생성
app = FastAPI(
    title="Gateway API",
    description="MSA Gateway API for portfolio services",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
ENV = os.getenv("ENV", "development")
if ENV == "production":
    allow_origins = [
        "https://www.haneull.com",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://conan.ai.kr"
    ]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(proxy_router, prefix="/api", tags=["proxy"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# 전역 예외 핸들러
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "요청한 리소스를 찾을 수 없습니다."}
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 내부 오류가 발생했습니다."}
    )

# 헬스체크 엔드포인트
@app.get("/")
async def root():
    return {
        "service": "Gateway API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "gateway"}

# 서버 실행
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8080))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
