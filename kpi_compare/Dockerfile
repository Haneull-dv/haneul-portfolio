# 1. 베이스 이미지
FROM python:3.10-slim

# 2. 환경 변수 (Railway 최적화)
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1

# 3. 시스템 의존성 설치 (curl 포함)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 4. 작업 디렉토리
WORKDIR /app

# 5. 의존성 파일 먼저 복사 (Docker 캐시 최적화)
COPY ./requirements.txt .

# 6. 의존성 설치
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 7. 소스 복사
COPY ./app ./app

# 8. Railway 환경변수 확인 스크립트 추가
RUN echo '#!/bin/bash\necho "🚀 Railway Container 환경변수 체크:"\necho "ENV = $ENV"\necho "DART_API_KEY = ${DART_API_KEY:0:10}..." \necho "PORT = $PORT"\necho "RAILWAY_ENVIRONMENT = $RAILWAY_ENVIRONMENT"\necho "전체 환경변수 개수: $(env | wc -l)"\necho "==================================="\nexec "$@"' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

# 9. 헬스체크 추가 (Railway 호환)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-9007}/debug/dart-key || exit 1

# 10. 포트 노출
EXPOSE ${PORT:-9007}

# 11. 엔트리포인트와 CMD 분리 (Railway 권장)
ENTRYPOINT ["/entrypoint.sh"]
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-9007} --log-level info"]
