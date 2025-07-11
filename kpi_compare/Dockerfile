# 1. 베이스 이미지
FROM python:3.10-slim

# 2. 환경 변수
ENV PYTHONUNBUFFERED=1

# 3. 작업 디렉토리
WORKDIR /app

# 4. 소스 복사
COPY ./app ./app
COPY ./requirements.txt .

# 5. 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 6. 작업 디렉토리 고정 (app 디렉토리 기준으로)
WORKDIR /app

# 7. 앱 실행 (main.py 기준)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9007"]

# 8. 포트 노출
EXPOSE 9007
