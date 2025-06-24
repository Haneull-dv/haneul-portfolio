FROM python:3.11.9-slim

WORKDIR /app

# 패키지 설치를 위한 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 앱 디렉토리 권한 설정
RUN chmod -R 755 /app

# 포트 노출
EXPOSE 8089

# 환경 변수 설정
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8089", "--reload"] 