FROM python:3.10.18-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 전체 프로젝트 복사 (다른 서비스 모델들에 접근하기 위함)
COPY .. .

# 실행 권한 부여
RUN chmod -R 755 /app

# 기본 실행 명령 (대기 상태)
CMD ["tail", "-f", "/dev/null"] 