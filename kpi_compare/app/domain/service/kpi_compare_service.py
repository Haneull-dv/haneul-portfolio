import os
import httpx
import pandas as pd
import operator
import ast
from cachetools import TTLCache
from fastapi import HTTPException
import re
from app.config.companies import SUPPORTED_COMPANIES

# Railway 배포를 위한 환경변수 기반 dotenv 로드
ENV = os.getenv("ENV", "development")
if ENV == "development":
    from dotenv import load_dotenv
    load_dotenv()
    print(f"[서비스] 개발환경: .env 파일 로드됨")
else:
    print(f"[서비스] 배포환경: .env 파일 로드하지 않음")

# 🚀 Railway 환경변수 동적 로드 함수
def get_dart_api_key():
    """Railway에서 환경변수를 동적으로 가져오는 함수"""
    dart_key = os.getenv("DART_API_KEY")
    if not dart_key:
        # Railway에서 환경변수가 늦게 로드되는 경우를 대비
        print("⚠️ [Railway] DART_API_KEY 첫 번째 시도 실패, 재시도 중...")
        import time
        time.sleep(1)  # 1초 대기 후 재시도
        dart_key = os.getenv("DART_API_KEY")
        if dart_key:
            print("✅ [Railway] DART_API_KEY 재시도 성공!")
        else:
            print("❌ [Railway] DART_API_KEY 재시도도 실패")
    return dart_key

DART_API_KEY = get_dart_api_key()
DART_API_URL = "https://opendart.fss.or.kr/api"
KPI_METADATA_PATH = os.path.join(os.path.dirname(__file__), '../../data/KPI_for_dashboard_final.csv')

ACCOUNT_ID_ALIASES = {
    'ifrs_full_Revenue': ['ifrs-full_Revenue', 'ifrs_Revenue', 'dart_OperatingRevenue', 'dart_Sales'],
    'dart_OperatingIncomeLoss': ['dart_OperatingIncomeLoss', 'ifrs-full_OperatingIncomeLoss', 'ifrs_OperatingIncomeLoss'],
    'ifrs_full_ProfitLoss': ['ifrs-full_ProfitLoss', 'ifrs_ProfitLoss', 'dart_ProfitLossForFinancialStatements'],
    'ifrs_full_Assets': ['ifrs-full_Assets', 'ifrs_Assets'],
    'ifrs_full_Liabilities': ['ifrs-full_Liabilities', 'ifrs_Liabilities'],
    'ifrs_full_Equity': ['ifrs-full_Equity', 'ifrs_Equity'],
    'ifrs_full_CurrentAssets': ['ifrs-full_CurrentAssets', 'ifrs_CurrentAssets'],
    'ifrs_full_CurrentLiabilities': ['ifrs-full_CurrentLiabilities', 'ifrs_CurrentLiabilities'],
    'ifrs_full_CashFlowsFromUsedInOperatingActivities': ['ifrs-full_CashFlowsFromUsedInOperatingActivities', 'ifrs_CashFlowsFromUsedInOperatingActivities']
}

cache = TTLCache(maxsize=100, ttl=600)

