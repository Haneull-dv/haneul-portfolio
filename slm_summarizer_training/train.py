#!/usr/bin/env python3
"""
뉴스 요약 모델 직접 학습 스크립트
API 서버 없이 바로 QLoRA 학습을 실행
"""
import sys
import os
import asyncio
import logging
import argparse
from datetime import datetime

# 🔧 CUDA 디버깅 설정 (device-side assert 추적)
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"
os.environ["TORCH_USE_CUDA_DSA"] = "1"  # Device-side assertion 활성화
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["TOKENIZERS_PARALLELISM"] = "false"  # tokenizer 경고 제거

# GPU 메모리 디버깅 (선택사항)
# os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512"

print("🔧 CUDA 디버깅 모드 활성화:")
print("   - CUDA_LAUNCH_BLOCKING=1 (동기 실행)")
print("   - TORCH_USE_CUDA_DSA=1 (device assertion)")
print("   - TOKENIZERS_PARALLELISM=false")
print()

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# utils 폴더 import
from utils.model_loader import ModelLoader
from utils.data_loader import DataLoader

# 로깅 설정 (Windows CP949 호환)
import sys
import io

# Windows에서 UTF-8 출력을 위한 설정
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'training_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

class DirectTrainer:
    """직접 학습 실행 클래스"""
    
    def __init__(self):
        self.model_loader = ModelLoader()
        self.data_loader = DataLoader()
    
    async def run_training(self, config):
        """학습 실행"""
        try:
            print("=" * 60)
            print("🎯 뉴스 요약 모델 QLoRA 학습 시작")
            print("=" * 60)
            
            # GPU 정보 출력
            import torch
            if torch.cuda.is_available():
                gpu_name = torch.cuda.get_device_name(0)
                gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                print(f"🖥️  GPU: {gpu_name} ({gpu_memory:.1f}GB)")
            else:
                print("⚠️  GPU 사용 불가 - CPU로 학습 (매우 느림)")
            
            print(f"📊 학습 설정:")
            print(f"   - 에포크: {config['epochs']}")
            print(f"   - 배치 크기: {config['batch_size']}")
            print(f"   - 학습률: {config['learning_rate']}")
            print(f"   - 최대 시퀀스 길이: {config['max_seq_length']}")
            print()
            
            # 1. 모델 및 토크나이저 로드
            print("🔄 1단계: 모델 및 토크나이저 로딩...")
            model, tokenizer = await self.model_loader.load_model_for_training()
            print("✅ 모델 로딩 완료")
            
            # 2. 데이터셋 로드
            print("🔄 2단계: 데이터셋 로딩...")
            train_dataset = await self.data_loader.load_training_dataset(tokenizer, config)
            print("✅ 데이터셋 로딩 완료")
            
            # 3. 학습 설정
            print("🔄 3단계: 학습 설정...")
            trainer = await self.model_loader.setup_trainer(
                model, tokenizer, train_dataset, config
            )
            print("✅ 학습 설정 완료")
            
            # 4. 학습 실행
            print("🔄 4단계: 모델 학습 시작...")
            try:
                total_steps = len(trainer.get_train_dataloader()) * config['epochs']
                print(f"📈 총 스텝 수: {total_steps}")
            except:
                print("📈 학습을 시작합니다...")
            print()
            
            # 🔍 학습 전 최종 안전 검증
            logger.info("🔍 학습 전 최종 안전 검증...")
            
            try:
                # 토크나이저 상태 검증
                assert tokenizer.pad_token is not None, "❌ pad_token이 None입니다"
                assert tokenizer.pad_token_id is not None, "❌ pad_token_id가 None입니다"
                print(f"✅ 토크나이저 검증: pad_token='{tokenizer.pad_token}', pad_token_id={tokenizer.pad_token_id}")
                
                # 모델 상태 검증
                print(f"✅ 모델 디바이스: {next(model.parameters()).device}")
                print(f"✅ 모델 dtype: {next(model.parameters()).dtype}")
                
                # 학습 가능한 파라미터 확인
                trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
                total_params = sum(p.numel() for p in model.parameters())
                print(f"✅ 학습 가능 파라미터: {trainable_params:,} / {total_params:,} ({trainable_params/total_params*100:.2f}%)")
                
                # GPU 메모리 상태 확인
                if torch.cuda.is_available():
                    gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                    gpu_allocated = torch.cuda.memory_allocated(0) / 1024**3
                    gpu_reserved = torch.cuda.memory_reserved(0) / 1024**3
                    print(f"✅ GPU 메모리: {gpu_allocated:.1f}GB 할당 / {gpu_reserved:.1f}GB 예약 / {gpu_memory:.1f}GB 전체")
                    
                    # 메모리 사용량이 너무 높으면 경고
                    if gpu_allocated > gpu_memory * 0.85:
                        print(f"⚠️  GPU 메모리 사용량이 높습니다: {gpu_allocated/gpu_memory*100:.1f}%")
                
            except Exception as e:
                print(f"❌ 학습 전 검증 실패: {e}")
                raise e
            
            print("\n🚀 QLoRA 학습 시작...")
            print("   ※ CUDA_LAUNCH_BLOCKING=1 활성화로 오류 위치 추적 가능")
            print("   ※ device-side assert 발생시 정확한 오류 위치가 표시됩니다")
            print()
            
            # 학습 시작 (강화된 예외 처리)
            try:
                train_result = trainer.train()
                print("✅ 학습 완료!")
                
            except RuntimeError as e:
                error_msg = str(e).lower()
                if "device-side assert" in error_msg or "assertion" in error_msg:
                    print("\n❌ CUDA/device-side assertion 오류 발생!")
                    print("🔧 문제 해결 방법:")
                    print("   1. 위 데이터 검증 로그를 확인하세요")
                    print("   2. vocab_size 초과 토큰이 있는지 확인하세요")
                    print("   3. labels에 -100 외의 이상값이 있는지 확인하세요")
                    print("   4. input_ids/labels 길이가 일치하는지 확인하세요")
                    print("   5. 데이터 전처리 과정을 재검토하세요")
                    print(f"\n🐛 원본 오류 메시지:")
                    print(f"   {e}")
                elif "out of memory" in error_msg or "cuda out of memory" in error_msg:
                    print("\n❌ GPU 메모리 부족 오류!")
                    print("🔧 해결 방법:")
                    print("   1. batch_size를 1로 줄이세요")
                    print("   2. gradient_accumulation_steps를 늘리세요")
                    print("   3. max_seq_length를 줄이세요 (예: 256)")
                    print(f"\n🐛 원본 오류: {e}")
                else:
                    print(f"\n❌ CUDA 런타임 오류: {e}")
                raise e
            except Exception as e:
                print(f"\n❌ 학습 중 예상치 못한 오류: {e}")
                logger.error(f"학습 오류: {e}", exc_info=True)
                raise e
            
            # 5. 모델 저장
            print("\n🔄 5단계: 모델 저장...")
            await self.model_loader.save_trained_model(trainer, tokenizer)
            
            # 학습 결과 출력
            print("\n" + "=" * 60)
            print("🎉 학습 완료!")
            print("=" * 60)
            print(f"📊 학습 결과:")
            print(f"   - 최종 손실: {train_result.training_loss:.4f}")
            print(f"   - 학습 시간: {train_result.metrics.get('train_runtime', 0):.2f}초")
            print(f"   - 초당 샘플: {train_result.metrics.get('train_samples_per_second', 0):.2f}")
            print(f"   - 모델 저장 위치: ./outputs/")
            print("=" * 60)
            
            return train_result
            
        except Exception as e:
            logger.error(f"학습 실패: {str(e)}")
            print(f"\n❌ 학습 실패: {str(e)}")
            raise e

