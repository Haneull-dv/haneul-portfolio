#!/usr/bin/env python3
"""
데이터셋 디버깅 스크립트 - device-side assert 오류 해결용
데이터셋의 문제점을 찾아 수정하는 유틸리티
"""
import pandas as pd
import json
import os
import sys
from transformers import AutoTokenizer, GPT2Tokenizer
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatasetDebugger:
    """데이터셋 문제 진단 및 수정 클래스"""
    
    def __init__(self, config_path="config.json", data_path="./data/final_input_output_dataset_filtered.csv"):
        self.config_path = config_path
        self.data_path = data_path
        self.tokenizer = None
        self.config = self._load_config()
        
    def _load_config(self):
        """설정 파일 로드"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"설정 파일 로드 실패: {e}")
            return {
                "model_name": "skt/kogpt2-base-v2",
                "max_seq_length": 512
            }
    
    def _load_tokenizer(self):
        """토크나이저 로드 (3단계 fallback)"""
        model_name = self.config.get("model_name", "skt/kogpt2-base-v2")
        
        try:
            # 1단계: GPT2Tokenizer 직접 사용
            logger.info(f"GPT2Tokenizer로 {model_name} 로딩 시도...")
            tokenizer = GPT2Tokenizer.from_pretrained(model_name)
            
        except Exception as e1:
            logger.warning(f"GPT2Tokenizer 실패: {e1}")
            try:
                # 2단계: AutoTokenizer 사용
                logger.info(f"AutoTokenizer로 {model_name} 로딩 시도...")
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                
            except Exception as e2:
                logger.warning(f"AutoTokenizer 실패: {e2}")
                try:
                    # 3단계: use_fast=False로 재시도
                    logger.info(f"AutoTokenizer (use_fast=False)로 {model_name} 로딩 시도...")
                    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False)
                    
                except Exception as e3:
                    logger.error(f"모든 토크나이저 로딩 실패: {e3}")
                    raise e3
        
        # 토크나이저 설정
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            tokenizer.pad_token_id = tokenizer.eos_token_id
        
        # 패딩 방향 설정
        tokenizer.padding_side = "right"
        
        logger.info(f"✅ 토크나이저 로드 성공:")
        logger.info(f"   - 모델: {model_name}")
        logger.info(f"   - vocab_size: {tokenizer.vocab_size}")
        logger.info(f"   - pad_token: '{tokenizer.pad_token}' (id: {tokenizer.pad_token_id})")
        logger.info(f"   - eos_token: '{tokenizer.eos_token}' (id: {tokenizer.eos_token_id})")
        
        return tokenizer
    
    def analyze_dataset(self):
        """데이터셋 분석"""
        print("🔍 데이터셋 분석 시작...")
        
        # 토크나이저 로드
        self.tokenizer = self._load_tokenizer()
        
        # 데이터 로드
        if not os.path.exists(self.data_path):
            print(f"❌ 데이터 파일을 찾을 수 없습니다: {self.data_path}")
            return
        
        df = pd.read_csv(self.data_path)
        print(f"📊 원본 데이터: {len(df)}개 샘플")
        
        # 분석 통계
        stats = {
            'total_samples': len(df),
            'valid_samples': 0,
            'errors': {
                'missing_columns': 0,
                'empty_text': 0,
                'too_long': 0,
                'too_short': 0,
                'tokenization_error': 0,
                'invalid_tokens': 0,
                'invalid_labels': 0
            },
            'token_stats': {
                'min_length': float('inf'),
                'max_length': 0,
                'avg_length': 0,
                'total_tokens': 0
            }
        }
        
        vocab_size = self.tokenizer.vocab_size
        max_length = self.config.get('max_seq_length', 512)
        
        print(f"🔧 분석 기준:")
        print(f"   - vocab_size: {vocab_size}")
        print(f"   - max_length: {max_length}")
        print(f"   - 필수 컬럼: input, output")
        print()
        
        problem_samples = []
        
        for idx, row in df.iterrows():
            try:
                # 1. 필수 컬럼 확인
                if 'input' not in row or 'output' not in row:
                    stats['errors']['missing_columns'] += 1
                    problem_samples.append((idx, 'missing_columns', 'input 또는 output 컬럼 없음'))
                    continue
                
                input_text = str(row['input']).strip()
                output_text = str(row['output']).strip()
                
                # 2. 빈 텍스트 확인
                if not input_text or not output_text or input_text == 'nan' or output_text == 'nan':
                    stats['errors']['empty_text'] += 1
                    problem_samples.append((idx, 'empty_text', f'빈 텍스트: input="{input_text[:20]}...", output="{output_text[:20]}..."'))
                    continue
                
                # 3. 토큰화 테스트
                try:
                    # 입력 토큰화
                    input_tokens = self.tokenizer.encode(input_text, add_special_tokens=True)
                    output_tokens = self.tokenizer.encode(output_text, add_special_tokens=False)
                    
                    # 길이 확인
                    total_length = len(input_tokens) + len(output_tokens)
                    
                    if total_length > max_length:
                        stats['errors']['too_long'] += 1
                        problem_samples.append((idx, 'too_long', f'토큰 길이 초과: {total_length} > {max_length}'))
                        continue
                    
                    if total_length < 10:
                        stats['errors']['too_short'] += 1
                        problem_samples.append((idx, 'too_short', f'토큰 길이 부족: {total_length} < 10'))
                        continue
                    
                    # 4. 토큰 ID 범위 확인
                    all_tokens = input_tokens + output_tokens
                    invalid_tokens = [t for t in all_tokens if t >= vocab_size or t < 0]
                    
                    if invalid_tokens:
                        stats['errors']['invalid_tokens'] += 1
                        problem_samples.append((idx, 'invalid_tokens', f'범위 초과 토큰: {invalid_tokens[:3]}... (vocab_size: {vocab_size})'))
                        continue
                    
                    # 5. labels 생성 테스트
                    combined_text = input_text + self.tokenizer.eos_token + output_text
                    encoded = self.tokenizer(
                        combined_text,
                        max_length=max_length,
                        padding="max_length",
                        truncation=True,
                        return_tensors="pt"
                    )
                    
                    input_ids = encoded["input_ids"][0].tolist()
                    
                    # labels 생성 (입력 부분은 -100으로 마스킹)
                    labels = [-100] * len(input_tokens) + output_tokens
                    if len(labels) < max_length:
                        labels.extend([-100] * (max_length - len(labels)))
                    elif len(labels) > max_length:
                        labels = labels[:max_length]
                    
                    # labels 범위 확인
                    valid_labels = [l for l in labels if l != -100]
                    invalid_labels = [l for l in valid_labels if l >= vocab_size or l < 0]
                    
                    if invalid_labels:
                        stats['errors']['invalid_labels'] += 1
                        problem_samples.append((idx, 'invalid_labels', f'잘못된 labels: {invalid_labels[:3]}...'))
                        continue
                    
                    # ✅ 유효한 샘플
                    stats['valid_samples'] += 1
                    
                    # 토큰 통계 업데이트
                    length = len([l for l in labels if l != -100])
                    stats['token_stats']['min_length'] = min(stats['token_stats']['min_length'], length)
                    stats['token_stats']['max_length'] = max(stats['token_stats']['max_length'], length)
                    stats['token_stats']['total_tokens'] += length
                    
                except Exception as e:
                    stats['errors']['tokenization_error'] += 1
                    problem_samples.append((idx, 'tokenization_error', f'토큰화 오류: {str(e)[:50]}...'))
                    continue
                    
            except Exception as e:
                stats['errors']['tokenization_error'] += 1
                problem_samples.append((idx, 'general_error', f'일반 오류: {str(e)[:50]}...'))
                continue
        
        # 📊 결과 출력
        print("📊 분석 결과:")
        print(f"   - 전체 샘플: {stats['total_samples']}개")
        print(f"   - 유효 샘플: {stats['valid_samples']}개 ({stats['valid_samples']/stats['total_samples']*100:.1f}%)")
        print(f"   - 문제 샘플: {len(problem_samples)}개 ({len(problem_samples)/stats['total_samples']*100:.1f}%)")
        print()
        
        print("🔧 오류 유형별 통계:")
        for error_type, count in stats['errors'].items():
            if count > 0:
                print(f"   - {error_type}: {count}개")
        print()
        
        if stats['valid_samples'] > 0:
            avg_length = stats['token_stats']['total_tokens'] / stats['valid_samples']
            print("📏 토큰 길이 통계 (유효 샘플):")
            print(f"   - 최소 길이: {stats['token_stats']['min_length']}")
            print(f"   - 최대 길이: {stats['token_stats']['max_length']}")
            print(f"   - 평균 길이: {avg_length:.1f}")
            print()
        
        # 문제 샘플 상세 출력 (처음 10개)
        if problem_samples:
            print("❌ 문제 샘플 상세 (처음 10개):")
            for i, (idx, error_type, detail) in enumerate(problem_samples[:10]):
                print(f"   {i+1}. 샘플 {idx}: [{error_type}] {detail}")
            
            if len(problem_samples) > 10:
                print(f"   ... 및 {len(problem_samples) - 10}개 더")
            print()
        
        return stats, problem_samples
    
    def fix_dataset(self, output_path=None):
        """데이터셋 문제 수정"""
        print("🔧 데이터셋 수정 시작...")
        
        if output_path is None:
            base_name = os.path.splitext(self.data_path)[0]
            output_path = f"{base_name}_fixed.csv"
        
        # 분석 실행
        stats, problem_samples = self.analyze_dataset()
        
        if stats['valid_samples'] == 0:
            print("❌ 수정 가능한 유효 샘플이 없습니다.")
            return
        
        # 데이터 로드 및 수정
        df = pd.read_csv(self.data_path)
        problem_indices = {idx for idx, _, _ in problem_samples}
        
        # 유효한 샘플만 필터링
        fixed_df = df.drop(index=problem_indices).reset_index(drop=True)
        
        print(f"🔧 수정 완료:")
        print(f"   - 원본 샘플: {len(df)}개")
        print(f"   - 제거된 샘플: {len(problem_indices)}개")
        print(f"   - 수정된 샘플: {len(fixed_df)}개")
        print(f"   - 저장 경로: {output_path}")
        
        # 수정된 데이터 저장
        fixed_df.to_csv(output_path, index=False, encoding='utf-8')
        print("✅ 수정된 데이터셋 저장 완료!")
        
        return output_path

def main():
    """메인 실행 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(description="데이터셋 디버깅 도구")
    parser.add_argument("--data", default="./data/final_input_output_dataset_filtered.csv", help="데이터셋 경로")
    parser.add_argument("--config", default="config.json", help="설정 파일 경로")
    parser.add_argument("--fix", action="store_true", help="문제 수정 모드")
    parser.add_argument("--output", help="수정된 파일 저장 경로")
    
    args = parser.parse_args()
    
    debugger = DatasetDebugger(args.config, args.data)
    
    if args.fix:
        debugger.fix_dataset(args.output)
    else:
        debugger.analyze_dataset()

if __name__ == "__main__":
    print("🔍 데이터셋 디버깅 도구")
    print("사용법:")
    print("  분석만: python debug_dataset.py")
    print("  수정: python debug_dataset.py --fix")
    print()
    
    main() 