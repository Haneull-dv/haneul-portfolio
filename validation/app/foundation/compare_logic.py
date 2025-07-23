from typing import List
from app.domain.model.dsdcheck_schema import FinancialStatement, ComparisonResult

def compare_statements(
    excel: List[FinancialStatement], 
    dart: List[FinancialStatement]
) -> List[ComparisonResult]:
    def build_map(statements):
        result = {}
        for st in statements:
            for item in st.items:
                key = (st.fs_div, st.sj_div, item.account_nm)
                result[key] = item
        return result

    excel_map = build_map(excel)
    dart_map = build_map(dart)
    results = []

    for key in excel_map:
        if key in dart_map:
            excel_item = excel_map[key]
            dart_item = dart_map[key]
            for col in ["thstrm_amount", "frmtrm_amount"]:
                excel_val_str = excel_item.__dict__.get(col, "0")
                dart_val_str = dart_item.__dict__.get(col, "0")

                # 값 일치 여부 확인
                is_match = excel_val_str == dart_val_str
                
                # 결과 추가 (O/X)
                results.append(ComparisonResult(
                    fs_div=key[0],
                    sj_div=key[1],
                    account_nm=key[2],
                    column=col,
                    excel=excel_val_str,
                    dart=dart_val_str,
                    diff="O" if is_match else "X"
                ))
                
    return results 