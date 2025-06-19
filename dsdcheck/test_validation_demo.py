#!/usr/bin/env python3
"""
범용 재무상태표 검증 시스템 데모
삼성전자와 네오위즈 데이터로 테스트
"""

import csv
import sys
import os
from typing import List

# 현재 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.domain.model.validation_rules import FinancialStatementParser, ValidationResult

def load_csv_data(file_path: str) -> List[List[str]]:
    """CSV 파일을 로드하여 리스트로 반환"""
    data = []
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            for row in csv_reader:
                data.append(row)
    except FileNotFoundError:
        print(f"파일을 찾을 수 없습니다: {file_path}")
        return []
    return data

def print_validation_results(results: List[ValidationResult], title: str):
    """검증 결과를 예쁘게 출력"""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    
    if not results:
        print("검증할 항목이 없습니다.")
        return
    
    for i, result in enumerate(results, 1):
        status = "✅ 통과" if result.is_valid else "❌ 실패"
        print(f"\n{i}. {result.account_name}")
        print(f"   상위 계정 금액: {result.parent_amount:>15,.0f}")
        print(f"   하위 합계 금액: {result.children_sum:>15,.0f}")
        print(f"   차이:          {result.difference:>15,.2f}")
        print(f"   결과: {status}")
        if result.error_message:
            print(f"   오류: {result.error_message}")

def print_tree_structure_enhanced(parser: FinancialStatementParser):
    """향상된 트리 구조 출력"""
    print(f"\n{'='*60}")
    print("계정 트리 구조")
    print(f"{'='*60}")
    
    def print_node(node, indent=0):
        prefix = "  " * indent
        if indent == 0:
            symbol = "📊"
        elif node.children:
            symbol = "📁"
        else:
            symbol = "📄"
        
        print(f"{prefix}{symbol} {node.name}: {node.amount:>15,.0f}")
        
        for child in node.children:
            print_node(child, indent + 1)
    
    # 루트 노드들 찾기
    root_nodes = [n for n in parser.account_tree.values() if n.level == 0]
    for root in root_nodes:
        print_node(root)

def generate_summary_report(report: dict, company_name: str):
    """요약 보고서 생성"""
    print(f"\n{'='*60}")
    print(f"{company_name} 검증 요약 보고서")
    print(f"{'='*60}")
    
    total = report["총_검증항목수"]
    passed = report["통과항목수"]
    failed = report["실패항목수"]
    
    if total > 0:
        success_rate = (passed / total) * 100
    else:
        success_rate = 0
    
    print(f"📋 총 검증 항목:     {total:>3}개")
    print(f"✅ 통과한 항목:     {passed:>3}개")
    print(f"❌ 실패한 항목:     {failed:>3}개")
    print(f"📊 성공률:         {success_rate:>5.1f}%")
    
    if failed > 0:
        print(f"\n⚠️  검증 실패 항목들:")
        all_results = report["계층구조_검증결과"] + report["특수규칙_검증결과"]
        failed_results = [r for r in all_results if not r.is_valid]
        
        for i, result in enumerate(failed_results, 1):
            print(f"   {i}. {result.account_name}")
            print(f"      차이: {result.difference:,.2f}")

def test_company_data(file_path: str, company_name: str):
    """특정 회사 데이터를 테스트"""
    print(f"\n🏢 {company_name} 재무상태표 검증을 시작합니다...")
    
    # CSV 데이터 로드
    csv_data = load_csv_data(file_path)
    if not csv_data:
        return
    
    # 파서 생성 및 검증 실행
    parser = FinancialStatementParser()
    
    # 디버깅을 위해 원본 데이터 일부 출력
    print(f"\n=== 원본 CSV 데이터 샘플 ({company_name}) ===")
    for i, row in enumerate(csv_data[:15]):  # 처음 15행만 출력
        print(f"{i:2}: {row}")
    
    report = parser.generate_validation_report(csv_data)
    
    # 파싱된 데이터 디버깅
    parser.debug_parsed_data()
    
    # 트리 구조 출력
    print_tree_structure_enhanced(parser)
    
    # 계층 구조 검증 결과
    print_validation_results(
        report["계층구조_검증결과"], 
        "계층 구조 검증 결과 (상위 = 하위 합계)"
    )
    
    # 특수 규칙 검증 결과
    print_validation_results(
        report["특수규칙_검증결과"], 
        "특수 규칙 검증 결과 (자산=부채+자본)"
    )
    
    # 요약 보고서
    generate_summary_report(report, company_name)
    
    return report

def main():
    """메인 실행 함수"""
    print("🔍 범용 재무상태표 검증 시스템 데모")
    print("=" * 60)
    
    # 테스트할 파일들 (상대 경로)
    test_files = [
        {
            "path": "../[주식회사네오위즈]사업보고서_재무제표(2025.03 (3).csv",
            "company": "네오위즈"
        },
        {
            "path": "../[삼성전자]사업보고서_재무제표(2025.03.csv",
            "company": "삼성전자"
        },
        {
            "path": "../[주식회사 엘지화학]사업보고서_재무제표(2025.03.csv",
            "company": "LG화학"
        }
    ]
    
    all_reports = {}
    
    for test_file in test_files:
        try:
            report = test_company_data(test_file["path"], test_file["company"])
            if report:
                all_reports[test_file["company"]] = report
        except Exception as e:
            print(f"❌ {test_file['company']} 검증 중 오류 발생: {e}")
    
    # 전체 비교 요약
    if len(all_reports) > 1:
        print(f"\n{'='*60}")
        print("🔄 기업 간 비교 요약")
        print(f"{'='*60}")
        
        for company, report in all_reports.items():
            total = report["총_검증항목수"]
            passed = report["통과항목수"]
            success_rate = (passed / total) * 100 if total > 0 else 0
            
            print(f"{company:>10}: {passed}/{total} 통과 ({success_rate:5.1f}%)")

if __name__ == "__main__":
    main() 