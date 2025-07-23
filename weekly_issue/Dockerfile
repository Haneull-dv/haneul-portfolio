# 1. 베이스 이미지 설정
FROM python:3.10-slim

# 2. 환경 변수
ENV PYTHONUNBUFFERED=1
ENV RUNNING_IN_DOCKER=true

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 의존성 설치
COPY ./weekly_issue/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 소스코드 복사
COPY ./weekly_issue /app

# 6. 앱 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8089"]

# 7. 포트 노출
EXPOSE 8089