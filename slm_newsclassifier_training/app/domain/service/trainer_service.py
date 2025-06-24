from transformers import TrainingArguments, Trainer
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
import sys
import os

# utills 폴더 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from utills.model_builder import ModelBuilder
from utills.data_loader import DataLoader

class TrainerService:
    def __init__(self, data_path="data/news_classifier_dataset.csv", model_name="klue/bert-base"):
        self.data_path = data_path
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.train_dataset = None
        self.eval_dataset = None
    
    def validate_training_config(self, data_path: str, output_dir: str) -> dict:
        """
        학습 설정 검증 로직
        """
        validation_result = {
            "is_valid": True,
            "errors": []
        }
        
        # 데이터 파일 검증
        if not os.path.exists(data_path):
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"데이터 파일이 존재하지 않습니다: {data_path}")
        
        # 출력 디렉토리 생성 가능 여부 확인
        try:
            os.makedirs(output_dir, exist_ok=True)
        except Exception as e:
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"출력 디렉토리 생성 실패: {str(e)}")
        
        return validation_result
        
    def setup_training(self):
        """학습 설정 초기화"""
        # 데이터 로드
        dataset, df = DataLoader.load_dataset(self.data_path)
        
        # 클래스 가중치 계산
        class_weights_tensor = DataLoader.calculate_class_weights(df["label"])
        
        # 모델 및 토크나이저 생성
        self.model = ModelBuilder.create_model(self.model_name)
        self.tokenizer = ModelBuilder.create_tokenizer(self.model_name)
        self.model.set_class_weights(class_weights_tensor)
        
        # 데이터 전처리
        tokenized_dataset = DataLoader.preprocess_dataset(dataset, self.tokenizer)
        self.train_dataset, self.eval_dataset = DataLoader.split_dataset(tokenized_dataset)
        
        return True
    
    def compute_metrics(self, p):
        """평가 지표 계산"""
        preds = np.argmax(p.predictions, axis=1)
        labels = p.label_ids
        return {
            "accuracy": accuracy_score(labels, preds),
            "precision": precision_score(labels, preds),
            "recall": recall_score(labels, preds),
            "f1": f1_score(labels, preds),
        }
    
    def train_model(self, output_dir="./outputs", epochs=3, batch_size=8, learning_rate=2e-5):
        """모델 학습 실행"""
        training_args = TrainingArguments(
            output_dir=output_dir,
            learning_rate=learning_rate,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            num_train_epochs=epochs,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            logging_dir="./logs",
            logging_steps=10,
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            greater_is_better=True,
        )
        
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=self.train_dataset,
            eval_dataset=self.eval_dataset,
            tokenizer=self.tokenizer,
            compute_metrics=self.compute_metrics,
        )
        
        # 학습 실행
        trainer.train()
        
        # 모델 저장
        self.model.save_pretrained(f"{output_dir}/model")
        self.tokenizer.save_pretrained(f"{output_dir}/model")
        
        return trainer
    
    def run_full_training_pipeline(self, output_dir="./outputs", **kwargs):
        """전체 학습 파이프라인 실행"""
        try:
            print("📋 학습 설정 초기화 중...")
            self.setup_training()
            
            print("🚀 모델 학습 시작...")
            trainer = self.train_model(output_dir=output_dir, **kwargs)
            
            print(f"✅ 학습 완료! 모델이 {output_dir}/model 에 저장되었습니다.")
            return trainer
            
        except Exception as e:
            print(f"❌ 학습 중 오류 발생: {str(e)}")
            raise e

    def execute_full_training(self, data_path: str, output_dir: str = "./outputs", 
                             model_name: str = "klue/bert-base", **kwargs):
        """
        전체 학습 실행 로직 (검증 포함)
        컨트롤러에서 호출하는 메인 메서드
        """
        # 1. 입력 검증
        if not data_path or not data_path.strip():
            raise ValueError("데이터 파일 경로가 지정되지 않았습니다.")
        
        if not output_dir:
            raise ValueError("출력 디렉토리가 지정되지 않았습니다.")
        
        # 2. 설정 검증
        validation = self.validate_training_config(data_path, output_dir)
        if not validation["is_valid"]:
            error_msg = "; ".join(validation["errors"])
            raise ValueError(f"설정 검증 실패: {error_msg}")
        
        # 3. 서비스 설정 업데이트
        self.data_path = data_path
        self.model_name = model_name
        
        # 4. 학습 실행
        trainer = self.run_full_training_pipeline(output_dir=output_dir, **kwargs)
        
        return trainer

# 싱글톤 인스턴스
trainer_service = TrainerService() 