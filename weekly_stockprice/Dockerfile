FROM python:3.10.18-slim

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY ./weekly_stockprice/requirements.txt ./weekly_stockprice/
RUN pip install --no-cache-dir -r ./weekly_stockprice/requirements.txt

# 전체 프로젝트 복사 (공통 모듈 접근을 위해)
COPY . .

# Python 경로 설정 (루트 기준)
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 포트 노출
EXPOSE 9006

# 앱 실행 (weekly_stockprice 디렉토리 기준)
WORKDIR /app/weekly_stockprice
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9006", "--reload"] 