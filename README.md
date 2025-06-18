# 🏢 SKYC 마이크로서비스 아키텍처

이 프로젝트는 마이크로서비스 아키텍처를 기반으로 한 SKYC 시스템입니다.

## 🏗️ 시스템 아키텍처

```
Frontend (Next.js 15)
    ↓
Gateway (API 게이트웨이)
    ↓
┌─────────────────────────────────────┐
│           비즈니스 서비스들           │
├─ StockPrice (주가 조회)              │
├─ StockTrend (주가 트렌드)            │
├─ IRSummary (IR 요약)               │
├─ DSDGen (재무제표 생성)              │
└─ DSDCheck (재무제표 검증)            │
└─────────────────────────────────────┘
    ↓
PostgreSQL (데이터베이스)

N8N (워크플로우 자동화) ← → 모든 서비스들
```

## 📁 프로젝트 구조

```
portfolio/
├── frontend/            # Next.js 15 대시보드 (3000)
├── gateway/             # API 게이트웨이 (8080)
├── stockprice/          # 주가 정보 조회 서비스 (9006) ⭐ NEW
├── stocktrend/          # 주식 트렌드 서비스 (8081)
├── irsummary/           # IR 요약 서비스 (8083)
├── dsdgen/              # DSD 공시용 재무데이터 생성 서비스 (8085)
├── dsdcheck/            # DSD 공시용 재무데이터 검증 서비스 (8086)
├── n8n_data/            # N8N 워크플로우 자동화 데이터 ⭐ NEW
├── docker-compose.yml   # 도커 컴포즈 설정
├── Makefile            # 서비스 관리 명령어
└── README.md
```

## 🚀 기술 스택

### Backend
- **Python 3.11** - 백엔드 언어
- **FastAPI** - REST API 프레임워크
- **PostgreSQL** - 메인 데이터베이스
- **Docker & Docker Compose** - 컨테이너화

### Frontend
- **Next.js 15** - React 프레임워크
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **SCSS Modules** - 스타일링

### AI/ML
- **OpenAI GPT-3.5-turbo** - 자연어 처리
- **PyTorch** - 머신러닝
- **OpenCV** - 이미지 처리
- **Tesseract OCR** - 문자 인식

### 자동화
- **N8N** - 워크플로우 자동화
- **Camelot** - PDF 표 추출
- **pdfplumber** - PDF 텍스트 추출

## 🚀 개발 환경 설정

### 필수 요구사항

- Docker & Docker Compose
- Python 3.11 이상
- Node.js 18 이상
- Make
- Tesseract OCR
- Poppler-utils

### 🔧 환경 설정

1. **저장소 클론**
```bash
git clone [repository-url]
cd portfolio
```

2. **전체 시스템 실행**
```bash
# 모든 서비스 빌드 및 실행
make up

# 서비스 상태 확인
make ps
```

3. **개별 서비스 실행**
```bash
# 주가 서비스
make up-stockprice

# N8N 워크플로우
make up-n8n

# 프론트엔드
make up-frontend
```

## 🌐 서비스별 포트 및 접속 정보

| 서비스 | 포트 | 컨테이너명 | 접속 URL | 설명 |
|--------|------|------------|----------|------|
| **Frontend** | 3000 | frontend | http://localhost:3000 | Next.js 대시보드 |
| **Gateway** | 8080 | gateway | http://localhost:8080 | API 게이트웨이 |
| **StockPrice** | 9006 | stockprice | http://localhost:9006 | 주가 정보 조회 ⭐ NEW |
| **StockTrend** | 8081 | stock | http://localhost:8081 | 주가 트렌드 분석 |
| **IRSummary** | 8083 | summary | http://localhost:8083 | IR 보고서 요약 |
| **DSDGen** | 8085 | gen | http://localhost:8085 | 재무제표 생성 |
| **DSDCheck** | 8086 | check | http://localhost:8086 | 재무제표 검증 |
| **N8N** | 5678 | n8n | http://localhost:5678 | 워크플로우 자동화 ⭐ NEW |
| **PostgreSQL** | 5433 | db | localhost:5433 | 데이터베이스 |

### 🔐 접속 정보
- **N8N**: Username: `admin`, Password: `password`
- **PostgreSQL**: Username: `hc_user`, Password: `hc_password`

## 📖 API 문서

각 서비스의 Swagger UI 문서:
- **Gateway**: http://localhost:8080/docs
- **StockPrice**: http://localhost:9006/docs ⭐ NEW
- **StockTrend**: http://localhost:8081/docs
- **IRSummary**: http://localhost:8083/docs
- **DSDGen**: http://localhost:8085/docs
- **DSDCheck**: http://localhost:8086/docs

## 🔧 주요 명령어

### 🐳 Docker 명령어

