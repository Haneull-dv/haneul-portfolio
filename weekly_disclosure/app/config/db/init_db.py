from app.config.db.base import Base, engine
from app.domain.model.disclosure_model import DisclosureModel
from app.domain.model.weekly_model import WeeklyDataModel, WeeklyBatchJobModel

def init_db():
    print("📌 DB 초기화: 테이블 생성 시작...")
    Base.metadata.create_all(bind=engine)
    print("✅ DB 테이블 생성 완료!")
