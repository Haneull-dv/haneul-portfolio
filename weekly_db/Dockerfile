FROM python:3.11.9-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 요구사항 파일 복사 및 설치
COPY ./weekly_db/requirements.txt ./weekly_db/
RUN pip install --no-cache-dir -r ./weekly_db/requirements.txt

# 전체 프로젝트 복사
COPY . .

# 권한 설정
RUN chmod -R 755 /app

# Python 경로 설정
ENV PYTHONPATH=/app

# Weekly DB 디렉토리로 이동
WORKDIR /app/weekly_db

# FastAPI 서버 실행 (포트 8091)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8091", "--reload"] 