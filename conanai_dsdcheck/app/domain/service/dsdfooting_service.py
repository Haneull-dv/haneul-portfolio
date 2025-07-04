import pandas as pd
from typing import List, Dict, Any, Tuple
from app.domain.model.dsdfooting_schema import FootingResultItem, FootingResponse, YearlyFootingSheetResult
from app.domain.model.validation_rules import VALIDATION_RULES
import logging
from io import BytesIO

# 로깅 설정 - INFO 레벨로 조정
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

class DSDFootingService:
    """재무제표 합계검증 서비스"""
    
    # D210000 연결재무상태표만 처리
    SHEET_TITLES = {
        "D210000": "연결재무상태표"
    }

    def _preprocess_dataframe(self, sheet_name: str, xls: pd.ExcelFile) -> Dict[str, pd.DataFrame]:
        """
        엑셀 시트를 연도별 DataFrame으로 읽고 전처리 (들여쓰기 기반 계층 구조 포함)
        
        Args:
            sheet_name (str): 시트명
            xls (pd.ExcelFile): 엑셀 파일 객체
            
        Returns:
            Dict[str, pd.DataFrame]: 연도별로 전처리된 DataFrame
                - key: "YYYY-12-31" 형태의 연도 문자열
                - value: DataFrame (항목명, 경로, 금액 컬럼 포함)
            
        Raises:
            ValueError: 유효한 컬럼을 찾을 수 없는 경우
        """
        try:
            # 헤더 없이 데이터 읽기
            df = pd.read_excel(xls, sheet_name, header=None)
            
            if len(df.columns) < 4:  # A, B, C, D열 최소 필요
                raise ValueError("Sheet must have at least 4 columns (A, B, C, D)")
            
            # 5행(인덱스 4)에서 연도 정보 추출 (2024-12-31, 2023-12-31, 2022-12-31)
            year_row = df.iloc[4]  # 5행 (0-based index)
            
            # 연도 매핑 생성
            year_mapping = {}
            for col_idx in range(1, 4):  # B, C, D열 (인덱스 1, 2, 3)
                if col_idx < len(year_row):
                    year_str = str(year_row.iloc[col_idx]).strip()
                    if year_str and year_str != 'nan':
                        year_mapping[col_idx] = year_str
                        logging.info(f"Column {chr(65+col_idx)} -> Year: {year_str}")
            
            if not year_mapping:
                # 기본 연도 매핑 사용
                year_mapping = {
                    1: "2024-12-31",  # B열
                    2: "2023-12-31",  # C열
                    3: "2022-12-31"   # D열
                }
                logging.warning("Using default year mapping")
            
            # A열: 항목명 (6행부터 53행까지, 인덱스 5~52)
            data_start_row = 5  # 6행 (0-based index)
            data_end_row = 52   # 53행 (0-based index, inclusive)
            
            # 데이터 범위 추출
            data_df = df.iloc[data_start_row:data_end_row+1].copy()
            
            # 계층 구조 분석
            hierarchy = self._analyze_hierarchy(data_df)
            
            # 연도별 데이터프레임 생성
            year_dfs = {}
            
            for col_idx, year_key in year_mapping.items():
                if col_idx >= len(data_df.columns):
                    logging.warning(f"Column index {col_idx} not found in sheet {sheet_name}")
                    continue
                
                # 해당 연도의 금액 데이터 추출
                amount_col = data_df.iloc[:, col_idx].astype(str).str.strip()
                
                # 금액 전처리
                amount_col = (amount_col
                           .str.replace(',', '', regex=False)  # 쉼표 제거
                           .str.replace('−', '-', regex=False)  # 전각 마이너스를 하이픈으로
                           .str.replace('"', '', regex=False)   # 따옴표 제거
                           .str.replace('(', '-', regex=False)  # 괄호로 표시된 음수 처리 시작
                           .str.replace(')', '', regex=False))  # 괄호로 표시된 음수 처리 끝
                
                # 숫자로 변환 (빈 문자열이나 'nan'은 NaN으로)
                amount_col = pd.to_numeric(amount_col, errors='coerce')
                
                # 계층 구조 정보와 금액 결합
                year_data = []
                for item in hierarchy:
                    # 원본 DataFrame에서 해당 행의 금액 가져오기
                    row_idx = item['row_index']  # 원본 data_df에서의 인덱스
                    
                    if row_idx < len(amount_col) and pd.notna(amount_col.iloc[row_idx]):
                        year_data.append({
                            '항목명': item['name'],
                            '경로': item['path'],
                            '금액': amount_col.iloc[row_idx],
                            '들여쓰기레벨': item['indent_level']
                        })
                
                # DataFrame 생성
                year_df = pd.DataFrame(year_data)
                
                if len(year_df) > 0:
                    year_dfs[year_key] = year_df
                    
                    logging.info(
                        f"📑 Column [{chr(65+col_idx)}] -> Year [{year_key}]: {len(year_df)} rows processed"
                    )
                    
                    # 샘플 데이터 로깅 (처음 5개 항목)
                    sample_data = year_df.head().to_dict('records')
                    for item in sample_data:
                        logging.debug(f"  - {item['경로']}: {item['금액']:,.0f}")
            
            if not year_dfs:
                raise ValueError("No valid year data found after preprocessing")
            
            # 전처리 결과 로깅
            logging.info(
                f"\n📑 Sheet [{sheet_name}] Preprocessing Summary:\n"
                f"✅ Total years processed: {len(year_dfs)}\n"
                f"📅 Years: {list(year_dfs.keys())}\n"
                f"📊 Data range: Row {data_start_row+1} to {data_end_row+1}\n"
                f"🏗️ Hierarchy items: {len(hierarchy)}"
            )
            
            return year_dfs
            
        except Exception as e:
            logging.error(
                f"\n⚠️ Failed to preprocess sheet [{sheet_name}]:\n"
                f"❌ Error: {str(e)}\n"
                f"📊 Sheet info: {df.shape if 'df' in locals() else 'N/A'}"
            )
            raise ValueError(f"Failed to preprocess sheet {sheet_name}: {str(e)}")

    def _analyze_hierarchy(self, data_df: pd.DataFrame) -> List[Dict]:
        """
        들여쓰기 기반 계층 구조 분석
        
        Args:
            data_df (pd.DataFrame): 데이터 범위 DataFrame
            
        Returns:
            List[Dict]: 계층 구조 정보 리스트
        """
        hierarchy = []
        parent_stack = []  # 상위 계정 스택
        
        for i in range(len(data_df)):
            # 원본 항목명 (들여쓰기 포함)
            original_name = str(data_df.iloc[i, 0]) if pd.notna(data_df.iloc[i, 0]) else ""
            
            # 정리된 항목명
            clean_name = original_name.strip().replace("[개요]", "").strip()
            
            # 빈 값이거나 "[개요]" 섹션 헤더는 건너뛰기
            if not clean_name or "[개요]" in original_name or not clean_name:
                continue
            
            # 들여쓰기 수준 계산 (공백 개수)
            leading_spaces = len(original_name) - len(original_name.lstrip())
            indent_level = leading_spaces // 4  # 4칸 단위로 들여쓰기
            
            # 스택에서 현재 레벨보다 높은 레벨들 제거
            while parent_stack and parent_stack[-1]['level'] >= indent_level:
                parent_stack.pop()
            
            # 경로 생성 (상위 계정 > 현재 계정)
            if parent_stack:
                path = ' > '.join([p['name'] for p in parent_stack] + [clean_name])
            else:
                path = clean_name
            
            # 현재 항목을 스택에 추가
            parent_stack.append({
                'level': indent_level,
                'name': clean_name
            })
            
            hierarchy.append({
                'name': clean_name,
                'path': path,
                'indent_level': indent_level,
                'original': original_name,
                'row_index': i  # 디버깅용
            })
            
            logging.debug(f"Row {i+6}: [L{indent_level}] {path}")
        
        logging.info(f"Hierarchy analysis complete: {len(hierarchy)} items found")
        return hierarchy

    def check_footing(self, excel_file: bytes) -> FootingResponse:
        """엑셀 파일 합계검증 수행"""
        try:
            # BytesIO로 엑셀 파일 래핑
            with pd.ExcelFile(BytesIO(excel_file)) as xls:
                results = []
                mismatch_count = 0
                processed_sheets = 0
                
                # D210000 시트 찾기
                target_sheet = None
                for sheet_name in xls.sheet_names:
                    if "D210000" in sheet_name or sheet_name == "D210000":
                        target_sheet = sheet_name
                        break
                
                if not target_sheet:
                    raise ValueError("D210000 (연결재무상태표) sheet not found in the excel file")
                
                logging.info(f"Found D210000 sheet: {target_sheet}")
                
                try:
                    # 연도별 데이터프레임 전처리
                    year_dfs = self._preprocess_dataframe(target_sheet, xls)
                    
                    # 연도별 검증 결과 저장
                    year_results = {}
                    
                    # 각 연도별로 검증 수행
                    for year, df in year_dfs.items():
                        # 검증 수행
                        validation_results = self._validate_sheet("D210000", df)
                        year_results[year] = validation_results
                        
                        # 불일치 항목 카운트
                        mismatch_count += sum(1 for r in validation_results if not r.is_match)
                    
                    # 연도별 결과를 하나의 시트 결과로 통합
                    sheet_result = YearlyFootingSheetResult(
                        sheet="D210000",
                        title="연결재무상태표",
                        results_by_year=year_results
                    )
                    results.append(sheet_result)
                    processed_sheets += 1
                    
                except ValueError as e:
                    logging.error(f"❌ Failed to process sheet {target_sheet}: {str(e)}")
                    raise
                except Exception as e:
                    logging.error(f"❌ Unexpected error processing sheet {target_sheet}: {str(e)}")
                    raise
                
                if processed_sheets == 0:
                    raise ValueError("No sheets were successfully processed")
                
                if len(results) == 0:
                    raise ValueError("No validation results were generated")
                
                logging.info(f"✅ Successfully processed {processed_sheets} sheet(s)")
                
                return FootingResponse(
                    results=results,
                    total_sheets=len(results),
                    mismatch_count=mismatch_count
                )
            
        except Exception as e:
            logging.error(f"❌ Failed to process excel file: {str(e)}")
            raise ValueError(f"Invalid excel file format: {str(e)}")

    def _validate_sheet(self, sheet_code: str, df: pd.DataFrame) -> List[FootingResultItem]:
        """
        개별 시트 검증
        
        Args:
            sheet_code (str): 시트 코드
            df (pd.DataFrame): 검증할 데이터프레임
            
        Returns:
            List[FootingResultItem]: 검증 결과 목록
        """
        sheet_type = "연결재무상태표"  # D210000은 항상 연결재무상태표
        
        rules = VALIDATION_RULES[sheet_type]
        results = []
        
        # 항목명 매칭 검사
        df_items = set(df['항목명'].unique())
        rule_items = {item for item, _ in rules.items() if item != "__special_checks__"}
        
        logging.info(f"📋 Available items in sheet: {sorted(df_items)}")
        
        # 누락된 항목 확인
        missing_items = rule_items - df_items
        if missing_items:
            logging.warning(
                f"\n❌ Missing items in sheet [{sheet_code}]:\n"
                f"Expected but not found: {sorted(missing_items)}"
            )
            
            # Fuzzy matching 힌트 제공
            for missing in missing_items:
                # 간단한 문자열 유사도 계산 (공백/특수문자 제거 후 비교)
                normalized_missing = ''.join(c for c in missing if c.isalnum())
                matches = []
                for available in df_items:
                    normalized_available = ''.join(c for c in available if c.isalnum())
                    # 정규화된 문자열이 서로 포함 관계인 경우 힌트로 추가
                    if (normalized_missing in normalized_available or 
                        normalized_available in normalized_missing):
                        matches.append(available)
                if matches:
                    logging.info(f"💡 Possible matches for '{missing}': {matches}")
        
        # 특수 검증 규칙 처리
        if "__special_checks__" in rules:
            special_results = self._check_special_rules(df, rules["__special_checks__"])
            results.extend(special_results)
        
        # 최상위 항목부터 검증 시작
        top_level_items = ["자산총계", "부채총계", "자본총계", "자본과부채총계"]
        
        for parent in top_level_items:
            if parent in rules:
                result = self._check_sum(df, parent, rules[parent], rules)
                results.append(result)
        
        return results

    def _check_special_rules(self, df: pd.DataFrame, special_rules: Dict) -> List[FootingResultItem]:
        """특수 검증 규칙 처리 (경로 기반)"""
        results = []
        
        for rule_name, rule in special_rules.items():
            try:
                # 첫 번째 항목 값 가져오기 (경로 또는 항목명으로)
                item1_rows = df[(df['경로'] == rule['항목1']) | (df['항목명'] == rule['항목1'])]
                if item1_rows.empty:
                    logging.warning(f"Item1 not found for special rule {rule_name}: {rule['항목1']}")
                    continue
                item1_value = float(item1_rows['금액'].sum())
                
                # 두 번째 항목(들) 값 계산
                item2_sum = 0
                child_results = []
                
                for item2 in rule['항목2']:
                    item2_rows = df[(df['경로'] == item2) | (df['항목명'] == item2)]
                    if item2_rows.empty:
                        logging.warning(f"Item2 not found for special rule {rule_name}: {item2}")
                        continue
                    item2_value = float(item2_rows['금액'].sum())
                    item2_sum += item2_value
                    
                    # 표시용 항목명 (경로에서 마지막 부분 추출)
                    display_name = item2.split(' > ')[-1] if ' > ' in item2 else item2
                    
                    child_results.append(FootingResultItem(
                        item=display_name,
                        expected=None,
                        actual=item2_value,
                        is_match=True,
                        children=[]
                    ))
                
                # 값 비교 (반올림 오차 허용)
                is_match = abs(item1_value - item2_sum) < 0.01
                
                if not is_match:
                    logging.warning(
                        f"Special rule mismatch in {rule_name}: "
                        f"item1={item1_value:,.0f}, "
                        f"item2_sum={item2_sum:,.0f}, "
                        f"diff={item1_value-item2_sum:,.0f}"
                    )
                
                # 표시용 항목명들 (경로에서 마지막 부분 추출)
                item1_display = rule['항목1'].split(' > ')[-1] if ' > ' in rule['항목1'] else rule['항목1']
                item2_displays = [item.split(' > ')[-1] if ' > ' in item else item for item in rule['항목2']]
                
                results.append(FootingResultItem(
                    item=f"{rule_name} ({item1_display} {rule['연산자']} {'+'.join(item2_displays)})",
                    expected=item2_sum,
                    actual=item1_value,
                    is_match=is_match,
                    children=child_results
                ))
                
            except Exception as e:
                logging.error(f"Error checking special rule {rule_name}: {str(e)}")
                results.append(FootingResultItem(
                    item=rule_name,
                    is_match=False,
                    children=[]
                ))
        
        return results

    def _check_sum(self, df: pd.DataFrame, parent: str, children: List[str], rules: Dict) -> FootingResultItem:
        """항목별 합계 검증 (경로 기반)"""
        try:
            # 부모 항목 값 찾기 (경로 또는 항목명으로)
            parent_rows = df[(df['경로'] == parent) | (df['항목명'] == parent)]
            if parent_rows.empty:
                logging.warning(f"Parent item not found: {parent}")
                return FootingResultItem(
                    item=parent,
                    is_match=False,
                    children=[]
                )
            
            # 부모 항목 값 (여러 개 있을 경우 합산)
            parent_value = float(parent_rows['금액'].sum())
            
            # 자식 항목들의 합 계산
            child_results = []
            child_sum = 0
            
            for child in children:
                multiplier = -1 if child.startswith('-') else 1
                child_path = child.lstrip('-')
                
                try:
                    # 경로로 정확히 매칭
                    child_rows = df[df['경로'] == child_path]
                    if child_rows.empty:
                        # 경로가 없으면 항목명으로 시도 (하위 호환성)
                        child_name = child_path.split(' > ')[-1] if ' > ' in child_path else child_path
                        child_rows = df[df['항목명'] == child_name]
                        
                    if child_rows.empty:
                        logging.warning(f"Child item not found: {child_path} (parent: {parent})")
                        child_results.append(FootingResultItem(
                            item=child_path,
                            is_match=False,
                            children=[]
                        ))
                        continue
                    
                    # 자식 항목 값 (여러 개 있을 경우 합산)
                    child_value = float(child_rows['금액'].sum()) * multiplier
                    child_sum += child_value
                    
                    # 자식 항목이 부모인 경우 재귀적으로 검증
                    if child_path in rules and isinstance(rules[child_path], list):
                        child_result = self._check_sum(df, child_path, rules[child_path], rules)
                    else:
                        # 경로에서 마지막 항목명 추출하여 표시
                        display_name = child_path.split(' > ')[-1] if ' > ' in child_path else child_path
                        child_result = FootingResultItem(
                            item=display_name,
                            expected=None,
                            actual=child_value,
                            is_match=True,
                            children=[]
                        )
                        
                    child_results.append(child_result)
                    
                except (IndexError, ValueError) as e:
                    logging.error(f"Error processing child {child_path}: {str(e)}")
                    child_results.append(FootingResultItem(
                        item=child_path,
                        is_match=False,
                        children=[]
                    ))
            
            # 합계 비교 (반올림 오차 허용)
            is_match = abs(parent_value - child_sum) < 0.01
            
            if not is_match:
                logging.warning(
                    f"Mismatch in {parent}: "
                    f"expected={child_sum:,.0f}, "
                    f"actual={parent_value:,.0f}, "
                    f"diff={parent_value-child_sum:,.0f}"
                )
            else:
                logging.info(
                    f"✅ Match in {parent}: "
                    f"expected={child_sum:,.0f}, "
                    f"actual={parent_value:,.0f}"
                )
            
            # 표시용 항목명 (경로에서 마지막 부분 추출)
            display_name = parent.split(' > ')[-1] if ' > ' in parent else parent
            
            return FootingResultItem(
                item=display_name,
                expected=child_sum,
                actual=parent_value,
                is_match=is_match,
                children=child_results
            )
            
        except Exception as e:
            logging.error(f"Error checking sum for {parent}: {str(e)}")
            return FootingResultItem(
                item=parent,
                is_match=False,
                children=[]
            )