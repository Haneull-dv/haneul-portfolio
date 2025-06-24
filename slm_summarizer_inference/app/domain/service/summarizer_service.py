"""
뉴스 요약 모델 추론 서비스
QLoRA 기반 모델 추론의 핵심 비즈니스 로직
"""
import time
import logging
import torch
import sys
import os
from typing import Dict, Any, List

# utils 폴더 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from utils.predictor import SummarizerPredictor

logger = logging.getLogger(__name__)

class SummarizerService:
    """요약 모델 추론 서비스"""
    
    def __init__(self):
        self.predictor = SummarizerPredictor()
        self.model_loaded = False
        
    async def get_service_info(self) -> Dict[str, str]:
        """서비스 정보 조회"""
        gpu_info = "CPU"
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            gpu_info = f"{gpu_name} ({gpu_memory:.1f}GB)"
            
        return {
            "message": "뉴스 요약 모델 추론 서비스",
            "status": "running",
            "service": "slm-summarizer-inference",
            "gpu_info": gpu_info,
            "version": "1.0.0"
        }
    
    async def summarize_single(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """단일 텍스트 요약"""
        try:
            start_time = time.time()
            
            # 모델 로드 확인
            await self._ensure_model_loaded()
            
            # 요청 데이터 파싱
            news_data = request_data.get("news", {})
            title = news_data.get("title", "")
            description = news_data.get("description", "")
            max_new_tokens = request_data.get("max_new_tokens", 150)
            temperature = request_data.get("temperature", 0.7)
            top_p = request_data.get("top_p", 0.9)
            
            # 요약 생성
            summary = await self.predictor.generate_summary(
                title=title,
                description=description,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p
            )
            
            processing_time = time.time() - start_time
            
            return {
                "summary": summary,
                "input_title": title,
                "processing_time": processing_time,
                "model_info": self.predictor.get_model_info()
            }
            
        except Exception as e:
            logger.error(f"Service: Failed to generate summary - {str(e)}")
            raise e
    
    async def summarize_batch(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """배치 텍스트 요약"""
        try:
            start_time = time.time()
            
            # 모델 로드 확인
            await self._ensure_model_loaded()
            
            # 요청 데이터 파싱
            news_list = request_data.get("news_list", [])
            max_new_tokens = request_data.get("max_new_tokens", 150)
            temperature = request_data.get("temperature", 0.7)
            
            results = []
            success_count = 0
            error_count = 0
            
            for news_data in news_list:
                try:
                    item_start_time = time.time()
                    
                    title = news_data.get("title", "")
                    description = news_data.get("description", "")
                    
                    # 개별 요약 생성
                    summary = await self.predictor.generate_summary(
                        title=title,
                        description=description,
                        max_new_tokens=max_new_tokens,
                        temperature=temperature
                    )
                    
                    item_processing_time = time.time() - item_start_time
                    
                    results.append({
                        "summary": summary,
                        "input_title": title,
                        "processing_time": item_processing_time,
                        "model_info": self.predictor.get_model_info()
                    })
                    
                    success_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process item: {str(e)}")
                    error_count += 1
                    
                    results.append({
                        "summary": f"요약 생성 실패: {str(e)}",
                        "input_title": news_data.get("title", ""),
                        "processing_time": 0.0,
                        "model_info": None
                    })
            
            total_processing_time = time.time() - start_time
            
            return {
                "results": results,
                "total_count": len(news_list),
                "success_count": success_count,
                "error_count": error_count,
                "total_processing_time": total_processing_time
            }
            
        except Exception as e:
            logger.error(f"Service: Failed to process batch summarization - {str(e)}")
            raise e
    
    async def get_model_status(self) -> Dict[str, Any]:
        """모델 상태 조회"""
        try:
            gpu_memory_info = {}
            if torch.cuda.is_available():
                gpu_memory_info = {
                    "gpu_memory_allocated": f"{torch.cuda.memory_allocated() / 1024**3:.2f}GB",
                    "gpu_memory_reserved": f"{torch.cuda.memory_reserved() / 1024**3:.2f}GB",
                    "gpu_memory_total": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f}GB"
                }
            
            return {
                "model_loaded": self.model_loaded,
                "model_info": self.predictor.get_model_info() if self.model_loaded else None,
                "gpu_available": torch.cuda.is_available(),
                **gpu_memory_info
            }
            
        except Exception as e:
            logger.error(f"Service: Failed to get model status - {str(e)}")
            raise e
    
    async def reload_model(self) -> Dict[str, str]:
        """모델 재로딩"""
        try:
            logger.info("Starting model reload...")
            
            # 기존 모델 해제
            self.predictor.unload_model()
            self.model_loaded = False
            
            # GPU 메모리 정리
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # 모델 재로드
            await self.predictor.load_model()
            self.model_loaded = True
            
            logger.info("Model reloaded successfully")
            
            return {
                "status": "success",
                "message": "Model reloaded successfully"
            }
            
        except Exception as e:
            logger.error(f"Service: Failed to reload model - {str(e)}")
            self.model_loaded = False
            raise e
    
    async def health_check(self) -> Dict[str, str]:
        """헬스 체크"""
        gpu_available = torch.cuda.is_available()
        return {
            "status": "healthy",
            "service": "slm-summarizer-inference",
            "gpu_available": str(gpu_available),
            "model_loaded": str(self.model_loaded)
        }
    
    async def _ensure_model_loaded(self):
        """모델 로드 확인 및 로딩"""
        if not self.model_loaded:
            logger.info("Loading model for first time...")
            await self.predictor.load_model()
            self.model_loaded = True
            logger.info("Model loaded successfully") 