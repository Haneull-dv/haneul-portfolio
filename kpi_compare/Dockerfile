# 1. 베이스 이미지 설정
FROM python:3.10-slim

# 2. 환경 변수 설정
# - PYTHONUNBUFFERED: 로그가 버퍼링 없이 즉시 출력되도록 설정
ENV PYTHONUNBUFFERED=1

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 의존성 파일 먼저 복사 및 설치 (가장 변경이 적은 부분이므로 캐시 활용도 높임)
COPY ./kpi_compare/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 필요한 소스코드 복사
# - kpi_compare: 메인 서비스 코드
# - weekly_db: 공통 DB 모듈
COPY ./kpi_compare /app/kpi_compare
COPY ./weekly_db /app/weekly_db

# 6. 최종 작업 디렉토리 변경
WORKDIR /app/kpi_compare

# 7. 애플리케이션 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9007", "--reload"]

# 8. 포트 노출
EXPOSE 9007 