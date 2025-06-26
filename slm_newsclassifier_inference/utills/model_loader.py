"""
GPU 최적화 뉴스 분류 모델 로더
RTX 2080 + BERT 최적화
"""
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import os
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self, model_path=None):
        # GPU 강제 설정 (RTX 2080)
        if not torch.cuda.is_available():
            logger.warning("⚠️ CUDA GPU가 감지되지 않았습니다. CPU로 fallback합니다.")
            self.device = "cpu"
        else:
            self.device = "cuda:0"
            torch.cuda.set_device(0)
            logger.info(f"🚀 GPU 환경 초기화: {torch.cuda.get_device_name(0)}")
        
        if model_path is None:
            # 학습된 BERT 분류 모델 경로 (GPU 최적화)
            trained_model_path = "/app/slm_newsclassifier_training/outputs/model"
            if os.path.exists(trained_model_path):
                self.model_path = trained_model_path
                logger.info(f"🎓 학습된 모델 발견: {trained_model_path}")
            else:
                # 폴백: 베이스 모델
                self.model_path = "klue/bert-base"
                logger.warning(f"⚠️ 학습된 모델 없음, 베이스 모델 사용: {self.model_path}")
        else:
            self.model_path = model_path
        
        self.tokenizer = None
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """GPU 최적화 BERT 모델 로딩"""
        try:
            logger.info(f"🔄 GPU 기반 BERT 모델 로딩 시작: {self.model_path}")
            
            # GPU 메모리 정리
            if self.device.startswith("cuda"):
                torch.cuda.empty_cache()
            
            # 토크나이저 로딩 (오프라인 우선 + 안전 모드)
            try:
                # 1차 시도: 오프라인 모드
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_path,
                    local_files_only=True
                )
                logger.info(f"✅ 오프라인 토크나이저 로딩 성공")
            except:
                # 2차 시도: 온라인 모드 (인증 없이)
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_path,
                    local_files_only=False,
                    trust_remote_code=True
                )
                logger.info(f"✅ 온라인 토크나이저 로딩 성공")
            
            # GPU 최적화 BERT 모델 로딩
            if self.device.startswith("cuda"):
                try:
                    # 1차 시도: 오프라인 모드
                    self.model = AutoModelForSequenceClassification.from_pretrained(
                        self.model_path,
                        torch_dtype=torch.float16,
                        local_files_only=True
                    ).to(self.device)
                    logger.info(f"✅ 오프라인 GPU 모델 로딩 성공")
                except:
                    # 2차 시도: 온라인 모드 (인증 없이)
                    self.model = AutoModelForSequenceClassification.from_pretrained(
                        self.model_path,
                        torch_dtype=torch.float16,
                        local_files_only=False,
                        trust_remote_code=True
                    ).to(self.device)
                    logger.info(f"✅ 온라인 GPU 모델 로딩 성공")
                
                # GPU 메모리 상태 확인
                memory_allocated = torch.cuda.memory_allocated(0) / 1e9
                logger.info(f"🎯 GPU 메모리 사용량: {memory_allocated:.2f}GB")
            else:
                # CPU fallback
                try:
                    self.model = AutoModelForSequenceClassification.from_pretrained(
                        self.model_path,
                        local_files_only=True
                    )
                except:
                    self.model = AutoModelForSequenceClassification.from_pretrained(
                        self.model_path,
                        local_files_only=False,
                        trust_remote_code=True
                    )
            
            # 추론 모드 설정
            self.model.eval()
            
            logger.info(f"✅ BERT 모델 로딩 완료: {self.model_path} ({self.device})")
            
        except Exception as e:
            logger.error(f"❌ BERT 모델 로딩 실패: {e}")
            raise e
    
    def get_model(self):
        """모델 반환"""
        return self.model
    
    def get_tokenizer(self):
        """토크나이저 반환"""
        return self.tokenizer
    
    def get_device(self):
        """디바이스 반환"""
        return self.device
    
    def predict(self, texts, max_length=512):
        """GPU 최적화 배치 예측"""
        if not isinstance(texts, list):
            texts = [texts]
        
        try:
            # GPU 토크나이징
            inputs = self.tokenizer(
                texts,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=max_length
            )
            
            # GPU로 이동
            if self.device.startswith("cuda"):
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # GPU 추론
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
                
                # CPU로 결과 이동
                predictions = predictions.cpu()
            
            # GPU 메모리 정리
            if self.device.startswith("cuda"):
                del inputs, outputs
                torch.cuda.empty_cache()
            
            return predictions
            
        except Exception as e:
            logger.error(f"❌ GPU 예측 실패: {e}")
            # GPU 메모리 정리 (에러 시에도)
            if self.device.startswith("cuda"):
                torch.cuda.empty_cache()
            raise e
    
    def get_gpu_memory_info(self):
        """GPU 메모리 정보 반환"""
        if self.device.startswith("cuda"):
            return {
                "allocated": torch.cuda.memory_allocated(0) / 1e9,
                "reserved": torch.cuda.memory_reserved(0) / 1e9,
                "total": torch.cuda.get_device_properties(0).total_memory / 1e9
            }
        return {"message": "CPU 모드에서 실행 중"} 