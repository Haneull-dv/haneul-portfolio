# 1. 베이스 이미지
FROM python:3.10-slim

# 2. 환경 변수
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app  

# 3. 작업 디렉토리
WORKDIR /app

# 4. 소스 복사
COPY ./app ./app
COPY ./requirements.txt .

# 5. 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 6. 앱 실행 (uvicorn 사용 권장)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-9007}"]
# 7. 포트 노출
EXPOSE 9007
