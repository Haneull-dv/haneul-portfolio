#!/usr/bin/env python3
"""
Weekly Services Database Initialization Script
모든 서비스의 테이블을 생성하는 초기화 스크립트

실행 방법:
docker compose exec weekly_db python weekly_db/init_db.py
python weekly_db/init_db.py --dry-run  # DB 연결 없이 모델 검증만
"""

import asyncio
import sys
import os
from pathlib import Path

# 프로젝트 루트 디렉토리를 Python 경로에 추가
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Docker 환경에서는 환경변수를 직접 설정
if not os.getenv('DATABASE_URL'):
    # .env 파일에서 DATABASE_URL 읽기
    env_file = project_root / "weekly_db" / ".env"
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    os.environ['DATABASE_URL'] = line.split('=', 1)[1].strip()
                    break

# 각 서비스의 Base 모델 import
try:
    from weekly_disclosure.app.domain.model.disclosure_model import Base as DisclosureBase, DisclosureModel
    from weekly_issue.app.domain.model.issue_model import Base as IssueBase, IssueModel
    from weekly_stockprice.app.domain.model.stockprice_model import Base as StockPriceBase, StockPriceModel, DailyStockDataModel
    print("✅ 모든 모델 클래스 import 완료")
    
    # 모델 정보 출력
    print(f"   - DisclosureModel: {DisclosureModel.__tablename__}")
    print(f"   - IssueModel: {IssueModel.__tablename__}")
    print(f"   - StockPriceModel: {StockPriceModel.__tablename__}")
    print(f"   - DailyStockDataModel: {DailyStockDataModel.__tablename__}")
    
except ImportError as e:
    print(f"❌ 모델 import 실패: {e}")
    sys.exit(1)

async def create_all_tables(dry_run=False):
    """모든 서비스의 테이블을 비동기로 생성"""
    try:
        print("🚀 데이터베이스 테이블 생성 시작...")
        
        if dry_run:
            print("🔍 DRY RUN 모드 - 실제 DB 연결 없이 검증만 수행")
            print("📋 weekly_disclosure 테이블 스키마 확인...")
            print(f"   테이블명: {DisclosureBase.metadata.tables.keys()}")
            
            print("📋 weekly_issue 테이블 스키마 확인...")
            print(f"   테이블명: {IssueBase.metadata.tables.keys()}")
            
            print("📋 weekly_stockprice 테이블 스키마 확인...")
            print(f"   테이블명: {StockPriceBase.metadata.tables.keys()}")
            
            print("✅ 모든 테이블 스키마 검증 완료")
            return
        
        # Docker 환경에서의 DB 연결
        from sqlalchemy.ext.asyncio import create_async_engine
        
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise RuntimeError("DATABASE_URL 환경변수가 설정되지 않았습니다")
        
        print(f"🗄️ DB 연결 - URL: {database_url}")
        
        # 비동기 엔진 생성
        engine = create_async_engine(
            database_url,
            echo=False,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        
        # 각 Base 클래스별로 테이블 생성
        print("📋 weekly_disclosure 테이블 생성...")
        async with engine.begin() as conn:
            await conn.run_sync(DisclosureBase.metadata.create_all)
        
        print("📋 weekly_issue 테이블 생성...")
        async with engine.begin() as conn:
            await conn.run_sync(IssueBase.metadata.create_all)
        
        print("📋 weekly_stockprice 테이블 생성...")
        async with engine.begin() as conn:
            await conn.run_sync(StockPriceBase.metadata.create_all)
        
        print("✅ 모든 테이블 생성 완료")
        
        # DB 연결 정리
        await engine.dispose()
        
    except Exception as e:
        print(f"❌ 테이블 생성 실패: {e}")
        if not dry_run:
            raise

async def main():
    """메인 실행 함수"""
    print("=" * 50)
    print("🗄️  Weekly Services DB 초기화")
    print("=" * 50)
    
    # dry-run 모드 확인
    dry_run = "--dry-run" in sys.argv
    
    try:
        await create_all_tables(dry_run)
        
        if dry_run:
            print("\n🔍 DRY RUN 완료 - 모든 모델이 정상적으로 로드되었습니다!")
        else:
            print("\n🎉 데이터베이스 초기화가 성공적으로 완료되었습니다!")
        
    except Exception as e:
        print(f"\n💥 초기화 실패: {e}")
        if not dry_run:
            sys.exit(1)

if __name__ == "__main__":
    # 비동기 메인 함수 실행
    asyncio.run(main())
