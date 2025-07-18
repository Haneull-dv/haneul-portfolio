from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.kpi_compare_router import router as kpi_compare_router

ENV = os.getenv("ENV", "development")
if ENV == "development":
    from dotenv import load_dotenv
    load_dotenv()
    print(f"[ENV] 개발환경: .env 파일 로드됨")
else:
    print(f"[ENV] 배포환경: .env 파일 로드하지 않음")

print(f"[ENV] ENV={ENV}")
dart_key = os.getenv('DART_API_KEY')
print(f"[ENV] DART_API_KEY={'[설정됨]' if dart_key else '[누락]'}")
if dart_key:
    print(f"[ENV] DART_API_KEY 길이: {len(dart_key)}")

app = FastAPI(title="KPI Compare Service")


@app.get("/debug/dart-key")
def debug_dart_key():
    dart_key = os.getenv("DART_API_KEY")
    print("📦 [DEBUG] DART_API_KEY =", dart_key)
    return {
        "dart_key": dart_key,
        "dart_key_length": len(dart_key) if dart_key else 0,
        "env": ENV,
        "all_env_vars": {k: v for k, v in os.environ.items() if 'DART' in k.upper()}
    }

if ENV == "production":
    allow_origins = [
        "https://www.haneull.com",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://portfolio-v0-02-2gdu3pezg-haneull-dvs-projects.vercel.app",
        "https://kpi_compare.haneull.com",
        "https://conan.ai.kr"
    ]
else:
    allow_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://portfolio-v0-02-git-main-haneull-dvs-projects.vercel.app",
        "https://portfolio-v0-02-1hkt...g4n-haneull-dvs-projects.vercel.app",
        "https://haneull.com",
        "https://conan.ai.kr"
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
    port = int(os.getenv("PORT", 9007 if ENV == "development" else 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=(ENV=="development"))

