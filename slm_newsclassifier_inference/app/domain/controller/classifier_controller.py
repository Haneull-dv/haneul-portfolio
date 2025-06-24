import sys
import os

# 서비스 계층 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from service.classifier_service import classifier_service

class ClassifierController:
    def __init__(self):
        self.classifier_service = classifier_service
    
    def predict_text(self, text: str) -> dict:
        """
        단일 텍스트 예측 - 서비스로 위임
        """
        return self.classifier_service.predict_single_text(text)
    
    def predict_batch_texts(self, texts: list) -> list:
        """
        배치 텍스트 예측 - 서비스로 위임
        """
        return self.classifier_service.predict_batch_texts(texts)

# 싱글톤 인스턴스
classifier_controller = ClassifierController() 