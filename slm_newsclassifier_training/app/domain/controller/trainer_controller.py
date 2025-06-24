import sys
import os

# 서비스 계층 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from service.trainer_service import trainer_service

class TrainerController:
    def __init__(self):
        self.trainer_service = trainer_service
    
    def execute_training(self, data_path: str, output_dir: str = "./outputs", 
                        model_name: str = "klue/bert-base", **kwargs):
        """
        모델 학습 실행 - 서비스로 위임
        """
        return self.trainer_service.execute_full_training(
            data_path=data_path,
            output_dir=output_dir,
            model_name=model_name,
            **kwargs
        )

# 싱글톤 인스턴스
trainer_controller = TrainerController() 