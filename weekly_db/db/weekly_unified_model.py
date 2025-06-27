from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime, timedelta
import calendar

Base = declarative_base()

class WeeklyDataModel(Base):
    """주차별 통합 데이터 모델 (n8n 자동화용)"""
    __tablename__ = "weekly_data"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 공통 필드 (요구사항)
    company_name = Column(String(100), nullable=False, comment="기업명")
    content = Column(Text, nullable=False, comment="수집된 공시/이슈/ESG 내용")
    category = Column(String(50), nullable=False, comment="데이터 구분 (disclosure/issue/stockprice)")
    collected_at = Column(DateTime(timezone=True), server_default=func.now(), comment="실제 수집된 timestamp")
    week = Column(String(10), nullable=False, comment="해당 주의 월요일 날짜 (YYYY-MM-DD)")
    
    # 추가 메타데이터
    week_year = Column(Integer, nullable=False, comment="연도")
    week_number = Column(Integer, nullable=False, comment="ISO 주차")
    stock_code = Column(String(10), nullable=True, comment="종목코드")
    
    # 카테고리별 확장 데이터 (JSON)
    extra_data = Column(JSON, nullable=True, comment="카테고리별 추가 데이터")
    
    # 시스템 메타데이터  
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성 시간")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정 시간")
    
    # 인덱스 및 제약조건
    __table_args__ = (
        # 중복 방지: 같은 company_name, category, week 조합은 하나만
        UniqueConstraint('company_name', 'category', 'week', name='uq_weekly_data_unique'),
        Index('idx_weekly_company_category_week', 'company_name', 'category', 'week'),
        Index('idx_weekly_week', 'week'),
        Index('idx_weekly_category', 'category'),
        Index('idx_weekly_company', 'company_name'),
        Index('idx_weekly_collected_at', 'collected_at'),
    )
    
    def __repr__(self):
        return f"<WeeklyData(id={self.id}, company='{self.company_name}', category='{self.category}', week='{self.week}')>"
    
    def to_dict(self):
        """모델을 딕셔너리로 변환"""
        return {
            "id": self.id,
            "company_name": self.company_name,
            "content": self.content,
            "category": self.category,
            "collected_at": self.collected_at.isoformat() if self.collected_at else None,
            "week": self.week,
            "week_year": self.week_year,
            "week_number": self.week_number,
            "stock_code": self.stock_code,
            "extra_data": self.extra_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @staticmethod
    def get_current_week_monday() -> str:
        """현재 주의 월요일 날짜를 YYYY-MM-DD 형태로 반환"""
        today = datetime.now().date()
        # 월요일(0)을 기준으로 주의 시작일 계산
        days_since_monday = today.weekday()
        monday = today - timedelta(days=days_since_monday)
        return monday.strftime('%Y-%m-%d')
    
    @staticmethod
    def get_current_week() -> str:
        """현재 주의 월요일 날짜를 YYYY-MM-DD 형태로 반환"""
        today = datetime.now().date()
        # 월요일(0)을 기준으로 주의 시작일 계산
        days_since_monday = today.weekday()
        monday = today - timedelta(days=days_since_monday)
        return monday.strftime('%Y-%m-%d')
    
    @staticmethod
    def get_week_info(date_str: str = None) -> tuple:
        """날짜 문자열에서 연도와 ISO 주차 번호 추출"""
        if date_str:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date_obj = datetime.now().date()
        
        year, week_num, _ = date_obj.isocalendar()
        return year, week_num


class WeeklyBatchJobModel(Base):
    """주차별 배치 작업 로그 모델"""
    __tablename__ = "weekly_batch_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String(50), nullable=False, comment="작업 타입 (disclosure/issue/stockprice)")
    week = Column(String(10), nullable=False, comment="대상 주차 (YYYY-MM-DD)")
    status = Column(String(20), nullable=False, comment="작업 상태 (running/success/failed)")
    
    # 실행 결과
    total_companies = Column(Integer, nullable=True, comment="총 대상 기업 수")
    updated_count = Column(Integer, nullable=True, comment="신규 저장된 항목 수")
    skipped_count = Column(Integer, nullable=True, comment="중복으로 스킵된 항목 수")
    error_count = Column(Integer, nullable=True, comment="오류 발생 항목 수")
    
    # 시간 정보
    started_at = Column(DateTime(timezone=True), server_default=func.now(), comment="작업 시작 시간")
    finished_at = Column(DateTime(timezone=True), nullable=True, comment="작업 완료 시간")
    duration_seconds = Column(Integer, nullable=True, comment="작업 소요 시간 (초)")
    
    # 오류 정보
    error_message = Column(Text, nullable=True, comment="오류 메시지")
    
    __table_args__ = (
        Index('idx_batch_job_type_week', 'job_type', 'week'),
        Index('idx_batch_started_at', 'started_at'),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "job_type": self.job_type,
            "week": self.week,
            "status": self.status,
            "total_companies": self.total_companies,
            "updated_count": self.updated_count,
            "skipped_count": self.skipped_count,
            "error_count": self.error_count,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "duration_seconds": self.duration_seconds,
            "error_message": self.error_message,
        } 