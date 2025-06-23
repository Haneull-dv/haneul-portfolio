from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat_router import router as chat_router


app = FastAPI(title="Chat Service")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(chat_router, prefix="/chat", tags=["파일 업로드"])
print(f"🤍0 메인 진입")