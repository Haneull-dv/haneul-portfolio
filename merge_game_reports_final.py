#!/usr/bin/env python3
"""
국내외 게임업체 주간 공시 및 주요기사 CSV 파일 병합 스크립트 (최종 버전)
실제 파일 구조를 기반으로 한 맞춤형 파싱
"""

import pandas as pd
import os
import glob
import re

def extract_week_info_from_filename(filename):
    """파일명에서 주차 정보를 추출"""
    base_name = os.path.basename(filename)
    
    # 요약 파일인 경우
    if "요약" in base_name:
        return "2023년 6월 1주차 (요약)"
    
    # 본문 파일 번호에 따른 주차 추정
    if "본문 2" in base_name:
        if "(1)" in base_name:
            return "2023년 2월 13-20일"
        elif "(2)" in base_name:
            return "2023년 2월 6-13일" 
        elif "(3)" in base_name:
            return "2023년 1월 30일 - 2월 6일"
        else:
            return "2023년 2월 20-27일"
    elif "본문 3" in base_name:
        if "(1)" in base_name:
            return "2023년 3월 1주차"
        elif "(2)" in base_name:
            return "2023년 3월 2주차"
        else:
            return "2023년 3월 3주차"
    elif "본문 4" in base_name:
        if "(1)" in base_name:
            return "2023년 4월 1주차"
        elif "(2)" in base_name:
            return "2023년 4월 2주차"
        elif "(3)" in base_name:
            return "2023년 4월 3주차"
        else:
            return "2023년 4월 4주차"
    elif "본문 5" in base_name:
        if "(1)" in base_name:
            return "2023년 5월 1주차"
        elif "(2)" in base_name:
            return "2023년 5월 2주차"
        else:
            return "2023년 5월 3주차"
    elif "본문 6" in base_name:
        return "2023년 6월 1주차"
    
    return "알 수 없는 주차"

def find_data_start_row(df):
    """실제 데이터가 시작하는 행을 찾습니다"""
    for i, row in df.iterrows():
        # 첫 번째 열에서 숫자 또는 특정 패턴을 찾습니다
        if len(row) > 1 and pd.notna(row.iloc[0]) and pd.notna(row.iloc[1]):
            first_col = str(row.iloc[0]).strip()
            second_col = str(row.iloc[1]).strip()
            
            # 숫자로 시작하는 행 (순위) 또는 특정 국가명이 있는 행을 찾습니다
            if (first_col.isdigit() or 
                second_col in ["한국", "중국", "미국", "일본", "유럽"] or
                any(country in second_col for country in ["한국", "중국", "미국", "일본"])):
                return i
    return None

def extract_company_data_from_summary(file_path):
    """요약 파일에서 회사 데이터를 추출"""
    df = pd.read_csv(file_path, encoding='utf-8')
    
    companies = []
    for i, row in df.iterrows():
        if len(row) >= 5 and pd.notna(row.iloc[1]):  # 기업명이 있는 행
            company_name = str(row.iloc[1]).strip()
            # 실제 회사명인지 확인 (헤더나 빈 행 제외)
            if (company_name and company_name != "기업명" and 
                not any(keyword in company_name for keyword in ["업데이트", "환산율", "미화"])):
                
                # 데이터 추출
                rank = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                current_price = str(row.iloc[3]).strip() if len(row) > 3 and pd.notna(row.iloc[3]) else ""
                prev_price = str(row.iloc[4]).strip() if len(row) > 4 and pd.notna(row.iloc[4]) else ""
                change_rate = str(row.iloc[5]).strip() if len(row) > 5 and pd.notna(row.iloc[5]) else ""
                market_cap = str(row.iloc[7]).strip() if len(row) > 7 and pd.notna(row.iloc[7]) else ""
                market_cap_usd = str(row.iloc[8]).strip() if len(row) > 8 and pd.notna(row.iloc[8]) else ""
                
                companies.append({
                    "시총순위": rank,
                    "국가": "한국",  # 요약 파일은 대부분 한국 기업
                    "회사명": company_name,
                    "시가총액": market_cap,
                    "전주비": change_rate,
                    "금주공시내용": "",
                    "현주가": current_price,
                    "전주주가": prev_price
                })
    
    return companies

