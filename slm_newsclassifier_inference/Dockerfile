# RTX 2080 GPU 최적화 NewsClassifier Dockerfile
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY . .

# GPU 환경 변수 설정
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV CUDA_VISIBLE_DEVICES=0
ENV TORCH_CUDA_ARCH_LIST="7.5"
ENV FORCE_CUDA=1

# GPU 메모리 최적화
ENV PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# 포트 노출
EXPOSE 8087

# GPU 헬스체크
RUN python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'CUDA Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"None\"}')"

# 애플리케이션 실행
CMD ["python", "main.py"] 