class KpiCompareService:
    def __init__(self):
        # 🚀 Railway에서 런타임 시 DART API 키 재확인
        self.dart_api_key = get_dart_api_key()
        if not self.dart_api_key:
            print("⚠️ [Railway] KpiCompareService 초기화 시 DART_API_KEY 누락, test_key 사용")
            self.dart_api_key = "test_key"
        else:
            print(f"✅ [Railway] KpiCompareService 초기화 성공, DART_API_KEY 길이: {len(self.dart_api_key)}")
        
        self.kpi_meta = self._load_kpi_metadata()

    def _load_kpi_metadata(self):
        try:
            df = pd.read_csv(KPI_METADATA_PATH, dtype=str)
            df.set_index('재무지표명', inplace=True)
            print("📊 KPI 메타데이터 로드 완료")
            return df
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail=f"KPI 메타데이터 파일을 찾을 수 없습니다: {KPI_METADATA_PATH}")

    def _find_financial_value(self, financials_for_year: dict, python_safe_id: str):
        aliases = ACCOUNT_ID_ALIASES.get(python_safe_id, [python_safe_id.replace('_', '-')])
        for alias_id in aliases:
            if alias_id in financials_for_year:
                return financials_for_year[alias_id]
        return None

    def _find_company_by_query(self, query: str):
        normalized_query = query.lower().replace(" ", "").strip()
        for company in SUPPORTED_COMPANIES:
            if (normalized_query == company['corp_name'].lower().replace(" ", "").strip() or 
                normalized_query == company['corp_code']):
                return company
        return None

    async def search_company(self, query: str):
        normalized_query = query.lower().replace(" ", "").strip()
        results = [c for c in SUPPORTED_COMPANIES if normalized_query in c['corp_name'].lower().replace(" ", "")]
        return {"query": query, "results": results}

    async def get_reports(self, query: str):
        company = self._find_company_by_query(query)
        if not company: raise HTTPException(status_code=404, detail="지원하지 않는 기업")
        corp_code = company['corp_code']
        cache_key = f"reports_{corp_code}"
        if cache_key in cache: return cache[cache_key]
        params = {"crtfc_key": self.dart_api_key, "corp_code": corp_code, "bgn_de": "20220101", "pblntf_ty": "A"}
        data = await self._dart_api_call(f"{DART_API_URL}/list.json", params)
        report_types = ["사업보고서", "반기보고서", "분기보고서"]
        filtered_reports = [r for r in data.get("list", []) if any(rt in r.get("report_nm", "") for rt in report_types)]
        cache[cache_key] = filtered_reports
        return filtered_reports

    def _safe_eval_expression(self, expression: str, context: dict):
        try:
            allowed_operators = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.USub: operator.neg, ast.UAdd: operator.pos}
            allowed_functions = {'ABS': abs}
            def _eval(node):
                if isinstance(node, ast.Num): return node.n
                elif isinstance(node, ast.Name):
                    if node.id in context: return context[node.id]
                    raise NameError(f"Variable '{node.id}' not found")
                elif isinstance(node, ast.BinOp):
                    left, right = _eval(node.left), _eval(node.right)
                    op = allowed_operators.get(type(node.op))
                    if op:
                        if isinstance(node.op, ast.Div) and right == 0: raise ZeroDivisionError("Division by zero")
                        return op(left, right)
                    raise ValueError(f"Unsupported operator: {type(node.op)}")
                elif isinstance(node, ast.UnaryOp):
                    operand = _eval(node.operand)
                    op = allowed_operators.get(type(node.op))
                    if op: return op(operand)
                    raise ValueError(f"Unsupported unary operator: {type(node.op)}")
                elif isinstance(node, ast.Call):
                    if node.func.id in allowed_functions:
                        args = [_eval(arg) for arg in node.args]
                        return allowed_functions[node.func.id](*args)
                    raise NameError(f"Unsupported function call: {node.func.id}")
                raise ValueError(f"Unsupported node type: {type(node)}")
            tree = ast.parse(expression, mode='eval')
            return _eval(tree.body)
        except ZeroDivisionError: raise
        except Exception as e: raise

    async def _get_financials_for_report(self, corp_code, bsns_year, reprt_code):
        current_year = int(bsns_year)
        previous_year = current_year - 1
        financials = {current_year: {}, previous_year: {}}
        params = {"crtfc_key": self.dart_api_key, "corp_code": corp_code, "bsns_year": str(current_year), "reprt_code": reprt_code, "fs_div": "CFS"}
        print(f"  -> 🌏 [DART API 요청] Year: {current_year}, ReportCode: {reprt_code} (전기/당기 데이터 동시 요청)")
        data = await self._dart_api_call(f"{DART_API_URL}/fnlttSinglAcntAll.json", params)

        if data.get("status") == "013":
            print(f"  -> ⚠️ [데이터 없음] Year: {current_year}, ReportCode: {reprt_code}")
            return financials

        def parse_amount(amount_str):
            if not amount_str: return 0
            s_val = str(amount_str).replace(",", "").strip()
            return 0 if s_val == '-' else int(s_val)

        for item in data.get("list", []):
            account_id = item.get("account_id")
            if not account_id: continue
            if "thstrm_amount" in item: financials[current_year][account_id] = parse_amount(item["thstrm_amount"])
            if "frmtrm_amount" in item: financials[previous_year][account_id] = parse_amount(item["frmtrm_amount"])
        
        print(f"  -> ✅ [데이터 수신] 당기({current_year}): {len(financials[current_year])}개, 전기({previous_year}): {len(financials[previous_year])}개 계정 수신")
        return financials

    def _validate_and_format_kpi(self, kpi_name, value, unit):
        if isinstance(value, (int, float)):
            if '부채비율' in kpi_name and (value > 5000 or value < 0): return "N/A (값 확인 필요)"
            if '유동비율' in kpi_name and value > 5000: return "N/A (값 확인 필요)"
            if '증가율' in kpi_name and abs(value) > 5000: return "N/A (값 확인 필요)"
            # >>> 이 아래에 한 줄 추가 <<<
            if 'ROE' in kpi_name and abs(value) > 1000: return "N/A (값 확인 필요)"
            # >>> 여기까지 <<<
            if unit == '백만원': value /= 1_000_000
        
        if isinstance(value, float): return f"{value:,.2f}"
        elif isinstance(value, int): return f"{value:,}"
        return str(value)

    async def get_kpi_for_report(self, query: str, rcept_no: str, bsns_year: str, reprt_code: str):
        company = self._find_company_by_query(query)
        if not company: raise HTTPException(status_code=404, detail="지원하지 않는 기업")
        corp_code = company['corp_code']
        cache_key = f"kpi_{corp_code}_{bsns_year}_{reprt_code}"
        if cache_key in cache: return cache[cache_key]

        financials = await self._get_financials_for_report(corp_code, bsns_year, reprt_code)

        grouped_results = {}
        for kpi_name, row in self.kpi_meta.iterrows():
            formula = str(row['산식(AccountID)'])
            unit = row.get('단위', '')
            category = row.get('대분류', '')
            
            print(f"\n🧩 [KPI 처리 시작] {kpi_name}")

            try:
                eval_formula = formula
                context = {}
                
                # 1. 시계열 변수 처리 (e.g., ifrs_full_Revenue[t-1])
                time_vars_pattern = re.compile(r'([a-zA-Z0-9_]+)\[t([+-]?\d*)\]')
                time_vars_in_formula = {match.group(0) for match in time_vars_pattern.finditer(formula)}
                
                for var_str in time_vars_in_formula:
                    match = time_vars_pattern.match(var_str)
                    python_safe_id, offset_str = match.groups()
                    offset = int(offset_str or 0)
                    target_year = int(bsns_year) + offset
                    
                    value = self._find_financial_value(financials.get(target_year, {}), python_safe_id)
                    if value is None:
                        raise ValueError(f"필수 데이터 누락: {python_safe_id} ({target_year}년)")
                    
                    safe_name = f"{python_safe_id}_t{offset}".replace('-', '_minus_')
                    eval_formula = eval_formula.replace(var_str, safe_name)
                    context[safe_name] = value

                # 2. 일반 변수 처리
                tree = ast.parse(eval_formula)
                variable_names = {node.id for node in ast.walk(tree) if isinstance(node, ast.Name)}
                
                for python_safe_id in variable_names:
                    if python_safe_id in context or python_safe_id.upper() == 'ABS':
                        continue
                    
                    target_year = int(bsns_year)
                    value = self._find_financial_value(financials.get(target_year, {}), python_safe_id)
                    if value is None:
                        raise ValueError(f"필수 데이터 누락: {python_safe_id} ({target_year}년)")
                    
                    context[python_safe_id] = value

                print(f"  -> 🧮 [계산식] {eval_formula}")
                print(f"  -> 📊 [변수값] {context}")
                
                value = self._safe_eval_expression(eval_formula, context)
                formatted_value = self._validate_and_format_kpi(kpi_name, value, unit)

                print(f"  -> ✅ [KPI 계산완료] {kpi_name}: {formatted_value} {unit}")
                
                kpi_result = { "kpi_name": kpi_name, "value": formatted_value, "unit": unit, "category": category, "formula": row['산식(AccountID)'] }
                if category not in grouped_results: grouped_results[category] = []
                grouped_results[category].append(kpi_result)

            except ZeroDivisionError:
                print(f"  -> ❌ [KPI 계산 오류] {kpi_name}: 분모가 0입니다.")
                continue
            except Exception as e:
                print(f"  -> ❌ [KPI 계산 오류] {kpi_name}: {e}")
                continue
        
        final_results = {
            "company_name": company['corp_name'], "corp_code": corp_code, "bsns_year": bsns_year,
            "reprt_code": reprt_code, "categories": grouped_results,
            "total_kpi_count": sum(len(kpis) for kpis in grouped_results.values())
        }
        print(f"\n🏁 [KPI 계산 완료] {final_results['total_kpi_count']}개 KPI 계산됨")
        cache[cache_key] = final_results
        return final_results

    async def get_supported_companies(self):
        """지원하는 게임회사 목록을 반환합니다."""
        return {"companies": SUPPORTED_COMPANIES}

    async def _dart_api_call(self, url: str, params: dict):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                if data.get("status") not in ["000", "013"]:
                    raise HTTPException(status_code=400, detail=f"DART API 오류: {data.get('message')}")
                return data
            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=e.response.status_code, detail=f"DART API 요청 실패: {e.response.text}")
            except httpx.RequestError as e:
                raise HTTPException(status_code=503, detail=f"DART API 연결 실패: {e}")