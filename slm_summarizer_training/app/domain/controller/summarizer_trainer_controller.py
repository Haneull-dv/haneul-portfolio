"""
뉴스 요약 모델 학습 컨트롤러
API 라우터와 서비스 간의 중개 역할
"""
from fastapi import BackgroundTasks
from typing import Dict, Any
from ..service.summarizer_trainer_service import SummarizerTrainerService

class SummarizerTrainerController:
    """요약 모델 학습 컨트롤러"""
    
    def __init__(self):
        self.trainer_service = SummarizerTrainerService()
    
    async def get_service_info(self) -> Dict[str, str]:
        """서비스 정보 조회"""
        return await self.trainer_service.get_service_info()
    
    async def get_training_status(self) -> Dict[str, Any]:
        """학습 상태 조회"""
        return await self.trainer_service.get_training_status()
    
    async def start_training(self, training_config: Dict[str, Any], background_tasks: BackgroundTasks) -> Dict[str, str]:
        """학습 시작"""
        return await self.trainer_service.start_training(training_config, background_tasks)
    
    async def stop_training(self) -> Dict[str, str]:
        """학습 중단"""
        return await self.trainer_service.stop_training()
    
    async def health_check(self) -> Dict[str, str]:
        """헬스 체크"""
        return await self.trainer_service.health_check() 