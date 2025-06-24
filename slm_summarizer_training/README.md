# 뉴스 요약 모델 학습 서비스 (slm-summarizer-training)

## 개요
QLoRA 기반 Llama-DNA 모델을 사용한 뉴스 요약 모델 학습 마이크로서비스입니다.

## 목적
- **입력**: 2차 필터링을 통과한 중요 뉴스의 `title + description`
- **출력**: 핵심 요약문 생성
- **위치**: 파이프라인에서 2차 필터링 모델 다음 단계

## 모델 정보
- **모델**: `skt/kogpt2-base-v2`
- **학습 방법**: QLoRA (4bit 양자화)
- **하드웨어**: RTX 2080 (8GB VRAM) 최적화
- **특징**: 한국어 생성 모델, 공개 라이센스

## 구조
```
slm-summarizer-training/
├── app/
│   └── train_qlora.py          # QLoRA 학습 메인 코드
├── config.json                 # 서비스 설정
├── main.py                     # FastAPI 앱 실행
├── requirements.txt            # 의존성
├── final_input_output_dataset_filtered.csv  # 학습 데이터
└── README.md
```

## 사용법

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 직접 학습 실행
```bash
cd app
python train_qlora.py
```

### 3. FastAPI 서버 실행
```bash
python main.py
# 또는
uvicorn app.train_qlora:app --host 0.0.0.0 --port 8002
```

## API 엔드포인트
- `GET /`: 서비스 상태 확인
- `GET /status`: 학습 상태 조회
- `POST /train`: 백그라운드 학습 시작

## 학습 설정
- Epochs: 15
- Batch size: 1 (gradient accumulation: 8)
- Max sequence length: 512
- Learning rate: 2e-4
- FP16: True (BF16: False)
- Save steps: 200

## 출력
- 학습된 모델: `./llama_qlora_outputs/`
- 추론 서비스에서 사용 가능 