```bash
# 전체 시스템
make up              # 모든 서비스 시작
make down            # 모든 서비스 중지
make restart         # 모든 서비스 재시작
make ps              # 서비스 상태 확인
make logs            # 전체 로그 확인

# 개별 서비스
make up-stockprice      # 주가 서비스 시작
make up-n8n            # N8N 시작
make logs-stockprice   # 주가 서비스 로그
make restart-frontend  # 프론트엔드 재시작

# 주가 관련 서비스들
make stock-services-up    # 주가 관련 서비스만 시작
make workflow-up         # N8N + 주가 서비스들 시작
```

### 🧹 정리 명령어
```bash
make clean           # 사용하지 않는 리소스 정리
make clean-all       # 모든 이미지/볼륨 정리 (주의!)
```

## 🚀 서비스별 주요 기능

### 📈 StockPrice Service (9006) ⭐ NEW
주가 정보 조회 및 분석을 위한 마이크로서비스
- **기본 주가 조회**: `/api/v1/stockprice/?symbol=005930`
- **트렌드 분석**: `/api/v1/stockprice/trend?symbol=005930&period=1y`
- **주가 분석**: `/api/v1/stockprice/analysis?symbol=005930`

### 🤖 N8N Workflow (5678) ⭐ NEW
워크플로우 자동화 플랫폼
- **주가 데이터 자동 수집**: 매일 정해진 시간에 주가 데이터 수집
- **재무제표 분석 자동화**: 파일 업로드 시 자동 검증 및 생성
- **시장 동향 모니터링**: 실시간 급등/급락 알림

### 📊 IRSummary Service (8083)
IR 리포트 PDF 파일 자동 분석
- **주요 정보 추출**: 투자 의견, 목표주가, 타겟 PER
- **실적 전망 분석**: 2Q24/2025/2026 수치 추출
- **AI 요약**: GPT-3.5-turbo 기반 자연어 요약

### 🔍 DSDCheck Service (8086)
재무데이터 검증 서비스
- **무결성 검증**: 계정과목 간 합계 일치 확인
- **전년도 대사**: 전기 보고서와의 수치 비교
- **검증 리포트**: 상세한 분석 결과 제공

### 📋 DSDGen Service (8085)
재무제표 생성 서비스
- **표준 양식 생성**: 공시용 재무제표 자동 생성
- **데이터 변환**: 다양한 형식의 데이터 통합
- **규정 준수**: 금융감독원 양식 준수

## 🔄 개발 워크플로우

### 새로운 기능 개발

1. **브랜치 생성**
```bash
git checkout -b feature/SKY-101-stockprice/new-feature
```

2. **개발 및 테스트**
```bash
# 해당 서비스만 재시작하여 테스트
make restart-stockprice
make logs-stockprice
```

3. **PR 생성 및 코드 리뷰**
4. **메인 브랜치 머지**

### 서비스 간 연동 개발
- API 스펙 변경 시 영향도 확인
- 데이터베이스 스키마 변경 시 마이그레이션 포함
- N8N 워크플로우 변경 시 백업 및 버전 관리

## 🤖 N8N 워크플로우 예시

### 1. 주가 데이터 자동 수집
```
Cron (매일 9시) → StockPrice API → PostgreSQL → Slack 알림
```

### 2. 재무제표 분석 자동화
```
파일 업로드 → DSDCheck API → DSDGen API → 이메일 발송
```

### 3. 시장 동향 모니터링
```
Interval (10분) → StockTrend API → 조건 확인 → 다중 알림
```

## 🔧 트러블슈팅

### 자주 발생하는 문제

1. **포트 충돌**
```bash
# 포트 사용 확인
netstat -tulpn | grep :3000

# docker-compose.yml에서 포트 변경
```

2. **서비스 연결 실패**
```bash
# 컨테이너 상태 확인
docker-compose ps

# 네트워크 확인
docker network ls
```

3. **로그 확인**
```bash
# 특정 서비스 로그
make logs-stockprice

# 실시간 로그
docker-compose logs -f stockprice
```

## 📚 추가 문서

- [대시보드 가이드](./DASHBOARD_README.md) - Next.js 15 대시보드 상세 가이드
- [N8N 워크플로우 가이드](./N8N_WORKFLOW_GUIDE.md) - 자동화 워크플로우 설정
- [브랜치 관리](./branch_command.txt) - Git 브랜치 전략
- [도커 명령어](./docker_command.txt) - Docker 관련 명령어 모음

## 🎯 다음 단계

- [ ] 실시간 주가 데이터 연동
- [ ] AI 기반 투자 분석 기능
- [ ] 모바일 앱 개발
- [ ] 고도화된 N8N 워크플로우
- [ ] 성능 최적화 및 모니터링

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 