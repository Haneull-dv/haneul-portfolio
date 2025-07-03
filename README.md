# 📈 코난-AI: AI 기반 금융 분석 플랫폼
> DART 공시 데이터, 실시간 주가, 최신 뉴스를 기반으로 AI가 투자 결정을 돕는 금융 분석 대시보드

## 📜 프로젝트 개요 (Description)
`코난-AI`는 복잡하고 분산된 금융 데이터를 수집, 분석, 시각화하여 투자자들이 더 빠르고 정확한 결정을 내릴 수 있도록 돕는 마이크로서비스 기반의 플랫폼입니다. DART의 정기 공시 보고서를 분석하여 재무 건전성을 평가하고, IR 자료를 요약하며, 최신 주가와 뉴스 트렌드를 제공하여 종합적인 투자 인사이트를 제공합니다.

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 |
|------|--------------------------------------------------------------------------------|
| **Frontend** | `Next.js`, `React`, `TypeScript`, `SCSS Modules`, `TanStack Query`, `Recharts` |
| **Backend** | `Python`, `FastAPI`, `SQLAlchemy` |
| **Database** | `PostgreSQL` |
| **AI/ML** | `PyTorch`, `Transformers (SLM)`, `OpenAI API` |
| **Automation & Data Processing**| `N8N`, `Pandas`, `pdfplumber`, `Camelot` |
| **DevOps** | `Docker`, `Docker Compose` |

## ✨ 주요 기능 (Features)

- **Gateway**: `JWT` 기반 인증 및 마이크로서비스 API 라우팅
- **Financial Trends Dashboard**:
  - 여러 기업의 핵심 재무 지표(`KPI`) 비교 분석
  - 성장성, 수익성, 안정성을 종합 평가하는 레이더 차트 시각화
  - DART 사업보고서 기반의 연도별 데이터 분석
- **IR 보고서 AI 요약**:
  - PDF 형식의 IR 보고서를 업로드하면 `AI`가 핵심 내용을 자동 요약
- **재무제표(DSD) 생성 및 검증**:
  - `XBRL` 형식의 재무제표 데이터를 분석하여 표준화된 DSD(Data Set for DSD) 생성 및 검증
- **주간 금융 리포트 자동화**:
  - `N8N` 워크플로우를 통해 매주 주요 기업의 공시, 이슈, 주가 정보를 자동으로 수집 및 요약
- **소형언어모델(SLM) 기반 서비스**:
  - 금융 뉴스 실시간 분류 및 요약 기능 제공

## 🎬 데모 (Demo)
(여기에 시연 영상 GIF나 스크린샷을 추가할 예정입니다.)

## 🏗️ 프로젝트 구조 (Project Structure)
```
portfolio/
├── frontend/                     # Next.js 15 대시보드 (포트: 3000)
├── gateway/                      # API 게이트웨이 (포트: 8000)
├── kpi_compare/                  # 재무 KPI 비교 분석 서비스 (포트: 9007)
├── conanai_irsummary/            # IR 보고서 AI 요약 서비스
├── conanai_dsdgen/               # 재무제표(DSD) 생성 서비스
├── conanai_dsdcheck/             # 재무제표(DSD) 검증 서비스
├── weekly_disclosure/            # 주간 공시 정보 서비스
├── weekly_issue/                 # 주간 이슈 트렌드 서비스
├── weekly_stockprice/            # 주간 주가 정보 서비스
├── slm_newsclassifier_inference/ # 뉴스 분류 SLM 서빙
├── slm_summarizer_inference/     # 뉴스 요약 SLM 서빙
├── n8n_data/                     # N8N 워크플로우 데이터
├── postgres/                     # PostgreSQL 데이터베이스 설정
└── docker-compose.yml            # (가정) 전체 서비스 실행을 위한 Docker Compose 설정
```

## ⚙️ 설치 및 실행 방법 (Installation & Usage)
### 요구사항
- Docker & Docker Compose
- (선택) Python 3.11+, Node.js 18+ (개별 서비스 로컬 개발 시)

### 실행
1.  **저장소 클론**
    ```bash
    git clone [repository-url]
    cd portfolio
    ```

2.  **환경변수 설정**
    각 서비스 디렉토리의 `.env.example` 파일을 복사하여 `.env` 파일을 생성하고, 필요한 환경 변수(API 키, DB 정보 등)를 설정합니다.

3.  **Docker Compose를 이용한 전체 시스템 실행**
    ```bash
    # 모든 서비스 빌드 및 백그라운드 실행
    docker-compose up --build -d
    ```

4.  **실행 확인**
    - **Frontend Dashboard**: `http://localhost:3000`
    - **Gateway (API Docs)**: `http://localhost:8000/docs`

## 📚 API 문서
각 마이크로서비스는 FastAPI의 자동 생성 API 문서(Swagger UI)를 제공합니다. 게이트웨이를 통해 모든 API에 접근할 수 있지만, 개발 시 각 서비스의 API 문서를 직접 확인할 수 있습니다. (아래 포트는 예시입니다.)

- **Gateway**: `http://localhost:8000/docs`
- **KPI Compare Service**: `http://localhost:9007/docs`
- **IR Summary Service**: `http://localhost:9003/docs`
- **DSD Gen Service**: `http://localhost:9002/docs`
- **DSD Check Service**: `http://localhost:9001/docs`
- *... (나머지 서비스들도 유사한 패턴으로 제공)* 