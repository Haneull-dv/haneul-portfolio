"""
뉴스 요약 모델 예측기 유틸리티
QLoRA 기반 모델 로딩 및 추론 처리
"""
import os
import gc
import torch
import logging
from typing import Optional
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    GPT2Tokenizer,
    BitsAndBytesConfig
)
from peft import PeftModel

logger = logging.getLogger(__name__)

class SummarizerPredictor:
    """요약 모델 예측기"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.base_model_name = "skt/kogpt2-base-v2"  # KoGPT2 한국어 생성 모델 (RTX 2080 호환)
        self.model_path = "./outputs"  # 학습된 모델 경로
        
    async def load_model(self):
        """모델 및 토크나이저 로드"""
        try:
            logger.info("Loading model and tokenizer...")
            
            # GPU 메모리 정리
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # 오프로드 폴더 생성
            os.makedirs("./offload", exist_ok=True)
            
            # KoGPT2-base 추론용 4bit 양자화 설정
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16,  # fp16 사용
                bnb_4bit_quant_storage=torch.uint8
            )
            
            # KoGPT2 전용 토크나이저 로딩 (추론용)
            logger.info("Loading KoGPT2 tokenizer for inference...")
            
            try:
                # 1차 시도: GPT2Tokenizer 직접 사용 (가장 안전)
                logger.info("Trying GPT2Tokenizer directly for inference...")
                self.tokenizer = GPT2Tokenizer.from_pretrained(
                    self.base_model_name,
                    use_fast=False
                )
                logger.info("✅ GPT2Tokenizer 추론용 로딩 성공")
                
            except Exception as e1:
                logger.warning(f"GPT2Tokenizer 실패: {e1}")
                
                try:
                    # 2차 시도: AutoTokenizer with explicit settings
                    logger.info("Trying AutoTokenizer for inference...")
                    self.tokenizer = AutoTokenizer.from_pretrained(
                        self.base_model_name,
                        trust_remote_code=True,
                        use_fast=False,
                        tokenizer_type="gpt2"
                    )
                    logger.info("✅ AutoTokenizer 추론용 로딩 성공")
                    
                except Exception as e2:
                    logger.warning(f"AutoTokenizer도 실패: {e2}")
                    
                    try:
                        # 3차 시도: 기본 설정
                        logger.info("Trying basic AutoTokenizer for inference...")
                        self.tokenizer = AutoTokenizer.from_pretrained(self.base_model_name)
                        logger.info("✅ 기본 AutoTokenizer 추론용 로딩 성공")
                        
                    except Exception as e3:
                        logger.error(f"모든 tokenizer 로딩 방법 실패: {e3}")
                        raise e3
            
            # KoGPT2 추론용 토크나이저 필수 설정
            logger.info("Configuring KoGPT2 tokenizer for inference...")
            
            # 1. 패딩 토큰 설정 (필수!)
            if not hasattr(self.tokenizer, 'pad_token') or self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                self.tokenizer.pad_token_id = self.tokenizer.eos_token_id
                logger.info(f"추론용 pad_token 설정: {self.tokenizer.pad_token} (id: {self.tokenizer.pad_token_id})")
            
            # 2. 최대 길이 설정
            if not hasattr(self.tokenizer, 'model_max_length') or self.tokenizer.model_max_length > 512:
                self.tokenizer.model_max_length = 512
            
            # 3. 추론용 패딩 방향 설정
            self.tokenizer.padding_side = "left"  # 추론 시 left padding (배치 처리에 적합)
            self.tokenizer.truncation_side = "left"  # 입력이 길면 앞부분 자르기
            
            # 4. 추가 안전 설정
            if hasattr(self.tokenizer, 'add_eos_token'):
                self.tokenizer.add_eos_token = True
            
            # 설정 확인 및 로깅
            vocab_size = getattr(self.tokenizer, 'vocab_size', 'Unknown')
            logger.info(f"✅ KoGPT2 추론용 Tokenizer 설정 완료:")
            logger.info(f"   - vocab_size: {vocab_size}")
            logger.info(f"   - model_max_length: {self.tokenizer.model_max_length}")
            logger.info(f"   - pad_token: '{self.tokenizer.pad_token}' (id: {self.tokenizer.pad_token_id})")
            logger.info(f"   - eos_token: '{self.tokenizer.eos_token}' (id: {self.tokenizer.eos_token_id})")
            logger.info(f"   - padding_side: {self.tokenizer.padding_side}")
            
            # KoGPT2-base 추론용 device_map 설정
            device_map = "auto"  # KoGPT2-base는 GPU에 전체 로드 가능
            
            logger.info("Using auto device_map for KoGPT2-base inference (GPU-only)")
            
            # 베이스 모델 로드 (KoGPT2 최적화)
            try:
                base_model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    quantization_config=bnb_config,
                    device_map=device_map,
                    trust_remote_code=True,
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True,
                    max_memory={0: "6GB"},  # KoGPT2는 더 작으므로 6GB로 제한
                    use_cache=True,  # 추론 시 cache 활성화 (속도 향상)
                    attn_implementation="eager"  # FlashAttention 오류 방지
                )
            except Exception as e:
                logger.error(f"모델 로딩 실패, 대체 설정 시도: {e}")
                base_model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    quantization_config=bnb_config,
                    device_map="auto",
                    trust_remote_code=True,
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True
                )
            
            # 학습된 LoRA 어댑터가 있다면 로드
            if os.path.exists(self.model_path) and os.path.exists(os.path.join(self.model_path, "adapter_config.json")):
                logger.info(f"Loading trained LoRA adapter from {self.model_path}")
                self.model = PeftModel.from_pretrained(base_model, self.model_path)
            else:
                logger.warning(f"No trained adapter found at {self.model_path}, using base model")
                self.model = base_model
            
            # gradient_checkpointing 비활성화 (추론 시 불필요하고 충돌 방지)
            if hasattr(self.model, 'gradient_checkpointing_disable'):
                self.model.gradient_checkpointing_disable()
                logger.info("Gradient checkpointing disabled for inference")
            
            self.model.eval()
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise e
    
    async def generate_summary(
        self,
        title: str,
        description: str,
        max_new_tokens: int = 150,
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> str:
        """요약 생성"""
        try:
            if self.model is None or self.tokenizer is None:
                raise ValueError("Model not loaded")
            
            # 프롬프트 구성
            prompt = self._create_prompt(title, description)
            
            # 토크나이징
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            
            # GPU에 있는 부분만 GPU로 이동 (bf16 호환)
            if torch.cuda.is_available():
                inputs = {k: v.to("cuda:0") if v.dtype not in [torch.bool] else v for k, v in inputs.items()}
            
            # 생성
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1,
                    use_cache=True  # 추론 속도 향상
                )
            
            # 디코딩
            generated_text = self.tokenizer.decode(
                outputs[0][inputs["input_ids"].shape[1]:],
                skip_special_tokens=True
            ).strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Failed to generate summary: {str(e)}")
            raise e
    
    async def generate_with_custom_prompt(
        self,
        custom_prompt: str,
        max_new_tokens: int = 150,
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> str:
        """커스텀 프롬프트로 텍스트 생성"""
        try:
            if self.model is None or self.tokenizer is None:
                raise ValueError("Model not loaded")
            
            # 토크나이징
            inputs = self.tokenizer(
                custom_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            )
            
            # GPU에 있는 부분만 GPU로 이동 (bf16 호환)
            if torch.cuda.is_available():
                inputs = {k: v.to("cuda:0") if v.dtype not in [torch.bool] else v for k, v in inputs.items()}
            
            # 생성
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1,
                    use_cache=True  # 추론 속도 향상
                )
            
            # 디코딩
            generated_text = self.tokenizer.decode(
                outputs[0][inputs["input_ids"].shape[1]:],
                skip_special_tokens=True
            ).strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Failed to generate with custom prompt: {str(e)}")
            raise e
    
    def _create_prompt(self, title: str, description: str) -> str:
        """요약 생성을 위한 프롬프트 생성 (학습용과 동일한 형식)"""
        input_text = f"{title} {description}".strip()
        return f"""다음 뉴스를 한국어로 간결하게 요약해주세요.

입력: {input_text}

요약:"""
    
    def unload_model(self):
        """모델 언로드 및 메모리 정리"""
        try:
            if self.model:
                del self.model
                self.model = None
            
            if self.tokenizer:
                del self.tokenizer
                self.tokenizer = None
            
            # 메모리 정리
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info("Model unloaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to unload model: {str(e)}")
    
    def get_model_info(self) -> Optional[str]:
        """모델 정보 반환"""
        if self.model is None:
            return None
        
        return f"{self.base_model_name} with LoRA adapter"
    
    @property
    def is_loaded(self) -> bool:
        """모델 로드 상태 확인"""
        return self.model is not None and self.tokenizer is not None 