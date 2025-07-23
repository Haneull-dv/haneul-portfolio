# 🚀 API Gateway

MSA(Microservices Architecture) 패턴을 따르는 FastAPI 기반 API 게이트웨이 서비스입니다.

## 🏗️ 아키텍처

```
main.py
├── api/
│   ├── proxy_router.py      # 프록시 라우팅
│   └── auth_router.py       # 인증 라우팅
├── domain/
│   ├── controller/
│   │   └── proxy_controller.py  # 비즈니스 로직 조정
│   ├── service/
│   │   └── proxy_service.py     # 핵심 비즈니스 로직
│   └── model/
│       ├── service_type.py      # 서비스 타입 정의
│       └── service_factory.py   # 레거시 팩토리
└── [config/, platform/, middleware/, foundation/]
```

## 🎯 주요 기능

- **동적 프록시**: 모든 HTTP 메서드 지원 (GET, POST, PUT, DELETE, PATCH)
- **파일 업로드**: 멀티파트 폼 데이터 지원
- **서비스 검증**: 요청 전 서비스 타입 및 URL 검증
- **에러 처리**: 타임아웃, 연결 오류 등 포괄적 에러 처리
- **로깅**: 구조화된 로그로 요청 추적 가능

## 🔗 지원 서비스

- `stocktrend`, `dart_converter`, `stockprice`, `validation`
- `newsclassifier`, `summarizer`, `issue`, `kpi_compare`
- `weekly_disclosure`, `weekly_issue`, `weekly_stockprice`
- `validation`, `dart_converter`

## 📡 API 엔드포인트

### 프록시 엔드포인트
```http
GET    /api/{service}/{path:path}      # GET 요청 프록시
POST   /api/{service}/{path:path}      # POST 요청 프록시 (파일 업로드 지원)
PUT    /api/{service}/{path:path}      # PUT 요청 프록시
DELETE /api/{service}/{path:path}      # DELETE 요청 프록시
PATCH  /api/{service}/{path:path}      # PATCH 요청 프록시
```

### 관리 엔드포인트
```http
GET /api/services                      # 사용 가능한 서비스 목록
GET /auth/services                     # 서비스 상태 정보
GET /auth/health                       # 인증 서비스 헬스체크
GET /health                           # 게이트웨이 헬스체크
```

## 🚀 실행 방법

### 개발 환경
```bash
# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정 (.env 파일)
SERVICE_PORT=8080
ENV=development

# 서비스별 URL 설정
STOCKPRICE_SERVICE_URL=http://localhost:9006
ISSUE_SERVICE_URL=http://localhost:8089
# ... 기타 서비스 URL

# 서버 실행
python app/main.py
```

### Docker 실행
```bash
docker build -t gateway .
docker run -p 8080:8080 gateway
```

### Docker Compose (권장)
```bash
docker-compose up
```

## 📝 사용 예시

### 기본 프록시 요청
```bash
# 주가 서비스 호출
curl http://localhost:8080/api/stockprice/db/all

# 이슈 서비스 호출
curl http://localhost:8080/api/issue/recent
```

### 파일 업로드 요청
```bash
# DSD 생성 서비스에 파일 업로드
curl -X POST \
  http://localhost:8080/api/dart_converter/upload \
  -F "file=@data.xlsx" \
  -F "sheet_name=Sheet1"
```

### 서비스 상태 확인
```bash
# 사용 가능한 서비스 목록
curl http://localhost:8080/api/services

# 응답 예시
{
  "services": {
    "stockprice": {"available": true, "name": "stockprice"},
    "issue": {"available": true, "name": "issue"}
  },
  "total": 13,
  "available_count": 2
}
```

## 🛠️ 설정

### 환경변수
```bash
# 필수 설정
SERVICE_PORT=8080                              # 서비스 포트
ENV=development|production                     # 환경 설정

# 서비스 URL (각 마이크로서비스의 URL)
STOCKPRICE_SERVICE_URL=http://stockprice:9006
ISSUE_SERVICE_URL=http://issue:8089
WEEKLY_STOCKPRICE_SERVICE_URL=http://weekly_stockprice:9006
WEEKLY_ISSUE_SERVICE_URL=http://weekly_issue:8089
# ... 기타 서비스 URL
```

## 🏷️ MSA 패턴

이 게이트웨이는 다음 MSA 원칙을 따릅니다:

1. **단일 책임**: 각 레이어가 명확한 역할 분담
2. **의존성 주입**: 컨트롤러와 서비스 간 느슨한 결합
3. **에러 격리**: 서비스별 독립적인 에러 처리
4. **확장성**: 새로운 서비스 추가 용이

## 📊 모니터링

- **로그**: 구조화된 JSON 로그로 요청 추적
- **헬스체크**: `/health` 엔드포인트로 서비스 상태 확인
- **서비스 디스커버리**: `/api/services`로 연결된 서비스 확인

## 🔧 개발

새로운 서비스 추가 시:

1. `service_type.py`에 서비스 타입 추가
2. 환경변수에 서비스 URL 설정
3. 필요시 `proxy_service.py`에서 특별 처리 로직 추가 