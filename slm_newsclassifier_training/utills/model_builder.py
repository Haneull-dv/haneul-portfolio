from transformers import AutoTokenizer, BertForSequenceClassification
from torch.nn import CrossEntropyLoss
import torch

class ConfidenceAwareBert(BertForSequenceClassification):
    def __init__(self, config, threshold=0.9):
        super().__init__(config)
        self.threshold = threshold
        self.loss_fct = None  # 클래스 가중치는 나중에 설정

    def set_class_weights(self, class_weights_tensor):
        self.loss_fct = CrossEntropyLoss(weight=class_weights_tensor)

    def forward(self, input_ids=None, attention_mask=None, labels=None, **kwargs):
        outputs = super().forward(input_ids=input_ids, attention_mask=attention_mask, labels=labels, **kwargs)
        logits = outputs.logits

        if labels is not None and self.loss_fct is not None:
            probs = torch.softmax(logits, dim=1)
            confs, preds = torch.max(probs, dim=1)

            # 기본 cross-entropy 손실
            loss = self.loss_fct(logits, labels)

            # 추가 패널티: 라벨이 1인데 confidence < threshold
            penalty = ((labels == 1) & (confs < self.threshold)).float() * (self.threshold - confs)
            penalty_loss = penalty.mean()

            total_loss = loss + penalty_loss
            return (total_loss, logits)

        return (logits,)

class ModelBuilder:
    @staticmethod
    def create_model(model_name: str, num_labels: int = 2):
        """커스텀 모델 생성"""
        model = ConfidenceAwareBert.from_pretrained(model_name, num_labels=num_labels)
        return model
    
    @staticmethod
    def create_tokenizer(model_name: str):
        """토크나이저 생성"""
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        return tokenizer 