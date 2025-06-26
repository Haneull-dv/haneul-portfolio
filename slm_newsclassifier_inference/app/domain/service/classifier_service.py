import torch
import sys
import os

# utills 폴더 import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from utills.model_loader import ModelLoader

class ClassifierService:
    def __init__(self):
        self.model_loader = ModelLoader()
        self.model = self.model_loader.get_model()
        self.tokenizer = self.model_loader.get_tokenizer()
    
    def validate_single_text(self, text: str):
        """단일 텍스트 검증 로직"""
        if not text or not text.strip():
            raise ValueError("텍스트는 비어있을 수 없습니다.")
        return text.strip()
    
    def validate_batch_texts(self, texts: list):
        """배치 텍스트 검증 로직"""
        if not texts or len(texts) == 0:
            raise ValueError("텍스트 리스트는 비어있을 수 없습니다.")
        
        # 빈 텍스트 필터링
        valid_texts = [text.strip() for text in texts if text and text.strip()]
        
        if len(valid_texts) == 0:
            raise ValueError("유효한 텍스트가 없습니다.")
        
        return valid_texts
    
    def predict(self, text: str) -> dict:
        """
        핵심 텍스트 분류 예측 로직
        """
        try:
            # 텍스트 토크나이징
            inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)
            
            # GPU로 입력 이동 (디바이스 일관성 보장)
            device = self.model_loader.get_device()
            if device.startswith("cuda"):
                inputs = {k: v.to(device) for k, v in inputs.items()}
            
            # 모델 추론
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1)
                predicted = torch.argmax(probs, dim=1).item()
                confidence = probs[0][predicted].item()
            
            # GPU 메모리 정리
            if device.startswith("cuda"):
                del inputs, outputs, logits, probs
                torch.cuda.empty_cache()
            
            return {
                "text": text,
                "label": predicted,
                "confidence": round(confidence, 4)
            }
        except Exception as e:
            # GPU 메모리 정리 (에러 시에도)
            device = self.model_loader.get_device()
            if device.startswith("cuda"):
                torch.cuda.empty_cache()
            raise Exception(f"예측 중 오류 발생: {str(e)}")
    
    def predict_single_text(self, text: str) -> dict:
        """
        단일 텍스트 예측 (검증 포함)
        컨트롤러에서 호출하는 메인 메서드
        """
        # 검증
        validated_text = self.validate_single_text(text)
        
        # 예측 실행
        return self.predict(validated_text)
    
    def predict_batch_texts(self, texts: list) -> list:
        """
        배치 텍스트 예측 (검증 포함)
        컨트롤러에서 호출하는 메인 메서드
        """
        # 검증
        valid_texts = self.validate_batch_texts(texts)
        
        # 예측 실행
        try:
            results = []
            for text in valid_texts:
                result = self.predict(text)
                results.append(result)
            return results
        except Exception as e:
            raise Exception(f"배치 예측 중 오류 발생: {str(e)}")

# 싱글톤 인스턴스
classifier_service = ClassifierService()

# 3. 테스트 실행
if __name__ == "__main__":
    sample_text = [
        "엔씨소프트, MMORPG '블레이드앤소울2' 글로벌 출시",
        "넥슨, 2분기 역대 최대 실적 기록",
        "게임 산업에 대한 정부 규제 완화 논의",
        "애플, 새로운 아이폰 출시 루머",
        "해외 투자자, 한국 증시에 관심 낮아져",
        "강아지가 산책하다가 귀여움을 받음",
        "비가 오는 날씨에 우산 판매량 증가",
        "카트라이더의 새로운 맵 \"아이스월드\" 출시",
        "리니지 새로운 캐릭터 \"이즈원\" 공개",
        "텐센트, 넥슨 인수 소식",
        "위믹스 상장폐지 소식에 주가 급락",
        "지배구조 재편으로 esg 투자 증가",
        "오픈월드, \"아케이드\"맵 전체 업데이트",
        "개발자 \"파이널 판타지16\" 출시 예정에 법적 대응",
        "지속가능경영보고서 최초 발간",
        "농협은행과 mou 체결하여 채무 조정 소식",
        "엔씨소프트 등 게임주 '장중 급등'...3대 이슈는?",
        "pubg: 배틀그라운드, 국가대항전 'pnc 2025' 서울에서 개최",
        "아이돌 콜라보 늦추자 … 크래프톤, 2분기 실적 주춤",
        "크래프톤, 배틀그라운드 국가대항전 'pnc 2025' 개최"

    ]
    for text in sample_text:
        result = classifier_service.predict_single_text(text)
        print(f"Input: {text}")
        print(f"Predicted Label: {result['label']} (Confidence: {result['confidence']})")
