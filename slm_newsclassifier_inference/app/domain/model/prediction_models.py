from pydantic import BaseModel
from typing import Union, List

class PredictionRequest(BaseModel):
    text: Union[str, List[str]]  # 단일 텍스트 또는 텍스트 리스트

class PredictionResponse(BaseModel):
    result: Union[dict, List[dict]]  # 단일 결과 또는 결과 리스트 