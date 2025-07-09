# 1. 베이스 이미지 설정
FROM python:3.10-slim

# 2. 환경 변수 설정
ENV PYTHONUNBUFFERED=1
ENV RUNNING_IN_DOCKER=true

# 3. 작업 디렉토리 설정
WORKDIR /app

# 4. 의존성 파일 먼저 복사 및 설치 (가장 중요!)
# Root Directory가 ./weekly_issue 이므로, 경로는 이제 'requirements.txt' 입니다.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 필요한 소스코드 복사
# 공통 모듈인 weekly_db를 상위 폴더에서 가져옵니다.
# COPY ../weekly_db /app/weekly_db

# 현재 서비스의 소스 코드를 복사합니다.
COPY . /app

# 6. 최종 작업 디렉토리 변경 (불필요)
# WORKDIR /app/weekly_issue -> 이미 필요한 모든 파일이 /app 에 복사되었으므로 이 라인은 필요 없습니다.

# 7. 애플리케이션 실행
# uvicorn은 WORKDIR(/app) 기준으로 실행되므로 경로 수정이 필요 없습니다.
# --reload 플래그는 개발용입니다. 프로덕션에서는 제거하는 것이 좋습니다.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8089"]

# 8. 포트 노출
EXPOSE 8089