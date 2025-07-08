# 🏢 SKYC Corp: Microservice Project

This project is a comprehensive enterprise management solution built on a microservice architecture, designed to automate and enhance financial analysis, reporting, and market intelligence for SKYC Corp.

## 🏗️ 시스템 아키텍처

```
Frontend (Next.js)
    ↓
Gateway (API 게이트웨이)
    ↓
┌────────────────────────────────────────────────────────────┐
│                      Microservices                         │
├─ StockPrice (주가 정보 조회)                                  │
├─ StockTrend (주식 트렌드 분석)                                │
├─ IRSummary (IR 보고서 요약)                                 │
├─ DSDGen (재무제표 생성)                                     │
├─ DSDCheck (재무제표 검증)                                   │
├─ KPICompare (KPI 비교 분석)                                 │
├─ NewsClassifier (뉴스 분류 ai 모델)                                 │
├─ Summarizer (텍스트 요약 ai 모델)                                   │
├─ Disclosure (공시 수집)                                     │
├─ Issue (이슈 트래킹)                                   │
└─ WeeklyDB (주간 데이터 통합)                                │
└────────────────────────────────────────────────────────────┘
    ↓
PostgreSQL (데이터베이스)

N8N (워크플로우 자동화) ← → 모든 서비스들
```

## 📁 Project Structure

```
portfolio/
├── frontend/                 # Next.js 15 Dashboard (Port: 3000)
├── gateway/                  # API Gateway (Port: 8080)
│
├── conanai_stocktrend/       # Stock Trend Analysis Service (Port: 8081)
├── conanai_irsummary/        # IR & Analyst Report Summarization (Port: 8083)
├── conanai_dsdgen/           # DART DSD Financial Statement Generation (Port: 8085)
├── conanai_dsdcheck/         # DART DSD Financial Statement Validation (Port: 8086)
│
├── weekly_stockprice/        # Weekly Stock Price Data Service (Port: 9006)
├── weekly_disclosure/        # Weekly Disclosures Collection (Port: 8090)
├── weekly_issue/             # Weekly Market Issue Tracking (Port: 8089)
├── weekly_db/                # Weekly Data CQRS Orchestrator (Port: 8091)
│
├── kpi_compare/              # Cross-Company KPI Comparison Service (Port: 8092)
│
├── slm_newsclassifier_inference/ # News Classification SLM Service (Port: 8087)
├── slm_summarizer_inference/     # Text Summarization SLM Service (Port: 8088)
│
├── n8n_data/                 # n8n Workflow Automation Data (Port: 5678)
├── postgres/                 # PostgreSQL Database (Port: 5432)
│
├── docker-compose.yml        # Docker Compose Configuration
└── README.md
```

## 🚀 Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy
- **Frontend**: Next.js 15, React 19, TypeScript, SCSS Modules
- **Database**: PostgreSQL 15
- **AI/ML**: PyTorch, HuggingFace Transformers (SLMs), OpenAI GPT-3.5
- **Automation**: n8n, pdfplumber, Camelot
- **Infrastructure**: Docker, Docker Compose, Nginx (in Gateway)

## 🌐 Service Ports & Endpoints

| Service              | Port | Container Name | Description                                    | API Docs                |
|----------------------|------|----------------|------------------------------------------------|-------------------------|
| **Frontend**         | 3000 | `frontend`     | User-facing dashboard                          | -                       |
| **Gateway**          | 8080 | `gateway`      | Main API Gateway                               | `/docs`                 |
| **StockTrend**       | 8081 | `stock`        | Stock trend & competitor analysis              | `/docs`                 |
| **IRSummary**        | 8083 | `summary`      | AI-powered report summarization                | `/docs`                 |
| **DSDGen**           | 8085 | `gen`          | DART financial statement (DSD) generation      | `/docs`                 |
| **DSDCheck**         | 8086 | `check`        | Financial statement validation & comparison    | `/docs`                 |
| **NewsClassifier**   | 8087 | `newsclassifier`| News article classification (SLM)             | `/docs`                 |
| **Summarizer**       | 8088 | `summarizer`   | Text summarization service (SLM)               | `/docs`                 |
| **Issue**            | 8089 | `issue`        | Weekly market issue tracking service           | `/docs`                 |
| **Disclosure**       | 8090 | `disclosure`   | Weekly disclosure collection service           | `/docs`                 |
| **WeeklyDB**         | 8091 | `weekly_data`  | CQRS orchestrator for weekly batch jobs        | `/docs`                 |
| **KPICompare**       | 8092 | `kpi_compare`  | Cross-company financial KPI comparison         | `/docs`                 |
| **StockPrice**       | 9006 | `stockprice`   | Historical stock price data service            | `/docs`                 |
| **n8n**              | 5678 | `n8n`          | Workflow automation engine                     | -                       |
| **PostgreSQL**       | 5432 | `db`           | Main application database                      | -                       |

*   **Access API Docs**: `http://localhost:{PORT}/docs` (e.g., `http://localhost:8080/docs`)

## ✨ Key Features

### Financial Analysis & Automation
- **Cross-Company KPI Comparison**: Interactively compare financial KPIs across multiple companies and reporting periods.
- **Automated Financial Statement (DSD) Generation**: Create standardized DART-compliant financial statements from Excel templates.
- **Financial Data Validation**: Verify integrity between financial statements and compare against previous periods.

### AI-Powered Insights
- **Analyst Report Summarization**: Automatically extracts key insights, performance forecasts, and investment opinions from PDF reports using OCR and AI.
- **Small Language Model (SLM) Services**:
    - **News Classifier**: Classifies financial news into categories like "M&A," "Earnings," "Stock," etc.
    - **Text Summarizer**: Provides concise summaries of long articles and reports.

### Market & Stock Intelligence
- **Weekly Data Collection**: Automated weekly collection of stock prices, corporate disclosures, and major market issues.
- **Stock Trend Analysis**: Provides analysis of stock trends and key indicators.
- **n8n Workflow Automation**: Automates complex data pipelines, such as orchestrating weekly data collection and report generation.

### Modern User Interface
- **Interactive Dashboard**: A responsive and intuitive Next.js frontend to visualize data and interact with services.
- **Secure Authentication**: JWT-based authentication managed by the API Gateway.
- **Dynamic Content**: Features like PDF viewers and video modals for rich content display.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- `make` utility

### Running the System
1.  **Clone the repository.**
2.  **Set up environment files**: Create `.env` files for each service based on their respective `.env.example` files.
3.  **Start all services**:
    ```bash
    make up
    ```
4.  **Access the dashboard**: Open `http://localhost:3000` in your browser.

## 🔧 Key `make` Commands

- `make up`: Build and start all services.
- `make down`: Stop all services.
- `make ps`: View the status of all running services.
- `make logs service=<service_name>`: View logs for a specific service (e.g., `make logs service=gateway`).
- `make restart service=<service_name>`: Restart a specific service.
- `make clean`: Remove stopped containers and dangling images.

## 🤖 N8N Workflow Examples

- **Weekly Data Pipeline**: A master workflow triggered every Friday that orchestrates `weekly_disclosure`, `weekly_issue`, and `weekly_stockprice` services to collect, process, and store the week's data.
- **Report Analysis Pipeline**: An n8n workflow that listens for file uploads (e.g., analyst reports), sends them to the `irsummary` service for analysis, and then notifies users via Slack or email with the summary.


