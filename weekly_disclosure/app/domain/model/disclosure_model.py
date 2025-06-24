from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class DisclosureModel(Base):
    """공시 정보 SQLAlchemy 모델"""
    __tablename__ = "disclosures"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 공시 데이터
    company_name = Column(String(100), nullable=False, comment="회사명")
    stock_code = Column(String(10), nullable=False, comment="종목코드")
    disclosure_title = Column(Text, nullable=False, comment="공시 제목")
    disclosure_date = Column(String(20), nullable=False, comment="공시 날짜 (YYYYMMDD)")
    report_name = Column(String(200), nullable=False, comment="보고서명")
    
    # 메타데이터
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성 시간")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정 시간")
    
    # 인덱스 설정
    __table_args__ = (
        Index('idx_disclosure_company_date', 'company_name', 'disclosure_date'),
        Index('idx_disclosure_stock_code', 'stock_code'),
        Index('idx_disclosure_date', 'disclosure_date'),
    )
    
    def __repr__(self):
        return f"<DisclosureModel(id={self.id}, company='{self.company_name}', date='{self.disclosure_date}')>"
    
    def to_dict(self):
        """모델을 딕셔너리로 변환"""
        return {
            "id": self.id,
            "company_name": self.company_name,
            "stock_code": self.stock_code,
            "disclosure_title": self.disclosure_title,
            "disclosure_date": self.disclosure_date,
            "report_name": self.report_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        } 