def extract_company_data_from_report(file_path):
    """본문 파일에서 회사 데이터를 추출"""
    df = pd.read_csv(file_path, encoding='utf-8')
    
    companies = []
    
    for i, row in df.iterrows():
        # 데이터가 있는 행인지 확인 (최소 8개 열 필요)
        if len(row) >= 8 and pd.notna(row.iloc[1]) and pd.notna(row.iloc[2]) and pd.notna(row.iloc[3]):
            
            # 첫 번째 열이 비어있어도 두 번째 열에 순위가 있을 수 있음
            rank = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
            country = str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else ""
            company_name = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else ""
            
            # 유효한 데이터 행인지 확인
            if (company_name and 
                country in ["한국", "중국", "미국", "일본", "유럽"] and
                company_name not in ["회사명", "기업명"] and
                rank.isdigit()):
                
                market_cap = str(row.iloc[4]).strip() if len(row) > 4 and pd.notna(row.iloc[4]) else ""
                change_rate = str(row.iloc[5]).strip() if len(row) > 5 and pd.notna(row.iloc[5]) else ""
                disclosure = str(row.iloc[6]).strip() if len(row) > 6 and pd.notna(row.iloc[6]) else ""
                current_price = str(row.iloc[7]).strip() if len(row) > 7 and pd.notna(row.iloc[7]) else ""
                prev_price = str(row.iloc[8]).strip() if len(row) > 8 and pd.notna(row.iloc[8]) else ""
                
                companies.append({
                    "시총순위": rank,
                    "국가": country,
                    "회사명": company_name,
                    "시가총액": market_cap,
                    "전주비": change_rate,
                    "금주공시내용": disclosure,
                    "현주가": current_price,
                    "전주주가": prev_price
                })
    
    return companies

def merge_game_industry_reports():
    """게임업체 주간 공시 CSV 파일들을 병합"""
    
    # CSV 파일 찾기
    csv_files = glob.glob("국내외 게임업체 주간 공시 및 주요기사*.csv")
    
    print(f"발견된 CSV 파일: {len(csv_files)}개")
    for file in csv_files:
        print(f"  - {file}")
    
    all_companies = []
    
    for file_path in csv_files:
        print(f"\n처리 중: {file_path}")
        
        try:
            week_info = extract_week_info_from_filename(file_path)
            
            # 요약 파일과 본문 파일을 다르게 처리
            if "요약" in file_path:
                companies = extract_company_data_from_summary(file_path)
            else:
                companies = extract_company_data_from_report(file_path)
            
            # 주차 정보 추가
            for company in companies:
                company['주차'] = week_info
                company['파일명'] = os.path.basename(file_path)
            
            print(f"  추출된 회사 수: {len(companies)}")
            all_companies.extend(companies)
            
        except Exception as e:
            print(f"  오류 발생: {e}")
            continue
    
    if not all_companies:
        print("추출된 데이터가 없습니다.")
        return None
    
    # 데이터프레임으로 변환
    df = pd.DataFrame(all_companies)
    
    print(f"\n총 추출된 데이터: {len(df)}행")
    print(f"열 구조: {list(df.columns)}")
    
    # 한국 기업만 필터링
    korean_companies = df[df['국가'] == '한국'].copy()
    print(f"한국 기업 필터링 후: {len(korean_companies)}행")
    
    # 결과 저장
    output_file = "금주공시_통합.csv"
    korean_companies.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"결과 저장: {output_file}")
    
    # 요약 출력
    print("\n=== 병합 결과 요약 ===")
    print(f"총 행 수: {len(korean_companies)}")
    
    if len(korean_companies) > 0:
        print("\n주차별 분포:")
        week_counts = korean_companies['주차'].value_counts().sort_index()
        for week, count in week_counts.items():
            print(f"  {week}: {count}건")
        
        print(f"\n총 회사 수: {korean_companies['회사명'].nunique()}")
        print("\n상위 10개 회사 (출현 횟수):")
        company_counts = korean_companies['회사명'].value_counts().head(10)
        for company, count in company_counts.items():
            print(f"  {company}: {count}회")
        
        # 샘플 데이터 출력
        print("\n=== 샘플 데이터 (처음 5행) ===")
        display_columns = ['회사명', '시가총액', '전주비', '주차']
        print(korean_companies[display_columns].head())
    
    return korean_companies

if __name__ == "__main__":
    print("국내외 게임업체 주간 공시 CSV 파일 병합을 시작합니다...")
    result = merge_game_industry_reports()
    
    if result is not None and len(result) > 0:
        print("\n✅ 병합이 성공적으로 완료되었습니다!")
        print(f"📁 결과 파일: 금주공시_통합.csv")
    else:
        print("❌ 병합에 실패했습니다.") 