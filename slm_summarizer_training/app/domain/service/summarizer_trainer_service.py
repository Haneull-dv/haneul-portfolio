"""
뉴스 요약 모델 학습 서비스
QLoRA 기반 모델 학습의 핵심 비즈니스 로직
"""
import asyncio
import logging
import torch
import sys
import os
from typing import Dict, Any
from fastapi import BackgroundTasks

# utils 폴더 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from utils.model_loader import ModelLoader
from utils.data_loader import DataLoader

logger = logging.getLogger(__name__)

class SummarizerTrainerService:
    """요약 모델 학습 서비스"""
    
    def __init__(self):
        self.model_loader = ModelLoader()
        self.data_loader = DataLoader()
        self.training_state = {
            "is_training": False,
            "current_step": 0,
            "total_steps": 0,
            "status": "idle",
            "result": None,
            "error": None
        }
        self.stop_training_flag = False
        
    async def get_service_info(self) -> Dict[str, str]:
        """서비스 정보 조회"""
        gpu_info = "CPU"
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            gpu_info = f"{gpu_name} ({gpu_memory:.1f}GB)"
            
        return {
            "message": "뉴스 요약 모델 학습 서비스",
            "status": "running",
            "service": "slm-summarizer-training",
            "gpu_info": gpu_info
        }
    
    async def get_training_status(self) -> Dict[str, Any]:
        """학습 상태 조회"""
        return self.training_state.copy()
    
    async def start_training(self, training_config: Dict[str, Any], background_tasks: BackgroundTasks) -> Dict[str, str]:
        """학습 시작"""
        try:
            # 현재 학습 중인지 확인
            if self.training_state.get("is_training", False):
                return {
                    "status": "error",
                    "message": "Training is already in progress"
                }
            
            # 백그라운드 태스크로 학습 시작
            background_tasks.add_task(
                self._start_training_task,
                training_config
            )
            
            return {
                "status": "started",
                "message": "Training started in background",
                "training_id": "summarizer_training_001"
            }
            
        except Exception as e:
            logger.error(f"Service: Failed to start training - {str(e)}")
            raise e
    
    async def stop_training(self) -> Dict[str, str]:
        """학습 중단"""
        try:
            if not self.training_state.get("is_training", False):
                return {"message": "No training in progress", "status": "idle"}
            
            self.stop_training_flag = True
            self.training_state["status"] = "stopping"
            
            return {"message": "Training stop requested", "status": "stopping"}
            
        except Exception as e:
            logger.error(f"Service: Failed to stop training - {str(e)}")
            raise e
    
    async def health_check(self) -> Dict[str, str]:
        """헬스 체크"""
        gpu_available = torch.cuda.is_available()
        return {
            "status": "healthy",
            "service": "slm-summarizer-training",
            "gpu_available": str(gpu_available)
        }
    
    async def _start_training_task(self, config: Dict[str, Any]):
        """실제 학습 태스크 (백그라운드에서 실행)"""
        try:
            # 학습 상태 초기화
            self.training_state.update({
                "is_training": True,
                "current_step": 0,
                "total_steps": 0,
                "status": "initializing",
                "result": None,
                "error": None
            })
            self.stop_training_flag = False
            
            logger.info("Starting model training...")
            
            # 1. 모델 및 토크나이저 로드
            self.training_state["status"] = "loading_model"
            model, tokenizer = await self.model_loader.load_model_for_training()
            
            if self.stop_training_flag:
                self._handle_training_stop()
                return
            
            # 2. 데이터셋 로드
            self.training_state["status"] = "loading_data"
            train_dataset = await self.data_loader.load_training_dataset(tokenizer, config)
            
            if self.stop_training_flag:
                self._handle_training_stop()
                return
            
            # 3. 학습 설정
            self.training_state["status"] = "preparing_training"
            trainer = await self.model_loader.setup_trainer(
                model, tokenizer, train_dataset, config
            )
            
            if self.stop_training_flag:
                self._handle_training_stop()
                return
            
            # 4. 학습 실행
            self.training_state["status"] = "training"
            self.training_state["total_steps"] = len(trainer.get_train_dataloader()) * config.get("epochs", 15)
            
            # 학습 진행 상황을 주기적으로 업데이트
            train_result = await self._run_training_with_progress(trainer)
            
            if self.stop_training_flag:
                self._handle_training_stop()
                return
            
            # 5. 모델 저장
            self.training_state["status"] = "saving_model"
            await self.model_loader.save_trained_model(trainer, tokenizer)
            
            # 학습 완료
            self.training_state.update({
                "is_training": False,
                "status": "completed",
                "result": {
                    "final_loss": train_result.training_loss if train_result else None,
                    "total_steps": self.training_state["current_step"]
                }
            })
            
            logger.info("Training completed successfully!")
            
        except Exception as e:
            logger.error(f"Training failed: {str(e)}")
            self.training_state.update({
                "is_training": False,
                "status": "failed",
                "error": str(e)
            })
    
    async def _run_training_with_progress(self, trainer):
        """진행 상황을 추적하면서 학습 실행"""
        import threading
        import time
        
        # 진행 상황 업데이트 스레드
        def update_progress():
            while self.training_state["is_training"] and not self.stop_training_flag:
                if hasattr(trainer.state, 'global_step'):
                    self.training_state["current_step"] = trainer.state.global_step
                time.sleep(1)
        
        progress_thread = threading.Thread(target=update_progress)
        progress_thread.daemon = True
        progress_thread.start()
        
        # 학습 실행
        train_result = trainer.train()
        
        return train_result
    
    def _handle_training_stop(self):
        """학습 중단 처리"""
        self.training_state.update({
            "is_training": False,
            "status": "stopped",
            "error": "Training was stopped by user request"
        })
        logger.info("Training stopped by user request") 