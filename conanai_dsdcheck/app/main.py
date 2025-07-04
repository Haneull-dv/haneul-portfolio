import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.dsdfooting_router import router as dsdfooting_router
from .api.dsdcheck_router import router as dsdcheck_router


# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="재무제표 검증 서비스",
    version="1.0.0",
    description="DSD 공시용 재무데이터 검증 서비스"
)

# --- CORS 설정 (환경에 따라 분기) ---
ENV = os.getenv("ENV", "development")  # .env 파일에 ENV 변수가 없으면 'development'로 간주

if ENV == "production":
    # 운영 환경에서 허용할 프론트엔드 도메인 목록
    allow_origins = [
        "https://your-production-domain.com",  # 실제 운영 도메인으로 변경하세요
        "https://haneul-portfolio.vercel.app" # 예시: Vercel 배포 도메인
    ]
else:
    # 개발 환경에서 허용할 프론트엔드 주소 목록
    allow_origins = [
        "http://localhost:3000",  # Next.js 개발 서버
        "http://localhost:3001",  # 다른 프론트엔드 개발 서버 (필요시)
        # Vercel의 Preview URL도 여기에 추가할 수 있습니다.
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- CORS 설정 끝 ---

# 라우터 등록
app.include_router(dsdfooting_router)
app.include_router(dsdcheck_router)

@app.get("/")
async def root():
    return {"message": "재무제표 검증 서비스 API"} 