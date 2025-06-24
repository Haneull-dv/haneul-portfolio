# News Classifier Inference Microservice

MSA 구조에서 뉴스 텍스트 분류 모델의 추론을 담당하는 마이크로서비스입니다.

## 🏗️ 구조 (Layered Architecture)

```
slm-newsclassifier-inference/
├── main.py                          # FastAPI 진입점 (연결 로직만)
├── app/
│   ├── api/
│   │   └── classifier_router.py     # API 엔드포인트 (1개만)
│   ├── model/
│   │   └── prediction_models.py     # 요청/응답 스키마
│   └── domain/
│       ├── controller/
│       │   └── classifier_controller.py  # 서비스 위임 (연결만)
│       └── service/
│           └── classifier_service.py     # 모든 추론 로직
├── utills/
│   └── model_loader.py              # 허깅페이스 모델 로더
├── requirements.txt                 # 의존성 패키지
└── README.md                        # 사용법 안내
```

## 🔄 호출 흐름

```
main.py → app/api/classifier_router.py → app/domain/controller → app/domain/service
```

각 계층의 역할:
- **main.py**: FastAPI 앱 설정 및 라우터 연결만
- **api/router**: HTTP 엔드포인트 정의 (단일 엔드포인트)
- **model**: 요청/응답 스키마 정의
- **controller**: API와 서비스 연결 위임만
- **service**: 모든 추론 로직 (검증, 예측)
- **utills**: 외부 모델 로딩 유틸리티

## 🚀 사용법

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 서버 실행
```bash
python main.py
```

서버가 실행되면 다음 주소에서 접근 가능합니다:
- **API 서버**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 📋 API 엔드포인트

### 단일/배치 텍스트 예측 (통합)
```http
POST /api/v1/predict
Content-Type: application/json

# 단일 텍스트
{
    "text": "엔씨소프트, MMORPG '블레이드앤소울2' 글로벌 출시"
}

# 배치 텍스트
{
    "text": [
        "넥슨, 2분기 역대 최대 실적 기록",
        "비가 오는 날씨에 우산 판매량 증가"
    ]
}
```

**응답:**
```json
{
    "result": {
        "text": "엔씨소프트, MMORPG '블레이드앤소울2' 글로벌 출시",
        "label": 1,
        "confidence": 0.9234
    }
}
```

## 🔧 설정

- 포트: 8000
- 학습된 모델 경로: `../slm-newsclassifier-training/outputs/model`
- CORS: 모든 도메인 허용 (개발환경)

## 📊 라벨 정보

- **0**: 일반 뉴스
- **1**: 중요 뉴스 (게임/금융 관련) 