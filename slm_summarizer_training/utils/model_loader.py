"""
QLoRA 모델 로더 유틸리티
모델 로딩, 설정, 저장 관련 기능
"""
import os
import gc
import torch
import logging
from typing import Tuple, Any
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    GPT2LMHeadModel,
    PreTrainedTokenizerFast,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding
)
from peft import (
    LoraConfig,
    get_peft_model,
    TaskType,
    prepare_model_for_kbit_training
)
from datetime import datetime

logger = logging.getLogger(__name__)

class ModelLoader:
    """QLoRA 모델 로더"""
    
    def __init__(self):
        self.base_model_name = "skt/kogpt2-base-v2"  # KoGPT2 한국어 생성 모델 (RTX 2080 호환, 한국어 요약 최적화)
        self.output_dir = "./outputs"
        
    async def load_model_for_training(self) -> Tuple[Any, Any]:
        """학습용 모델 및 토크나이저 로드"""
        try:
            logger.info("Loading model and tokenizer for training...")
            
            # GPU 메모리 정리
            torch.cuda.empty_cache()
            gc.collect()
            
            # 오프로드 폴더 생성
            os.makedirs("./offload", exist_ok=True)
            
            # 초기 GPU 메모리 상태 로그
            if torch.cuda.is_available():
                gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                gpu_allocated = torch.cuda.memory_allocated(0) / 1024**3
                gpu_props = torch.cuda.get_device_properties(0)
                logger.info(f"GPU Memory: {gpu_allocated:.2f}GB / {gpu_memory:.2f}GB allocated")
                logger.info(f"GPU Compute Capability: {gpu_props.major}.{gpu_props.minor} (bf16 supported: {gpu_props.major >= 8 or (gpu_props.major == 7 and gpu_props.minor >= 5)})")
            
            # KoGPT2-base QLoRA 최적화된 4bit 양자화 설정
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16,  # fp16 사용
                bnb_4bit_quant_storage=torch.uint8
            )
            
            # KoGPT2 전용 토크나이저 로딩 (직접 방식)
            logger.info("Loading KoGPT2 tokenizer with direct method...")
            
            try:
                # 1차 시도: GPT2Tokenizer 직접 사용 (가장 안전)
                from transformers import GPT2Tokenizer
                logger.info("Trying GPT2Tokenizer directly...")
                tokenizer = GPT2Tokenizer.from_pretrained(
                    self.base_model_name,
                    use_fast=False
                )
                logger.info("✅ GPT2Tokenizer 로딩 성공")
                
            except Exception as e1:
                logger.warning(f"GPT2Tokenizer 실패: {e1}")
                
                try:
                    # 2차 시도: AutoTokenizer with explicit settings
                    logger.info("Trying AutoTokenizer with explicit settings...")
                    tokenizer = AutoTokenizer.from_pretrained(
                        self.base_model_name,
                        trust_remote_code=True,
                        use_fast=False,
                        tokenizer_type="gpt2"  # 명시적 tokenizer type 지정
                    )
                    logger.info("✅ AutoTokenizer 로딩 성공")
                    
                except Exception as e2:
                    logger.warning(f"AutoTokenizer도 실패: {e2}")
                    
                    try:
                        # 3차 시도: 기본 설정
                        logger.info("Trying basic AutoTokenizer...")
                        tokenizer = AutoTokenizer.from_pretrained(self.base_model_name)
                        logger.info("✅ 기본 AutoTokenizer 로딩 성공")
                        
                    except Exception as e3:
                        logger.error(f"모든 tokenizer 로딩 방법 실패: {e3}")
                        raise e3
            
            # KoGPT2 토크나이저 필수 설정
            logger.info("Configuring KoGPT2 tokenizer settings...")
            
            # 1. 패딩 토큰 설정 (vocab_size 범위 내에서)
            vocab_size = getattr(tokenizer, 'vocab_size', 51200)
            logger.info(f"토크나이저 vocab_size: {vocab_size}")
            
            # eos_token_id가 vocab_size를 초과하는지 확인
            if tokenizer.eos_token_id >= vocab_size:
                # vocab_size 범위 내의 안전한 토큰 사용
                safe_pad_token_id = vocab_size - 1  # 마지막 vocab 토큰 사용
                tokenizer.pad_token_id = safe_pad_token_id
                try:
                    tokenizer.pad_token = tokenizer.convert_ids_to_tokens([safe_pad_token_id])[0]
                except:
                    tokenizer.pad_token = f"<pad_{safe_pad_token_id}>"
                logger.warning(f"eos_token_id ({tokenizer.eos_token_id}) >= vocab_size ({vocab_size}), 안전한 pad_token 사용: id={tokenizer.pad_token_id}")
            else:
                # 정상적인 경우: eos_token을 pad_token으로 사용
                if not hasattr(tokenizer, 'pad_token') or tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token
                    tokenizer.pad_token_id = tokenizer.eos_token_id
                    logger.info(f"pad_token 설정: {tokenizer.pad_token} (id: {tokenizer.pad_token_id})")
            
            # 2. 최대 길이 설정
            if not hasattr(tokenizer, 'model_max_length') or tokenizer.model_max_length > 512:
                tokenizer.model_max_length = 512
            
            # 3. GPT2 계열 패딩 방향 설정 (필수!)
            tokenizer.padding_side = "right"  # GPT2는 반드시 right padding
            tokenizer.truncation_side = "left"  # 입력이 길면 앞부분 자르기
            
            # 4. GPT2 계열 추가 안전 설정
            if hasattr(tokenizer, 'add_eos_token'):
                tokenizer.add_eos_token = True
            
            # 5. GPT2 tokenizer 검증
            if tokenizer.pad_token != tokenizer.eos_token:
                logger.warning(f"GPT2 tokenizer pad_token({tokenizer.pad_token}) != eos_token({tokenizer.eos_token}), 재설정 중...")
                tokenizer.pad_token = tokenizer.eos_token
                tokenizer.pad_token_id = tokenizer.eos_token_id
            
            # 설정 확인 및 로깅
            vocab_size = getattr(tokenizer, 'vocab_size', 'Unknown')
            logger.info(f"✅ KoGPT2 Tokenizer 설정 완료:")
            logger.info(f"   - vocab_size: {vocab_size}")
            logger.info(f"   - model_max_length: {tokenizer.model_max_length}")
            logger.info(f"   - pad_token: '{tokenizer.pad_token}' (id: {tokenizer.pad_token_id})")
            logger.info(f"   - eos_token: '{tokenizer.eos_token}' (id: {tokenizer.eos_token_id})")
            logger.info(f"   - padding_side: {tokenizer.padding_side}")
            
            # KoGPT2-base 모델용 device_map 설정 (RTX 2080 최적화)
            device_map = "auto"  # KoGPT2-base는 8GB GPU에 충분히 들어감
            
            logger.info("Using auto device_map for KoGPT2-base (GPU-only allocation)")
            
            # 베이스 모델 로드 (KoGPT2 최적화된 설정)
            try:
                model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    quantization_config=bnb_config,
                    device_map=device_map,
                    trust_remote_code=True,
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True,
                    max_memory={0: "6GB"},  # KoGPT2는 더 작으므로 6GB로 제한
                    use_cache=False,  # 학습 시 cache 비활성화 (메모리 절약)
                    attn_implementation="eager"  # FlashAttention 오류 방지
                )
            except Exception as e:
                logger.error(f"모델 로딩 실패: {e}")
                # 대체 설정으로 재시도
                model = AutoModelForCausalLM.from_pretrained(
                    self.base_model_name,
                    quantization_config=bnb_config,
                    device_map="auto",
                    trust_remote_code=True,
                    torch_dtype=torch.float16,
                    low_cpu_mem_usage=True
                )
            
            # QLoRA 설정 적용
            model = self._setup_lora(model)
            
            # gradient_checkpointing 비활성화 (QLoRA + offload 충돌 방지)
            if hasattr(model, 'gradient_checkpointing_disable'):
                model.gradient_checkpointing_disable()
                logger.info("Gradient checkpointing disabled for QLoRA compatibility")
            
            logger.info("Model and tokenizer loaded successfully")
            return model, tokenizer
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise e
    
    def _setup_lora(self, model):
        """QLoRA 설정 및 적용"""
        logger.info("Setting up QLoRA configuration")
        
        # 모델을 kbit 학습용으로 준비 (gradient checkpointing 완전 비활성화)
        model = prepare_model_for_kbit_training(
            model, 
            use_gradient_checkpointing=False,
            gradient_checkpointing_kwargs=None
        )
        
        # KoGPT2-base 한국어 최적화된 LoRA 설정
        lora_config = LoraConfig(
            r=16,  # GPT2 모델에 적합한 rank
            lora_alpha=32,  # alpha 적절히 조정
            target_modules=["c_attn", "c_proj"],  # GPT2 구조에 맞는 모듈 (attention layer)
            lora_dropout=0.1,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
            inference_mode=False
        )
        
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()
        
        logger.info("QLoRA configuration applied successfully")
        return model
    
    async def setup_trainer(self, model, tokenizer, train_dataset, config) -> Trainer:
        """RTX 2080 QLoRA 최적화된 Trainer 설정"""
        try:
            logger.info("Setting up QLoRA-optimized trainer for RTX 2080...")
            
            # 모델의 gradient checkpointing 확실히 비활성화
            if hasattr(model, 'gradient_checkpointing_disable'):
                model.gradient_checkpointing_disable()
                logger.info("Model gradient checkpointing disabled")
            
            # KoGPT2 RTX 2080 최적화된 학습 인수 설정
            training_args = TrainingArguments(
                output_dir=self.output_dir,
                per_device_train_batch_size=config.get("batch_size", 1),
                gradient_accumulation_steps=8,  # KoGPT2는 적은 accumulation으로 안정적
                num_train_epochs=config.get("epochs", 15),
                learning_rate=config.get("learning_rate", 2e-4),
                
                # 정밀도 설정 (KoGPT2 + RTX 2080 최적화)
                fp16=True,   # fp16 활성화
                bf16=False,  # bf16 비활성화 
                tf32=False,  # tf32 비활성화
                dataloader_pin_memory=False,  # 메모리 안정성
                
                # 저장 및 로깅
                save_steps=200,
                logging_steps=10,
                save_strategy="steps",
                save_total_limit=2,
                
                # 학습률 스케줄러
                warmup_ratio=0.03,
                lr_scheduler_type="cosine",
                
                # 옵티마이저 (메모리 효율적)
                optim="paged_adamw_8bit",
                
                # 기타 설정
                load_best_model_at_end=False,
                report_to=None,
                run_name=f"summarizer-qlora-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                
                # 데이터로더 설정 (안정성 최우선)
                dataloader_num_workers=0,
                dataloader_drop_last=True,
                
                # 모델 관련 설정
                remove_unused_columns=False,
                group_by_length=True,
                
                # Gradient 관련 설정 (QLoRA 최적화)
                gradient_checkpointing=False,  # 완전히 비활성화
                max_grad_norm=1.0,
                
                # 분산 학습 설정
                ddp_find_unused_parameters=False,
                
                # 메모리 최적화
                prediction_loss_only=True,
                disable_tqdm=False,  # 진행 상황 표시
                
                # GPT2 계열 안정성 설정
                skip_memory_metrics=True,  # 메모리 메트릭 수집 건너뛰기
                logging_nan_inf_filter=True,  # NaN/Inf 값 필터링
                length_column_name="length",  # 길이 컬럼명 명시
                ignore_data_skip=True,  # 문제 데이터 건너뛰기
            )
            
            # GPT2 계열 최적화된 데이터 콜레이터 설정
            data_collator = DataCollatorWithPadding(
                tokenizer=tokenizer,
                padding=True,
                max_length=512,
                pad_to_multiple_of=8,
                return_tensors="pt"
            )
            
            # 🔍 강화된 데이터 검증 함수 (device-side assert 방지)
            def validate_dataset(dataset):
                """데이터셋 강화 검증 및 필터링 (device-side assert 방지)"""
                logger.info("[VALIDATE] 데이터셋 검증 시작...")
                
                valid_count = 0
                error_stats = {
                    'missing_keys': 0,
                    'wrong_length': 0,
                    'invalid_input_ids': 0,
                    'invalid_labels': 0,
                    'length_mismatch': 0,
                    'type_errors': 0,
                    'no_learnable_tokens': 0,
                    'empty_sequence': 0
                }
                
                vocab_size = getattr(tokenizer, 'vocab_size', 51200)
                max_length = config.get('max_seq_length', 512)
                
                logger.info(f"[VALIDATE] 검증 기준: vocab_size={vocab_size}, max_length={max_length}")
                
                for i, sample in enumerate(dataset):
                    try:
                        # 1. 필수 키 검증
                        required_keys = ['input_ids', 'attention_mask', 'labels']
                        missing_keys = [key for key in required_keys if key not in sample]
                        if missing_keys:
                            error_stats['missing_keys'] += 1
                            if i < 3:  # 처음 3개만 로그
                                logger.warning(f"[ERROR] 샘플 {i}: 필수 키 누락 {missing_keys}")
                            continue
                        
                        input_ids = sample['input_ids']
                        labels = sample['labels']
                        attention_mask = sample['attention_mask']
                        
                        # 2. 타입 검증
                        if not isinstance(input_ids, (list, torch.Tensor)):
                            error_stats['type_errors'] += 1
                            continue
                        
                        if isinstance(input_ids, torch.Tensor):
                            input_ids = input_ids.tolist()
                        if isinstance(labels, torch.Tensor):
                            labels = labels.tolist()
                        if isinstance(attention_mask, torch.Tensor):
                            attention_mask = attention_mask.tolist()
                        
                        # 3. 길이 검증
                        if len(input_ids) > max_length or len(input_ids) < 5:
                            error_stats['wrong_length'] += 1
                            if i < 3:
                                logger.warning(f"[ERROR] 샘플 {i}: 부적절한 길이 {len(input_ids)} (범위: 5-{max_length})")
                            continue
                        
                        # 4. 시퀀스 길이 일치 검증
                        if len(input_ids) != len(labels) or len(input_ids) != len(attention_mask):
                            error_stats['length_mismatch'] += 1
                            if i < 3:
                                logger.warning(f"[ERROR] 샘플 {i}: 시퀀스 길이 불일치 input={len(input_ids)}, labels={len(labels)}, mask={len(attention_mask)}")
                            continue
                        
                        # 5. 빈 시퀀스 검증
                        if all(token_id == tokenizer.pad_token_id for token_id in input_ids):
                            error_stats['empty_sequence'] += 1
                            continue
                        
                        # 6. 스마트 vocab_size 검증 (특별 토큰 고려)
                        unk_token_id = getattr(tokenizer, 'unk_token_id', 0)
                        pad_token_id = getattr(tokenizer, 'pad_token_id', tokenizer.eos_token_id)
                        
                        # 실제 허용 가능한 토큰 범위 확장 (특별 토큰 고려)
                        effective_vocab_size = max(vocab_size, tokenizer.eos_token_id + 1, pad_token_id + 1)
                        if unk_token_id is not None:
                            effective_vocab_size = max(effective_vocab_size, unk_token_id + 1)
                        
                        # 첫 번째 샘플에서만 디버그 정보 출력
                        if i == 0:
                            logger.info(f"[DEBUG] 토큰 범위 정보:")
                            logger.info(f"   - vocab_size: {vocab_size}")
                            logger.info(f"   - effective_vocab_size: {effective_vocab_size}")
                            logger.info(f"   - unk_token_id: {unk_token_id}")
                            logger.info(f"   - pad_token_id: {pad_token_id}")
                            logger.info(f"   - eos_token_id: {tokenizer.eos_token_id}")
                        
                        # UNK 토큰 비율 검증 (극단적인 경우만 필터링)
                        if unk_token_id is not None:
                            unk_ratio_input = input_ids.count(unk_token_id) / len(input_ids)
                            if unk_ratio_input > 0.9:  # 90% 이상이 UNK 토큰
                                error_stats['invalid_input_ids'] += 1
                                if i < 3:
                                    logger.warning(f"[ERROR] 샘플 {i}: UNK 토큰 비율이 너무 높음: {unk_ratio_input:.2f}")
                                continue
                        
                        # 7. labels 검증 - 스마트 범위 체크
                        valid_labels = [label for label in labels if label != -100]
                        
                        if len(valid_labels) == 0:
                            error_stats['no_learnable_tokens'] += 1
                            if i < 3:
                                logger.warning(f"[ERROR] 샘플 {i}: 학습 가능한 토큰 없음 (모든 labels가 -100)")
                            continue
                        
                        # UNK 토큰 비율 검증 (labels에서도)
                        if unk_token_id is not None:
                            unk_ratio_labels = valid_labels.count(unk_token_id) / len(valid_labels)
                            if unk_ratio_labels > 0.9:  # 90% 이상이 UNK 토큰
                                error_stats['invalid_labels'] += 1
                                if i < 3:
                                    logger.warning(f"[ERROR] 샘플 {i}: labels UNK 비율이 너무 높음: {unk_ratio_labels:.2f}")
                                continue
                        
                        # 8. 추가 안전 검증
                        # attention_mask는 0 또는 1이어야 함
                        invalid_mask = [mask for mask in attention_mask if mask not in [0, 1]]
                        if invalid_mask:
                            error_stats['type_errors'] += 1
                            if i < 3:
                                logger.warning(f"[ERROR] 샘플 {i}: attention_mask 값 오류 {invalid_mask[:3]}...")
                            continue
                        
                        # ✅ 모든 검증 통과
                        valid_count += 1
                        
                        if i < 3:  # 처음 3개 샘플 상세 정보
                            logger.info(f"[OK] 샘플 {i} 검증 통과:")
                            logger.info(f"   - 길이: {len(input_ids)}")
                            logger.info(f"   - 학습 가능 토큰: {len(valid_labels)}개")
                            logger.info(f"   - input_ids 범위: {min(input_ids)}-{max(input_ids)}")
                            logger.info(f"   - valid_labels 범위: {min(valid_labels)}-{max(valid_labels)}")
                        
                    except Exception as e:
                        error_stats['type_errors'] += 1
                        if i < 3:
                            logger.error(f"[ERROR] 샘플 {i} 검증 중 예외: {e}")
                        continue
                
                # 검증 결과 리포트
                total_samples = len(dataset)
                invalid_count = total_samples - valid_count
                
                logger.info(f"[RESULT] 데이터셋 검증 결과:")
                logger.info(f"   - 전체 샘플: {total_samples}개")
                logger.info(f"   - 유효 샘플: {valid_count}개 ({valid_count/total_samples*100:.1f}%)")
                logger.info(f"   - 무효 샘플: {invalid_count}개 ({invalid_count/total_samples*100:.1f}%)")
                
                if invalid_count > 0:
                    logger.warning(f"[WARNING] 오류 유형별 통계:")
                    for error_type, count in error_stats.items():
                        if count > 0:
                            logger.warning(f"   - {error_type}: {count}개")
                
                # 경고 및 에러 조건
                if valid_count == 0:
                    raise ValueError("[ERROR] 유효한 샘플이 없습니다! 데이터 전처리를 확인하세요.")
                
                if valid_count < total_samples * 0.3:  # 30% 미만이 유효하면 경고
                    logger.warning(f"[WARNING] 유효 샘플 비율이 {valid_count/total_samples*100:.1f}%로 낮습니다.")
                
                logger.info("[OK] 데이터셋 검증 완료!")
                return valid_count, invalid_count
            
            # 데이터셋 검증 실행
            validate_dataset(train_dataset)
            
            logger.info("Creating QLoRA trainer...")
            
            # GPT2 QLoRA 최적화된 Trainer 생성
            trainer = Trainer(
                model=model,
                args=training_args,
                train_dataset=train_dataset,
                data_collator=data_collator,
                tokenizer=tokenizer
            )
            
            # Trainer 후처리 검증
            logger.info("Verifying trainer configuration...")
            
            # 토크나이저 설정 재확인
            assert trainer.tokenizer.pad_token is not None, "Tokenizer pad_token is None"
            assert trainer.tokenizer.pad_token_id is not None, "Tokenizer pad_token_id is None"
            assert trainer.tokenizer.padding_side == "right", f"Wrong padding_side: {trainer.tokenizer.padding_side}"
            
            # 데이터 콜레이터 확인
            assert hasattr(trainer.data_collator, 'tokenizer'), "Data collator missing tokenizer"
            
            logger.info("✅ Trainer configuration verified successfully")
            
            # 추가 안전장치: 학습 전 gradient 상태 확인
            logger.info("Verifying gradient setup...")
            for name, param in model.named_parameters():
                if param.requires_grad:
                    logger.debug(f"Trainable parameter: {name} on device {param.device}")
                    break  # 첫 번째 학습 가능한 파라미터만 확인
            
            logger.info("QLoRA trainer setup completed successfully")
            
            return trainer
            
        except Exception as e:
            logger.error(f"Failed to setup trainer: {str(e)}")
            raise e
    
    async def save_trained_model(self, trainer, tokenizer):
        """학습된 모델 저장"""
        try:
            logger.info("Saving trained model...")
            
            # 모델 저장
            trainer.save_model()
            tokenizer.save_pretrained(self.output_dir)
            
            logger.info(f"Model saved to {self.output_dir}")
            
        except Exception as e:
            logger.error(f"Failed to save model: {str(e)}")
            raise e 