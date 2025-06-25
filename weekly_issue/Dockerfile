FROM python:3.11.9-slim

WORKDIR /app

# 패키지 설치를 위한 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치
COPY ./weekly_issue/requirements.txt ./weekly_issue/
RUN pip install --no-cache-dir -r ./weekly_issue/requirements.txt

# 전체 프로젝트 복사 (공통 모듈 접근을 위해)
COPY . .

# 앱 디렉토리 권한 설정
RUN chmod -R 755 /app

# Python 경로 설정 (루트 기준)
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 포트 노출
EXPOSE 8089

# 앱 실행 (weekly_issue 디렉토리 기준)
WORKDIR /app/weekly_issue
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8089", "--reload"] 