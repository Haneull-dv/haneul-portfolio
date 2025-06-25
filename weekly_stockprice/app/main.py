from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 공통 DB 모듈 import
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

# 라우터 import
from app.api.stockprice_router import router as stockprice_router
from app.api.n8n_stockprice_router import router as n8n_stockprice_router

app = FastAPI(title="Weekly Stock Price Service")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(stockprice_router, prefix="/stockprice", tags=["주가 정보"])
app.include_router(n8n_stockprice_router, tags=["n8n 자동화"])

print(f"🤍0. 메인 진입 - 주가 서비스 시작 (DI 기반)")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)