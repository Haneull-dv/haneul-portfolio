from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import os

class ModelLoader:
    def __init__(self, model_path=None):
        if model_path is None:
            # Docker 컨테이너 환경에서는 사전 훈련된 모델을 사용
            # 실제 학습된 모델이 없으므로 베이스 모델을 임시로 사용
            self.model_path = "klue/bert-base"
        else:
            self.model_path = model_path
        
        self.tokenizer = None
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """모델과 토크나이저 로드"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
            print(f"✅ 모델 로드 완료: {self.model_path}")
        except Exception as e:
            print(f"❌ 모델 로드 실패: {e}")
            raise e
    
    def get_model(self):
        """모델 반환"""
        return self.model
    
    def get_tokenizer(self):
        """토크나이저 반환"""
        return self.tokenizer 