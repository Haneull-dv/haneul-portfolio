from pydantic import BaseModel
from typing import Optional

class TrainingRequest(BaseModel):
    data_path: str = "data/news_classifier_dataset.csv"
    output_dir: str = "./outputs"
    model_name: str = "klue/bert-base"
    epochs: int = 3
    batch_size: int = 8
    learning_rate: float = 2e-5

class TrainingResponse(BaseModel):
    status: str
    message: str
    output_path: Optional[str] = None 