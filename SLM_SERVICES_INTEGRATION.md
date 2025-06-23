# SLM 서비스 통합 가이드

## 🚀 새롭게 추가된 서비스

### 1. 뉴스 분류기 서비스 (News Classifier)
- **컨테이너명**: `newsclassifier`
- **포트**: `8087`
- **기능**: 뉴스 텍스트 중요도 분류
- **API 엔드포인트**: 
  - `POST /predict` - 뉴스 텍스트 분류
  - `GET /health` - 헬스체크

### 2. 텍스트 요약기 서비스 (Summarizer)
- **컨테이너명**: `summarizer`
- **포트**: `8088`
- **기능**: 뉴스 텍스트 요약
- **API 엔드포인트**:
  - `POST /summarize` - 단일 텍스트 요약
  - `POST /summarize/batch` - 배치 텍스트 요약
  - `GET /model/status` - 모델 상태 확인
  - `GET /health` - 헬스체크

## 🔌 게이트웨이 통합

두 서비스 모두 게이트웨이(`http://localhost:8080`)를 통해 접근 가능합니다:

### 뉴스 분류기 사용법
```bash
# 게이트웨이를 통한 접근
POST http://localhost:8080/api/newsclassifier/predict
Content-Type: application/json

{
  "text": "분류할 뉴스 텍스트"
}
```

### 요약기 사용법
```bash
# 게이트웨이를 통한 접근
POST http://localhost:8080/api/summarizer/summarize
Content-Type: application/json

{
  "text": "요약할 뉴스 텍스트",
  "max_length": 150,
  "min_length": 50
}
```

## 🐳 Docker 컨테이너 실행

### ⚠️ 중요: D드라이브 설정 필수
모델 컨테이너들은 D드라이브에 저장되도록 설정되어 있습니다. 먼저 설정 스크립트를 실행하세요:

```powershell
# PowerShell에서 실행
.\setup_d_drive_models.ps1
```

### 전체 시스템 시작
```bash
docker-compose up -d
```

### 개별 서비스 시작
```bash
# 뉴스 분류기만 시작
docker-compose up -d newsclassifier

# 요약기만 시작
docker-compose up -d summarizer
```

### 로그 확인
```bash
# 뉴스 분류기 로그
docker-compose logs -f newsclassifier

# 요약기 로그
docker-compose logs -f summarizer
```

## 📁 프로젝트 구조

```
portfolio/ (C드라이브)
├── slm-newsclassifier-inference/ (소스 코드)
├── slm-summarizer-inference/ (소스 코드)
├── docker-compose.yml (updated)
└── setup_d_drive_models.ps1 (설정 스크립트)

D:\portfolio-models/ (D드라이브 - 실행 환경)
├── slm-newsclassifier-inference/
│   ├── app/
│   ├── models/ (모델 파일들)
│   └── ... (소스 코드 복사본)
├── slm-summarizer-inference/
│   ├── app/
│   ├── offload/ (모델 임시 저장)
│   ├── models/ (모델 파일들)
│   └── ... (소스 코드 복사본)
├── newsclassifier-models/ (분류기 모델 전용)
└── summarizer-models/ (요약기 모델 전용)
```

## 🔧 개발 환경 설정

### 로컬 개발 실행
```bash
# 뉴스 분류기
cd slm-newsclassifier-inference
pip install -r requirements.txt
python main.py

# 요약기
cd slm-summarizer-inference
pip install -r requirements.txt
python main.py
```

## 🌐 서비스 접근 URL

- **게이트웨이**: http://localhost:8080
- **뉴스 분류기 (직접)**: http://localhost:8087
- **요약기 (직접)**: http://localhost:8088
- **뉴스 분류기 API 문서**: http://localhost:8087/docs
- **요약기 API 문서**: http://localhost:8088/docs

## 🔄 게이트웨이 라우팅

모든 요청은 다음과 같은 패턴으로 라우팅됩니다:
- `GET|POST|PUT|DELETE /api/{service}/{path}`

예시:
- `/api/newsclassifier/predict` → `http://newsclassifier:8087/predict`
- `/api/summarizer/summarize` → `http://summarizer:8088/summarize`

## 🛠️ 환경 변수

Docker Compose에서 자동으로 설정되는 환경 변수들:
- `SERVICE_PORT`: 서비스 포트
- `LOG_LEVEL`: 로그 레벨 (INFO)
- `PYTHONPATH`: Python 경로
- `PYTHONDONTWRITEBYTECODE`: .pyc 파일 생성 방지
- `PYTHONUNBUFFERED`: 출력 버퍼링 비활성화

## 💾 스토리지 설정

### D드라이브 볼륨 매핑
- **소스 코드**: `D:/portfolio-models/slm-*-inference` ↔ 컨테이너 `/app`
- **모델 파일**: Docker 네임드 볼륨으로 D드라이브에 저장
- **offload**: `D:/portfolio-models/slm-summarizer-inference/offload`

### 용량 절약 효과
- PyTorch 모델 파일들 (*.pth, *.pt, *.bin)
- Transformers 캐시
- 학습된 모델 체크포인트
- 임시 추론 파일들

모든 용량이 큰 파일들이 D드라이브에 저장되어 C드라이브 용량을 절약합니다.

## 📊 모니터링

각 서비스의 상태는 헬스체크 엔드포인트를 통해 확인할 수 있습니다:
- `GET /health` (각 서비스)
- 게이트웨이를 통한 접근: `/api/{service}/health` 