def parse_arguments():
    """명령행 인수 파싱"""
    parser = argparse.ArgumentParser(description="뉴스 요약 모델 QLoRA 학습")
    
    parser.add_argument("--epochs", type=int, default=15, help="학습 에포크 수 (기본값: 15)")
    parser.add_argument("--batch_size", type=int, default=1, help="배치 크기 (기본값: 1)")
    parser.add_argument("--learning_rate", type=float, default=2e-4, help="학습률 (기본값: 2e-4)")
    parser.add_argument("--max_seq_length", type=int, default=512, help="최대 시퀀스 길이 (기본값: 512)")
    parser.add_argument("--data_path", type=str, default="./data/final_input_output_dataset_filtered.csv", 
                       help="데이터셋 경로")
    
    return parser.parse_args()

async def main():
    """메인 실행 함수"""
    try:
        # 명령행 인수 파싱
        args = parse_arguments()
        
        # 데이터 파일 존재 확인
        if not os.path.exists(args.data_path):
            print(f"❌ 데이터 파일을 찾을 수 없습니다: {args.data_path}")
            print("💡 data/ 폴더에 final_input_output_dataset_filtered.csv 파일이 있는지 확인하세요.")
            return
        
        # 학습 설정
        config = {
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "learning_rate": args.learning_rate,
            "max_seq_length": args.max_seq_length,
            "data_path": args.data_path
        }
        
        # 학습 실행
        trainer = DirectTrainer()
        await trainer.run_training(config)
        
    except KeyboardInterrupt:
        print("\n⏹️  사용자에 의해 학습이 중단되었습니다.")
    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        logger.error(f"학습 오류: {str(e)}", exc_info=True)

if __name__ == "__main__":
    print("🚀 뉴스 요약 모델 직접 학습 시작...")
    print("💡 사용법: python train.py --epochs 15 --batch_size 1 --learning_rate 2e-4")
    print()
    
    # 비동기 실행
    asyncio.run(main()) 