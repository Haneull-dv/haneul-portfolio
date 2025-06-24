"""
데이터 로더 유틸리티
CSV 데이터 로딩 및 전처리 기능
"""
import os
import pandas as pd
import logging
from typing import Any
from datasets import Dataset

logger = logging.getLogger(__name__)

class DataLoader:
    """데이터 로딩 및 전처리 클래스"""
    
    def __init__(self):
        self.dataset_path = "./data/final_input_output_dataset_filtered.csv"
        
    async def load_training_dataset(self, tokenizer, config) -> Dataset:
        """학습 데이터셋 로드 및 전처리"""
        try:
            logger.info(f"Loading dataset from {self.dataset_path}")
            
            # CSV 파일 로드
            if not os.path.exists(self.dataset_path):
                raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")
            
            df = pd.read_csv(self.dataset_path)
            logger.info(f"Loaded {len(df)} samples")
            
            # 데이터 전처리
            processed_data = self._preprocess_data(df, tokenizer, config)
            
            # Dataset 객체 생성
            dataset = Dataset.from_dict(processed_data)
            
            logger.info("Dataset loaded and preprocessed successfully")
            return dataset
            
        except Exception as e:
            logger.error(f"Failed to load dataset: {str(e)}")
            raise e
    
    def _preprocess_data(self, df, tokenizer, config):
        """데이터 전처리 - Causal LM용"""
        try:
            max_seq_length = config.get("max_seq_length", 512)
            
            input_ids_list = []
            attention_mask_list = []
            labels_list = []
            
            for _, row in df.iterrows():
                # 입력 프롬프트와 출력 분리
                input_prompt = self._create_input_prompt(str(row['input']))
                target_output = str(row['output'])
                
                # 빈 데이터 체크
                if not input_prompt.strip() or not target_output.strip():
                    logger.warning(f"Skipping empty data at index {row.name}")
                    continue
                
                # 입력 부분 토크나이징 (KoGPT2 안전 처리)
                try:
                    # 기본 토크나이징 시도
                    input_encoding = tokenizer(
                        input_prompt,
                        truncation=False,
                        padding=False,
                        add_special_tokens=True,
                        return_tensors=None
                    )
                    # input_ids 검증
                    if not isinstance(input_encoding.get("input_ids"), list) or len(input_encoding["input_ids"]) == 0:
                        raise ValueError("Invalid input_ids")
                        
                except Exception as e:
                    logger.warning(f"Input encoding 실패 ({e}), 단순 방법 시도...")
                    try:
                        # 더 단순한 방법 시도
                        input_ids = tokenizer.encode(input_prompt, add_special_tokens=True)
                        input_encoding = {"input_ids": input_ids}
                    except Exception as e2:
                        logger.error(f"Input encoding 완전 실패: {e2}")
                        continue
                
                # 출력 부분 토크나이징 (special token 없이)
                try:
                    # 기본 토크나이징 시도
                    output_encoding = tokenizer(
                        target_output,
                        truncation=False,
                        padding=False,
                        add_special_tokens=False,
                        return_tensors=None
                    )
                    # output_ids 검증
                    if not isinstance(output_encoding.get("input_ids"), list) or len(output_encoding["input_ids"]) == 0:
                        raise ValueError("Invalid output_ids")
                        
                except Exception as e:
                    logger.warning(f"Output encoding 실패 ({e}), 단순 방법 시도...")
                    try:
                        # 더 단순한 방법 시도
                        output_ids = tokenizer.encode(target_output, add_special_tokens=False)
                        output_encoding = {"input_ids": output_ids}
                    except Exception as e2:
                        logger.error(f"Output encoding 완전 실패: {e2}")
                        continue
                
                # 전체 시퀀스 구성 (KoGPT2 안전 처리)
                try:
                    input_ids = input_encoding["input_ids"] + output_encoding["input_ids"] + [tokenizer.eos_token_id]
                except Exception as e:
                    logger.warning(f"시퀀스 구성 실패: {e}")
                    continue
                
                # 길이 제한 및 검증
                if len(input_ids) > max_seq_length:
                    input_ids = input_ids[:max_seq_length]
                elif len(input_ids) < 10:  # 너무 짧은 시퀀스 제외
                    logger.warning(f"시퀀스가 너무 짧음: {len(input_ids)} tokens")
                    continue
                
                # attention_mask 생성
                attention_mask = [1] * len(input_ids)
                
                # labels 생성 (입력 부분은 -100으로 마스킹, 출력 부분만 학습)
                try:
                    labels = [-100] * len(input_encoding["input_ids"]) + output_encoding["input_ids"] + [tokenizer.eos_token_id]
                    if len(labels) > max_seq_length:
                        labels = labels[:max_seq_length]
                except Exception as e:
                    logger.warning(f"Labels 생성 실패: {e}")
                    continue
                
                # 패딩 (KoGPT2 안전 처리)
                padding_length = max_seq_length - len(input_ids)
                if padding_length > 0:
                    # pad_token_id가 없는 경우 eos_token_id 사용
                    pad_id = getattr(tokenizer, 'pad_token_id', tokenizer.eos_token_id)
                    if pad_id is None:
                        pad_id = tokenizer.eos_token_id
                    
                    input_ids.extend([pad_id] * padding_length)
                    attention_mask.extend([0] * padding_length)
                    labels.extend([-100] * padding_length)
                
                # 🔍 강화된 최종 검증 (device-side assert 방지)
                try:
                    # 1. 길이 일치 검증
                    if len(input_ids) != max_seq_length or len(attention_mask) != max_seq_length or len(labels) != max_seq_length:
                        logger.warning(f"[ERROR] 길이 불일치: input_ids={len(input_ids)}, attention_mask={len(attention_mask)}, labels={len(labels)}")
                        continue
                    
                    # 2. 토크나이저 정보 확인 및 스마트 vocab_size 검증
                    vocab_size = getattr(tokenizer, 'vocab_size', 51200)
                    unk_token_id = getattr(tokenizer, 'unk_token_id', 0)  # UNK 토큰 ID
                    pad_token_id = getattr(tokenizer, 'pad_token_id', tokenizer.eos_token_id)
                    
                    # 디버그: 토큰 범위 확인 (첫 번째 샘플만)
                    if len(input_ids_list) == 0:  # 첫 번째 샘플
                        logger.info(f"[DEBUG] 토크나이저 정보:")
                        logger.info(f"   - vocab_size: {vocab_size}")
                        logger.info(f"   - unk_token_id: {unk_token_id}")
                        logger.info(f"   - pad_token_id: {pad_token_id}")
                        logger.info(f"   - eos_token_id: {tokenizer.eos_token_id}")
                        logger.info(f"   - 샘플 input_ids 범위: {min(input_ids)} ~ {max(input_ids)}")
                        logger.info(f"   - 샘플 labels 범위: {min([l for l in labels if l != -100])} ~ {max([l for l in labels if l != -100])}")
                        
                        # 실제 사용 가능한 vocab_size 계산 (특별 토큰 고려)
                        special_tokens = set([
                            getattr(tokenizer, 'unk_token_id', None),
                            getattr(tokenizer, 'pad_token_id', None),
                            getattr(tokenizer, 'eos_token_id', None),
                            getattr(tokenizer, 'bos_token_id', None),
                            getattr(tokenizer, 'cls_token_id', None),
                            getattr(tokenizer, 'sep_token_id', None),
                            getattr(tokenizer, 'mask_token_id', None)
                        ])
                        special_tokens.discard(None)
                        max_special_token = max(special_tokens) if special_tokens else 0
                        logger.info(f"   - 특별 토큰 최대값: {max_special_token}")
                        logger.info(f"   - 특별 토큰 집합: {sorted(special_tokens)}")
                    
                    # 안전한 토큰 범위 처리 (vocab_size 기준)
                    max_valid_token_id = vocab_size - 1  # 0 ~ vocab_size-1이 유효한 범위
                    
                    # input_ids에서 범위 초과 토큰을 max_valid_token_id로 클리핑
                    original_input_ids = input_ids[:]
                    input_ids = []
                    input_fixes = 0
                    
                    for idx in original_input_ids:
                        if idx >= vocab_size or idx < 0:
                            input_ids.append(max_valid_token_id)  # vocab_size-1로 클리핑
                            input_fixes += 1
                        else:
                            input_ids.append(idx)
                    
                    # labels에서 범위 초과 토큰 처리 (-100은 그대로 유지)
                    original_labels = labels[:]
                    labels = []
                    label_fixes = 0
                    
                    for label in original_labels:
                        if label == -100:  # ignore index는 그대로 유지
                            labels.append(label)
                        elif label >= vocab_size or label < 0:
                            labels.append(max_valid_token_id)  # vocab_size-1로 클리핑
                            label_fixes += 1
                        else:
                            labels.append(label)
                    
                    # 수정 통계 로그 (처음 3개만)
                    if (input_fixes > 0 or label_fixes > 0) and len(input_ids_list) < 3:
                        logger.info(f"[FIX] 토큰 범위 수정 (샘플 {len(input_ids_list)}):")
                        logger.info(f"   - vocab_size: {vocab_size}")
                        logger.info(f"   - max_valid_token_id: {max_valid_token_id}")
                        logger.info(f"   - input_fixes: {input_fixes}/{len(original_input_ids)}")
                        logger.info(f"   - label_fixes: {label_fixes}/{len([l for l in original_labels if l != -100])}")
                    
                    # 극단적인 경우만 필터링 (대부분이 클리핑된 토큰인 경우)
                    clipped_ratio_input = input_ids.count(max_valid_token_id) / len(input_ids)
                    valid_labels = [l for l in labels if l != -100]
                    clipped_ratio_labels = (valid_labels.count(max_valid_token_id) / len(valid_labels)) if valid_labels else 0
                    
                    if clipped_ratio_input > 0.9:  # 90% 이상이 클리핑된 토큰
                        logger.warning(f"[ERROR] input에 클리핑된 토큰이 너무 많음: {clipped_ratio_input:.2f}")
                        continue
                    
                    if clipped_ratio_labels > 0.9:  # 90% 이상이 클리핑된 토큰
                        logger.warning(f"[ERROR] labels에 클리핑된 토큰이 너무 많음: {clipped_ratio_labels:.2f}")
                        continue
                    
                    # 3. 데이터 타입 검증
                    if not all(isinstance(x, int) for x in input_ids):
                        logger.warning(f"[ERROR] input_ids 타입 오류: {[type(x) for x in input_ids[:5]]}")
                        continue
                    
                    if not all(isinstance(x, int) for x in labels):
                        logger.warning(f"[ERROR] labels 타입 오류: {[type(x) for x in labels[:5]]}")
                        continue
                    
                    # 4. 학습 가능한 토큰 검증
                    learnable_tokens = [label for label in labels if label != -100]
                    if len(learnable_tokens) == 0:
                        logger.warning(f"[ERROR] 학습 가능한 토큰이 없음 (모든 labels가 -100)")
                        continue
                    
                    if len(learnable_tokens) < 3:
                        logger.warning(f"[ERROR] 학습 가능한 토큰이 너무 적음: {len(learnable_tokens)}개")
                        continue
                    
                    # 5. 패딩 토큰 비율 검증
                    pad_token_id = getattr(tokenizer, 'pad_token_id', tokenizer.eos_token_id)
                    pad_ratio = input_ids.count(pad_token_id) / len(input_ids)
                    if pad_ratio > 0.8:  # 80% 이상이 패딩이면 제외
                        logger.warning(f"[ERROR] 패딩 비율이 너무 높음: {pad_ratio:.2f}")
                        continue
                    
                    # 모든 검증 통과
                    logger.debug(f"[OK] 샘플 검증 통과: input_len={len(input_ids)}, learnable_tokens={len(learnable_tokens)}, pad_ratio={pad_ratio:.2f}")
                    
                except Exception as e:
                    logger.error(f"[ERROR] 검증 중 오류: {e}")
                    continue
                
                input_ids_list.append(input_ids)
                attention_mask_list.append(attention_mask)
                labels_list.append(labels)
            
            # 최종 데이터셋 통계
            total_original = len(df)
            total_processed = len(input_ids_list)
            filter_rate = (total_original - total_processed) / total_original * 100
            
            logger.info(f"[RESULT] 데이터 처리 완료:")
            logger.info(f"   - 원본 샘플: {total_original}개")
            logger.info(f"   - 처리된 샘플: {total_processed}개")
            logger.info(f"   - 필터링된 샘플: {total_original - total_processed}개 ({filter_rate:.1f}%)")
            
            if total_processed == 0:
                raise ValueError("[ERROR] 처리된 샘플이 없습니다. 데이터 형식을 확인하세요.")
            
            if total_processed < 10:
                logger.warning(f"[WARNING] 처리된 샘플이 매우 적습니다 ({total_processed}개). 학습 품질에 영향을 줄 수 있습니다.")
            
            # 최종 검증 통계
            final_dataset = {
                "input_ids": input_ids_list,
                "attention_mask": attention_mask_list,
                "labels": labels_list
            }
            
            # 샘플 데이터 검증
            if len(input_ids_list) > 0:
                sample_input = input_ids_list[0]
                sample_labels = labels_list[0]
                vocab_size = getattr(tokenizer, 'vocab_size', 51200)
                
                logger.info(f"[SAMPLE] 샘플 검증:")
                logger.info(f"   - 샘플 길이: {len(sample_input)}")
                logger.info(f"   - vocab_size: {vocab_size}")
                logger.info(f"   - 최대 input_id: {max(sample_input)}")
                logger.info(f"   - 최대 valid_label: {max([l for l in sample_labels if l != -100], default=-100)}")
                logger.info(f"   - 학습 가능 토큰: {len([l for l in sample_labels if l != -100])}개")
            
            return final_dataset
            
        except Exception as e:
            logger.error(f"Failed to preprocess data: {str(e)}")
            raise e
    
    def _create_input_prompt(self, input_text: str) -> str:
        """입력 프롬프트 생성 (출력 부분 제외)"""
        return f"""다음 뉴스를 한국어로 간결하게 요약해주세요.

입력: {input_text}

요약:""" 