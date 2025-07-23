# 🎮 Game Industry Market Intelligence Platform

> **Demo Video:** [YouTube 시연 영상 바로가기](https://youtu.be/9ANnZFn3a7g?si=4qdm6uhpQciHHmNL)

---

## ✅ 한눈에 보는 프로젝트 개요

### 프로젝트 목적 / 해결하고자 한 문제

**게임업계 상장기업의 주가, 공시, 주요 이슈, 재무제표, KPI 등 다양한 데이터를 자동으로 수집·분석·비교·검증하여, 투자자·경영진·애널리스트가 한눈에 시장 동향과 기업별 경쟁력을 파악할 수 있도록 지원하는 통합 데이터 플랫폼입니다.**

- **문제점:** 분산된 데이터(주가, 공시, 이슈, 리포트, 재무제표 등)를 수작업으로 모으고 분석하는 데 많은 시간과 노력이 소요됨
- **해결:** 다양한 데이터 소스를 자동 수집·정제·분석·비교·검증하여, 실시간으로 시각화/요약/비교/검증 결과를 제공

---

## 🏆 주요 서비스/기능 (4대 핵심 모듈)

### 1. **Market Digest**
- **주간 게임업계 동향 대시보드**
- 주가, 공시, 주요 이슈를 통합적으로 수집/시각화 (weekly_issue, weekly_disclosure, weekly_stockprice)
- 기업별로 한눈에 비교/검색/필터링 가능

### 2. **KPI Compare**
- **상장사 KPI(핵심 재무지표) 비교 분석**
- 여러 기업의 주요 재무지표(매출, 영업이익 등)를 기간별로 비교/시각화
- 경쟁사 벤치마킹, 트렌드 분석 지원

### 3. **DART Converter**
- **DART 표준 재무제표 자동 생성**
- 엑셀 업로드만으로 표준화된 DART 재무제표 생성
- 다양한 기업/기간별 템플릿 지원

### 4. **Validation**
- **재무제표 자동 검증/비교**
- 업로드된 재무제표의 무결성, 항목간 논리관계, 전기/당기 비교 등 자동 검증
- 오류/불일치 항목 상세 리포트 제공

---

## 🏗️ 시스템 아키텍처

```
Frontend (Next.js 15, React 19)
    ↓
Gateway (FastAPI, Nginx)
    ↓
┌───────────────────────────────────────────────┐
│                Microservices                 │
├─ dart_converter/    # DART 재무제표 생성 (8085)
├─ validation/        # 재무제표 검증 (8086)
├─ kpi_compare/       # KPI 비교 분석 (8092)
├─ weekly_stockprice/ # 주간 주가 데이터 (9006)
├─ weekly_disclosure/ # 주간 공시 데이터 (8090)
├─ weekly_issue/      # 주간 이슈 데이터 (8089)
├─ slm_newsclassifier_inference/ # 뉴스 분류 AI (8087)
├─ slm_summarizer_inference/    # 텍스트 요약 AI (8088)
├─ gateway/           # API 게이트웨이 (8080)
├─ frontend/          # 대시보드 (3000)
└─ ...
    ↓
PostgreSQL (15)
```

---

## 🚀 기술 스택

- **Frontend:** Next.js 15, React 19, TypeScript, SCSS Modules
- **Backend:** Python 3.11, FastAPI, SQLAlchemy
- **Database:** PostgreSQL 15
- **AI/ML:** PyTorch, HuggingFace Transformers, OpenAI GPT-3.5
- **Automation:** n8n, pdfplumber, Camelot
- **Infra:** Docker, Docker Compose, Nginx

---

## ✨ 통합 플랫폼 주요 특징

- **4대 핵심 서비스**가 독립적이면서도 통합된 대시보드에서 연동
- **주가/공시/이슈 통합 Market Digest**: 게임업계 상장사별 주가, 공시, 이슈를 한눈에 비교/분석
- **KPI 비교 분석**: 여러 기업의 주요 재무지표를 기간별로 비교
- **DART 재무제표 자동 생성**: 엑셀 업로드만으로 표준 재무제표 생성
- **재무제표 자동 검증**: 업로드된 재무제표의 무결성, 논리관계, 전기/당기 비교 등 자동 검증
- **AI 기반 뉴스 분류/요약, PDF 리포트 요약**: 최신 시장 뉴스 자동 분류 및 요약, 애널리스트 리포트 등 PDF 문서 자동 요약
- **n8n 기반 데이터 파이프라인**: 주간 데이터 자동 수집/정제/적재

---

## 🛠️ 로컬 실행 방법

1. **레포지토리 클론**
   ```bash
   git clone <your-repo-url>
   cd portfolio
   ```
2. **환경변수 파일(.env) 준비**
   - 각 서비스별 `.env.example` 참고하여 `.env` 파일 생성
3. **도커로 전체 서비스 실행**
   ```bash
   docker-compose up --build
   ```
4. **대시보드 접속**
   - http://localhost:3000

---

## 📚 API 문서 & 시연 영상

- **API 문서:** 각 서비스별 `/docs` (예: http://localhost:8080/docs)
- **시연 영상:** [YouTube Demo](https://youtu.be/9ANnZFn3a7g?si=4qdm6uhpQciHHmNL)

---

## 📁 디렉토리 구조 (최신)

```
portfolio/
├── frontend/                 # Next.js 대시보드
├── gateway/                  # API Gateway
├── dart_converter/           # DART 재무제표 생성
├── validation/               # 재무제표 검증
├── kpi_compare/              # KPI 비교 분석
├── weekly_stockprice/        # 주간 주가 데이터
├── weekly_disclosure/        # 주간 공시 데이터
├── weekly_issue/             # 주간 이슈 데이터
├── slm_newsclassifier_inference/ # 뉴스 분류 AI
├── slm_summarizer_inference/     # 텍스트 요약 AI
├── n8n_data/                 # n8n 워크플로우
├── postgres/                 # DB
├── docker-compose.yml        # 도커 컴포즈
└── README.md
```

---

## 💡 기타
- **포트폴리오/시연/기술블로그 등에 활용하기 좋은 구조와 문서화**
- **확장성/유지보수성 고려한 마이크로서비스 설계**
- **실제 상장사 데이터 기반 데모**

---

> 문의/협업/기술문의: skyc.corp@gmail.com


