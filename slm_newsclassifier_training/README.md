# News Classifier Training Microservice

MSA 구조에서 뉴스 텍스트 분류 모델의 학습을 담당하는 마이크로서비스입니다.

## 🏗️ 구조 (Layered Architecture)

```
slm-newsclassifier-training/
├── main.py                          # FastAPI 진입점 (연결 로직만)
├── app/
│   ├── api/
│   │   └── training_router.py       # API 엔드포인트 (1개만)
│   ├── model/
│   │   └── training_models.py       # 요청/응답 스키마
│   └── domain/
│       ├── controller/
│       │   └── trainer_controller.py     # 서비스 위임 (연결만)
│       └── service/
│           └── trainer_service.py        # 모든 학습 로직
├── utills/
│   ├── model_builder.py             # 커스텀 모델 빌더
│   └── data_loader.py               # 데이터 로딩 유틸리티
├── data/                            # 학습 데이터
├── outputs/                         # 학습된 모델 저장소
├── train.py                         # 기존 학습 스크립트 (호환성)
├── config.json                      # 설정 파일
├── requirements.txt                 # 의존성 패키지
└── README.md                        # 사용법 안내
```

## 🔄 호출 흐름

```
main.py → app/api/training_router.py → app/domain/controller → app/domain/service
```

각 계층의 역할:
- **main.py**: FastAPI 앱 설정 및 라우터 연결만
- **api/router**: HTTP 엔드포인트 정의 (단일 엔드포인트)
- **model**: 요청/응답 스키마 정의
- **controller**: API와 서비스 연결 위임만
- **service**: 모든 학습 로직 (검증, 설정, 학습, 저장)
- **utills**: 모델 빌딩 및 데이터 로딩 유틸리티

## 🚀 사용법

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. API 서버 실행
```bash
python main.py
```

서버가 실행되면 다음 주소에서 접근 가능합니다:
- **API 서버**: http://localhost:8001
- **API 문서**: http://localhost:8001/docs

### 3. 기존 방식 (호환성)
```bash
python train.py
```

## 📋 API 엔드포인트

### 모델 학습 실행
```http
POST /api/v1/train
Content-Type: application/json

{
    "data_path": "data/news_classifier_dataset.csv",
    "output_dir": "./outputs",
    "model_name": "klue/bert-base",
    "epochs": 3,
    "batch_size": 8,
    "learning_rate": 2e-5
}
```

**응답:**
```json
{
    "status": "success",
    "message": "학습이 성공적으로 완료되었습니다.",
    "output_path": "./outputs/model"
}
```

## 📋 주요 기능

- **TrainerService**: 모든 학습 로직 집중 (검증, 설정, 학습, 저장)
- **TrainerController**: API와 서비스 연결 위임
- **ModelBuilder**: 커스텀 BERT 모델 생성 (신뢰도 기반 손실 함수)
- **DataLoader**: 데이터 로딩 및 전처리 유틸리티
- **REST API**: HTTP 기반 학습 요청/응답

## 🔧 설정 옵션

- `data_path`: 학습 데이터 파일 경로 (기본값: data/news_classifier_dataset.csv)
- `output_dir`: 모델 출력 디렉토리 (기본값: ./outputs)
- `model_name`: 기본 모델 이름 (기본값: klue/bert-base)
- `epochs`: 학습 에포크 수 (기본값: 3)
- `batch_size`: 배치 크기 (기본값: 8)
- `learning_rate`: 학습률 (기본값: 2e-5)

## 📊 출력

학습 완료 후 `outputs/model/` 디렉토리에 다음 파일들이 저장됩니다:
- `config.json`: 모델 설정
- `model.safetensors`: 학습된 모델 가중치
- `tokenizer.json`: 토크나이저 설정
- 기타 필요한 모델 파일들 