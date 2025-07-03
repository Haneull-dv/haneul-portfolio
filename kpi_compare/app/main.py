from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.api.kpi_compare_router import router as kpi_compare_router

load_dotenv()
app = FastAPI(title="KPI Compare Service")

ENV = os.getenv("ENV", "development")

if ENV == "production":
    allow_origins = [
        "https://haneull.com",
        "https://conan.ai.kr",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
    ]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://portfolio-v0-02-1hkt...g4n-haneull-dvs-projects.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kpi_compare_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9007)

