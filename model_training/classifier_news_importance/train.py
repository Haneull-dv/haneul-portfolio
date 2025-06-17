from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from datasets import load_dataset, Dataset
import pandas as pd
import numpy as np
import torch
from sklearn.metrics import accuracy_score, f1_score

# 1. 데이터 로드
df = pd.read_csv("data/news_classifier_dataset.csv")  # 이 경로에 파일 있어야 해
dataset = Dataset.from_pandas(df)

# 2. 모델과 토크나이저 선택
model_name = "klue/bert-base"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

# 3. 전처리 함수 정의
def preprocess(example):
    return tokenizer(example["text"], truncation=True, padding="max_length", max_length=128)

tokenized_dataset = dataset.map(preprocess)

# 4. 데이터 분할
train_test = tokenized_dataset.train_test_split(test_size=0.2)
train_dataset = train_test["train"]
eval_dataset = train_test["test"]

# 5. 평가지표
def compute_metrics(p):
    preds = np.argmax(p.predictions, axis=1)
    labels = p.label_ids
    return {
        "accuracy": accuracy_score(labels, preds),
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
)

# 7. Trainer로 학습
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

# 8. 학습 시작
trainer.train()

# 9. 모델 저장
model.save_pretrained("./outputs/model")
tokenizer.save_pretrained("./outputs/model")
