from datasets import Dataset
import pandas as pd
import numpy as np
import torch
from sklearn.utils.class_weight import compute_class_weight

class DataLoader:
    @staticmethod
    def load_dataset(data_path: str):
        """데이터셋 로드 및 기본 전처리"""
        df = pd.read_csv(data_path)
        df["label"] = df["label"].astype(int)
        dataset = Dataset.from_pandas(df)
        return dataset, df
    
    @staticmethod
    def calculate_class_weights(labels):
        """클래스 가중치 계산"""
        class_weights = compute_class_weight(
            class_weight="balanced", 
            classes=np.unique(labels), 
            y=labels
        )
        class_weights_tensor = torch.tensor(class_weights, dtype=torch.float)
        return class_weights_tensor
    
    @staticmethod
    def preprocess_dataset(dataset, tokenizer, max_length=128):
        """데이터셋 토크나이징"""
        def preprocess(example):
            return tokenizer(
                example["text"], 
                truncation=True, 
                padding="max_length", 
                max_length=max_length
            )
        
        tokenized_dataset = dataset.map(preprocess)
        return tokenized_dataset
    
    @staticmethod
    def split_dataset(dataset, test_size=0.2):
        """데이터셋 분할"""
        train_test = dataset.train_test_split(test_size=test_size)
        return train_test["train"], train_test["test"] 