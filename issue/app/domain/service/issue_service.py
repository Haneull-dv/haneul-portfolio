from typing import List, Dict

class IssueService:
    def __init__(self):
        pass
    
    def get_important_news(self) -> List[Dict]:
        """
        중요한 뉴스를 반환하는 서비스 로직
        """
        print(f"🤍3 서비스 진입")
        return [
            {
                "id": 1,
                "title": "게임 산업 주요 이슈 발생",
                "content": "게임 산업에서 중요한 변화가 있었습니다.",
                "importance": "high",
                "date": "2024-01-15"
            },
            {
                "id": 2,
                "title": "투자 관련 주요 발표",
                "content": "주요 투자 관련 발표가 있었습니다.",
                "importance": "medium",
                "date": "2024-01-14"
            }
        ]

# 싱글톤 인스턴스
issue_service = IssueService() 