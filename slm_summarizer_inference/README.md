# 뉴스 요약 모델 추론 서비스 (slm-summarizer-inference)

## 개요
QLoRA 기반 학습된 Llama 모델을 사용한 뉴스 요약 추론 마이크로서비스입니다.

## 목적
- **입력**: 2차 필터링을 통과한 중요 뉴스의 `title + description`
- **출력**: AI 생성 핵심 요약문
- **위치**: 파이프라인에서 2차 필터링 모델 다음 단계
- **호출**: Gateway 또는 n8n에서 직접 호출

## 구조
```
slm-summarizer-inference/
├── app/
│   ├── predictor.py            # 모델 추론 로직
│   ├── summarize_router.py     # API 라우터
│   └── __init__.py
├── main.py                     # FastAPI 앱 실행
├── requirements.txt            # 의존성
└── README.md
```

## API 엔드포인트

### 핵심 엔드포인트
- `POST /api/v1/summarize`: 단일 뉴스 요약
- `POST /api/v1/summarize/batch`: 배치 뉴스 요약

### 관리 엔드포인트
- `GET /`: 서비스 상태 확인
- `GET /health`: 헬스 체크
- `GET /api/v1/model/status`: 모델 상태 확인
- `POST /api/v1/model/reload`: 모델 재로딩
- `GET /api/v1/test`: 테스트 요약

## 사용법

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 서비스 실행
```bash
python main.py
# 또는
uvicorn main:app --host 0.0.0.0 --port 8003
```

### 3. API 호출 예시

#### 단일 요약
```bash
curl -X POST "http://localhost:8003/api/v1/summarize" \
     -H "Content-Type: application/json" \
     -d '{
       "news": {
         "title": "삼성전자, 3분기 실적 호조",
         "description": "삼성전자가 3분기 연결기준 매출 67조원, 영업이익 10.8조원을 기록했다고 발표했습니다."
       },
       "max_new_tokens": 100,
       "temperature": 0.7
     }'
```

#### 배치 요약
```bash
curl -X POST "http://localhost:8003/api/v1/summarize/batch" \
     -H "Content-Type: application/json" \
     -d '{
       "news_list": [
         {
           "title": "뉴스 제목 1",
           "description": "뉴스 본문 1"
         },
         {
           "title": "뉴스 제목 2", 
           "description": "뉴스 본문 2"
         }
       ],
       "max_new_tokens": 100,
       "temperature": 0.7
     }'
```

## 응답 형식

### 단일 요약 응답
```json
{
  "title": "삼성전자, 3분기 실적 호조",
  "summary": "삼성전자 3분기 매출 67조원, 영업이익 10.8조원으로 전년 대비 대폭 증가",
  "status": "success"
}
```

### 배치 요약 응답
```json
{
  "results": [
    {
      "title": "뉴스 제목 1",
      "summary": "생성된 요약 1",
      "status": "success"
    }
  ],
  "total_count": 1,
  "success_count": 1,
  "error_count": 0
}
```

## MSA 연동
- **2차 필터링 모델**: `slm-newsclassifier-inference`에서 중요 뉴스 선별 후 전달
- **Gateway/n8n**: 본 서비스를 직접 호출하여 요약 생성
- **포트**: 8003 (다른 서비스와 구분)

## 성능 최적화
- 4bit 양자화로 메모리 효율성 확보 (KoGPT2-base 한국어 모델)
- 싱글톤 패턴으로 모델 로딩 최적화
- 배치 처리 지원으로 처리량 향상 
- RTX 2080 8GB 환경에 최적화된 설정
- 한국어 생성 모델로 요약 성능 최적화 