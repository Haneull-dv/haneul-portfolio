#!/usr/bin/env python3
"""
모델 로딩 디버깅 스크립트
"""
import os
import sys

print("=== 모델 로딩 디버깅 시작 ===")

# 1. 환경변수 확인
print("📋 환경변수 확인:")
print(f"  HUGGINGFACE_HUB_TOKEN: {repr(os.getenv('HUGGINGFACE_HUB_TOKEN'))}")
print(f"  HUGGINGFACE_TOKEN: {repr(os.getenv('HUGGINGFACE_TOKEN'))}")

# 2. 경로 확인
print("\n📁 경로 확인:")
print(f"  현재 디렉토리: {os.getcwd()}")
print(f"  /app/slm_summarizer_training/outputs 존재: {os.path.exists('/app/slm_summarizer_training/outputs')}")
print(f"  ./outputs 존재: {os.path.exists('./outputs')}")

# 3. GPU 확인
print("\n🎮 GPU 확인:")
try:
    import torch
    print(f"  CUDA 사용 가능: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"  GPU 장치: {torch.cuda.get_device_name(0)}")
except Exception as e:
    print(f"  GPU 확인 실패: {e}")

# 4. 토크나이저 로딩 테스트
print("\n🔤 토크나이저 로딩 테스트:")
try:
    from transformers import AutoTokenizer
    
    # 환경변수 없이 테스트
    print("  1) 환경변수 없이 테스트...")
    tokenizer1 = AutoTokenizer.from_pretrained('skt/kogpt2-base-v2')
    print("    ✅ 성공 (환경변수 없음)")
except Exception as e:
    print(f"    ❌ 실패 (환경변수 없음): {e}")

try:
    # 환경변수 포함 테스트
    print("  2) HUGGINGFACE_HUB_TOKEN 사용...")
    token = os.getenv('HUGGINGFACE_HUB_TOKEN')
    tokenizer2 = AutoTokenizer.from_pretrained('skt/kogpt2-base-v2', token=token)
    print("    ✅ 성공 (HUGGINGFACE_HUB_TOKEN)")
except Exception as e:
    print(f"    ❌ 실패 (HUGGINGFACE_HUB_TOKEN): {e}")

# 5. 실제 predictor 클래스 테스트
print("\n🤖 Predictor 클래스 테스트:")
try:
    sys.path.append('/app')
    from utils.predictor import SummarizerPredictor
    
    print("  Predictor 클래스 생성 중...")
    predictor = SummarizerPredictor()
    print("    ✅ Predictor 생성 성공")
    
    print("  모델 로딩 시도 중...")
    import asyncio
    asyncio.run(predictor.load_model())
    print("    ✅ 모델 로딩 성공")
    
except Exception as e:
    print(f"    ❌ Predictor 테스트 실패: {e}")
    import traceback
    traceback.print_exc()

print("\n=== 디버깅 완료 ===") 