# Docker 루트 디렉토리 D드라이브 이동 가이드

## ⚠️ 현재 상황
- **C드라이브**: 237.91GB 중 7.56GB 여유 (매우 부족!)
- **D드라이브**: 930.88GB 중 894.52GB 여유 (충분함)
- **Docker 이미지**: 16.23GB 사용 중

## 🎯 해결 방법

### 방법 1: Docker Desktop 설정 변경 (권장)

1. **Docker Desktop 실행**
2. **Settings (⚙️) → Resources → Advanced**
3. **"Disk image location" 변경**:
   - 기존: `C:\Users\[username]\AppData\Local\Docker\wsl\data`
   - 새로운: `D:\Docker\wsl\data`
4. **Apply & Restart** 클릭

### 방법 2: WSL2 데이터 이동 (고급)

```powershell
# 1. Docker Desktop 종료
# 2. WSL 종료
wsl --shutdown

# 3. WSL 이미지 익스포트
wsl --export docker-desktop-data D:\docker-desktop-data.tar

# 4. 기존 WSL 인스턴스 삭제
wsl --unregister docker-desktop-data

# 5. 새 위치에 WSL 인스턴스 생성
wsl --import docker-desktop-data D:\Docker\wsl\data D:\docker-desktop-data.tar --version 2

# 6. 임시 파일 삭제
del D:\docker-desktop-data.tar
```

### 방법 3: Dockerfile에서 멀티스테이지 빌드 사용

```dockerfile
# 현재 Dockerfile을 경량화
FROM python:3.11-slim as base
# 필수 패키지만 설치

FROM base as models
# AI 모델 관련 파일들은 D드라이브 볼륨으로 분리

FROM base as runtime
# 실행 환경만 포함
```

## 📊 용량 절약 효과

| 구분 | 변경 전 | 변경 후 |
|------|---------|---------|
| C드라이브 Docker | 16.23GB | 0GB |
| D드라이브 Docker | 0GB | 16.23GB |
| C드라이브 여유공간 | 7.56GB | 23.79GB |

## 🔧 추가 최적화 방법

### Docker 이미지 정리
```bash
# 사용하지 않는 이미지 정리
docker system prune -a

# 빌드 캐시 정리
docker builder prune
```

### 볼륨 최적화
```yaml
# docker-compose.yml에서 불필요한 볼륨 제거
volumes:
  # ❌ 전체 폴더 마운트 (용량 많이 사용)
  - ./slm-summarizer-inference:/app
  
  # ✅ 필요한 파일만 마운트
  - ./slm-summarizer-inference/app:/app/app
  - ./slm-summarizer-inference/main.py:/app/main.py
```

## 🚨 주의사항

1. **Docker Desktop 이동 시 기존 컨테이너/이미지 모두 삭제됨**
2. **이동 후 모든 이미지 재빌드 필요**
3. **D드라이브에 충분한 공간 확보 필요** (최소 50GB 권장)

## ✅ 권장 순서

1. Docker Desktop으로 루트 디렉토리 이동
2. 모든 이미지/컨테이너 재빌드
3. AI 모델 데이터는 D드라이브 유지
4. 정기적인 `docker system prune` 실행 