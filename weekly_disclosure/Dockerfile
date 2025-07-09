FROM python:3.10-slim

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 전체 소스코드 복사
COPY . /app

# Python 경로 설정
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 포트 노출
EXPOSE 8090

# 앱 실행 (weekly_disclosure 디렉토리 기준)
WORKDIR /app/weekly_disclosure
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"] 