from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.issue_router import router as issue_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="issue")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(issue_router)

print(f"🤍0 메인 진입")