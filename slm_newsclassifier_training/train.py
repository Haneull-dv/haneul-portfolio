from transformers import AutoTokenizer, BertForSequenceClassification, TrainingArguments, Trainer
from datasets import Dataset
import pandas as pd
import numpy as np
import torch
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.utils.class_weight import compute_class_weight
from torch.nn import CrossEntropyLoss

# 1. 데이터 로드 + 라벨 정수 변환
df = pd.read_csv("data/news_classifier_dataset.csv")
df["label"] = df["label"].astype(int)
dataset = Dataset.from_pandas(df)

# 2. 클래스 가중치 계산
class_weights = compute_class_weight(class_weight="balanced", classes=np.unique(df["label"]), y=df["label"])
class_weights_tensor = torch.tensor(class_weights, dtype=torch.float)

# 3. 모델과 토크나이저 설정
model_name = "klue/bert-base"
tokenizer = AutoTokenizer.from_pretrained(model_name)

# 🔥 커스텀 손실 함수 포함 모델 클래스 정의
class ConfidenceAwareBert(BertForSequenceClassification):
    def __init__(self, config, threshold=0.9):
        super().__init__(config)
        self.threshold = threshold
        self.loss_fct = CrossEntropyLoss(weight=class_weights_tensor)

    def forward(self, input_ids=None, attention_mask=None, labels=None, **kwargs):
        outputs = super().forward(input_ids=input_ids, attention_mask=attention_mask, labels=labels, **kwargs)
        logits = outputs.logits

        if labels is not None:
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

# 모델 로딩
model = ConfidenceAwareBert.from_pretrained(model_name, num_labels=2)

# 4. 전처리
def preprocess(example):
    return tokenizer(example["text"], truncation=True, padding="max_length", max_length=128)

tokenized_dataset = dataset.map(preprocess)
train_test = tokenized_dataset.train_test_split(test_size=0.2)
train_dataset = train_test["train"]
eval_dataset = train_test["test"]

# 5. 평가지표
def compute_metrics(p):
    preds = np.argmax(p.predictions, axis=1)
    labels = p.label_ids
    return {
        "accuracy": accuracy_score(labels, preds),
        "precision": precision_score(labels, preds),
        "recall": recall_score(labels, preds),
        "f1": f1_score(labels, preds),
    }

# 6. 학습 설정
training_args = TrainingArguments(
    output_dir="./outputs",
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_dir="./logs",
    logging_steps=10,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    greater_is_better=True,
)

# 7. Trainer 구성 및 학습
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

trainer.train()

# 8. 모델 저장
model.save_pretrained("./outputs/model")
tokenizer.save_pretrained("./outputs/model")
