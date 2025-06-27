# Hugging Face 토큰 설정 가이드

## 문제
Summarizer AI 모델이 Hugging Face에서 `skt/kogpt2-base-v2` 모델을 다운로드할 때 인증 오류가 발생합니다.

## 해결 방법

### 1. Hugging Face 토큰 발급
1. https://huggingface.co 에서 회원가입/로그인
2. 프로필 → Settings → Access Tokens
3. "New token" 클릭
4. 토큰 타입: "Read" 선택
5. 토큰 생성 후 복사

### 2. Docker 컨테이너에 토큰 설정

#### 방법 A: 환경변수로 설정 (임시)
```bash
# 컨테이너 재시작 시 토큰 설정
docker stop summarizer
docker run -d --name summarizer \
  -p 8088:8088 \
  -e HUGGINGFACE_HUB_TOKEN=your_token_here \
  portfolio-summarizer
```

#### 방법 B: Docker Compose 수정 (영구)
docker-compose.yml에 환경변수 추가:
```yaml
services:
  summarizer:
    environment:
      - HUGGINGFACE_HUB_TOKEN=your_token_here
```

#### 방법 C: .env 파일 사용
1. summarizer 디렉토리에 .env 파일 생성
2. `HUGGINGFACE_HUB_TOKEN=your_token_here` 추가
3. 컨테이너 재시작

### 3. 대안: 오프라인 모델 사용
토큰 없이 사용하려면 사전 다운로드된 모델을 사용하거나 
다른 공개 모델로 변경할 수 있습니다. 