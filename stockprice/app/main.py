from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.stockprice_router import router as stockprice_router

app = FastAPI(title="Stock Price Service")

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
print(f"🤍0. 메인 진입")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)