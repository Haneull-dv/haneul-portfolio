import os
import httpx
import pandas as pd
import operator
import ast
from cachetools import TTLCache
from fastapi import HTTPException
from dotenv import load_dotenv
from app.config.companies import SUPPORTED_COMPANIES
import re

# .env 파일에서 환경 변수 로드
load_dotenv()

DART_API_KEY = os.getenv("DART_API_KEY")
DART_API_URL = "https://opendart.fss.or.kr/api"
KPI_METADATA_PATH = os.path.join(os.path.dirname(__file__), '../../data/KPI_for_dashboard_final.csv')

cache = TTLCache(maxsize=100, ttl=600)

class KpiCompareService:
    def __init__(self):
        self.dart_api_key = DART_API_KEY
        if not self.dart_api_key:
            print("⚠️ DART_API_KEY가 설정되지 않았습니다. 실제 DART API 호출은 불가능합니다.")
            self.dart_api_key = "test_key"  # 테스트용 더미 키
        self.kpi_meta = self._load_kpi_metadata()

    def _load_kpi_metadata(self):
        try:
            df = pd.read_csv(KPI_METADATA_PATH, dtype=str)
            df.set_index('재무지표명', inplace=True)
            print("📊 KPI 메타데이터 로드 완료")
            print(f"📝 [KPI 메타데이터 항목수] {len(df)}개")
            return df
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="KPI 메타데이터 파일을 찾을 수 없습니다.")

    def _find_company_by_query(self, query: str):
        normalized_query = query.lower().replace(" ", "").strip()
        for company in SUPPORTED_COMPANIES:
            normalized_name = company['corp_name'].lower().replace(" ", "").strip()
            if (normalized_query == normalized_name or
                normalized_query == company['corp_code']):
                print(f"🔍 [기업검색] '{query}' → {company}")
                return company
        print(f"❗️ [기업검색 실패] '{query}' (지원 안함)")
        return None

    async def search_company(self, query: str):
        normalized_query = query.lower().replace(" ", "").strip()
        results = [
            company for company in SUPPORTED_COMPANIES
            if normalized_query in company['corp_name'].lower().replace(" ", "").strip()
        ]
        print(f"🔍 [기업부분검색] '{query}' → {len(results)}건")
        return {"query": query, "results": results}

    async def get_reports(self, query: str):
        company = self._find_company_by_query(query)
        if not company:
            raise HTTPException(status_code=404, detail="지원하지 않는 기업이거나, 기업 정보를 찾을 수 없습니다.")
        
        corp_code = company['corp_code']
        cache_key = f"reports_{corp_code}"
        if cache_key in cache:
            print(f"💾 [보고서캐시 HIT] {corp_code}")
            return cache[cache_key]

        params = {
            "crtfc_key": self.dart_api_key,
            "corp_code": corp_code,
            "bgn_de": "20220101",
            "pblntf_ty": "A",
        }
        data = await self._dart_api_call(f"{DART_API_URL}/list.json", params)

        report_types = ["사업보고서", "반기보고서", "분기보고서"]
        filtered_reports = [
            report for report in data.get("list", [])
            if any(rt in report.get("report_nm", "") for rt in report_types)
        ]

        print(f"📑 [보고서목록] {corp_code} {len(filtered_reports)}건 반환")
        cache[cache_key] = filtered_reports
        return filtered_reports

    def _safe_eval_expression(self, expression: str, context: dict):
        """
        안전한 수식 계산을 위한 함수
        eval 대신 ast를 사용하여 안전하게 계산
        """
        try:
            # 허용된 연산자들
            allowed_operators = {
                ast.Add: operator.add,
                ast.Sub: operator.sub,
                ast.Mult: operator.mul,
                ast.Div: operator.truediv,
                ast.USub: operator.neg,
                ast.UAdd: operator.pos,
            }
            
            def _eval(node):
                if isinstance(node, ast.Num):  # 숫자
                    return node.n
                elif isinstance(node, ast.Name):  # 변수명
                    if node.id in context:
                        return context[node.id]
                    else:
                        raise NameError(f"Variable '{node.id}' not found")
                elif isinstance(node, ast.BinOp):  # 이항 연산
                    left = _eval(node.left)
                    right = _eval(node.right)
                    op = allowed_operators.get(type(node.op))
                    if op:
                        return op(left, right)
                    else:
                        raise ValueError(f"Unsupported operator: {type(node.op)}")
                elif isinstance(node, ast.UnaryOp):  # 단항 연산
                    operand = _eval(node.operand)
                    op = allowed_operators.get(type(node.op))
                    if op:
                        return op(operand)
                    else:
                        raise ValueError(f"Unsupported unary operator: {type(node.op)}")
                else:
                    raise ValueError(f"Unsupported node type: {type(node)}")
            
            # 표현식을 AST로 파싱
            tree = ast.parse(expression, mode='eval')
            result = _eval(tree.body)
            return result
            
        except Exception as e:
            print(f"❌ [수식 계산 오류] {expression}: {e}")
            raise

    def _extract_time_vars(self, formula):
        """
        산식에서 시계열 변수 추출: ifrs-full_Revenue[t-1] → (ifrs-full_Revenue, -1)
        """
        pattern = r'([a-zA-Z0-9\-_]+)\[t([+-]?\d*)\]'
        matches = re.findall(pattern, formula)
        return set((m[0], int(m[1] or 0)) for m in matches)

    def _substitute_time_vars(self, formula, year, financials):
        """
        산식 내 [t], [t-1] 등 시계열 변수를 실제 값으로 치환
        """
        def repl(match):
            var, offset = match.group(1), match.group(2)
            offset = int(offset or 0)
            target_year = int(year) + offset
            value = financials.get(target_year, {}).get(var)
            if value is None:
                raise ValueError(f"Missing value: {var}[{target_year}]")
            return str(value)
        return re.sub(r'([a-zA-Z0-9\-_]+)\[t([+-]?\d*)\]', repl, formula)

    async def _get_multi_year_financials(self, corp_code, years, reprt_code):
        """
        여러 연도(예: [t], [t-1]) 재무데이터를 한 번에 받아옴
        """
        result = {}
        for y in years:
            params = {
                "crtfc_key": self.dart_api_key,
                "corp_code": corp_code,
                "bsns_year": str(y),
                "reprt_code": reprt_code,
                "fs_div": "CFS",
            }
            data = await self._dart_api_call(f"{DART_API_URL}/fnlttSinglAcntAll.json", params)
            year_dict = {}
            for item in data.get("list", []):
                if item.get("thstrm_amount") and item.get("account_id"):
                    try:
                        amount_str = str(item["thstrm_amount"]).replace(",", "").replace("-", "")
                        if amount_str.isdigit():
                            amount = int(amount_str)
                            if str(item["thstrm_amount"]).startswith("-"):
                                amount = -amount
                            year_dict[item["account_id"]] = amount
                    except (ValueError, TypeError):
                        continue
            result[y] = year_dict
        return result

    async def get_kpi_for_report(self, query: str, rcept_no: str, bsns_year: str, reprt_code: str):
        company = self._find_company_by_query(query)
        if not company:
            raise HTTPException(status_code=404, detail="지원하지 않는 기업이거나, 기업 정보를 찾을 수 없습니다.")

        corp_code = company['corp_code']
        cache_key = f"kpi_{corp_code}_{bsns_year}_{reprt_code}"
        if cache_key in cache:
            print(f"💾 [KPI캐시 HIT] {cache_key}")
            return cache[cache_key]

        # KPI 산식에서 필요한 모든 연도 추출
        years_needed = set()
        for kpi_name, row in self.kpi_meta.iterrows():
            formula = str(row['산식(AccountID)'])
            for var, offset in self._extract_time_vars(formula):
                years_needed.add(int(bsns_year) + offset)
        years_needed.add(int(bsns_year))
        years_needed = sorted(years_needed)
        print(f"📅 [필요 연도] {years_needed}")

        # 여러 연도 재무데이터 한 번에 로드
        financials = await self._get_multi_year_financials(corp_code, years_needed, reprt_code)

        results = []
        grouped_results = {}
        for kpi_name, row in self.kpi_meta.iterrows():
            formula = str(row['산식(AccountID)'])
            unit = row.get('단위', '')
            category = row.get('대분류', '')
            account_ids_str = str(row.get('account_ids', ''))
            account_ids = [acc.strip() for acc in account_ids_str.split(',') if acc.strip() and acc.strip() != 'nan']
            print(f"\n🧩 [KPI] {kpi_name} | 필요계정: {account_ids} | 산식: {formula}")
            # 시계열 산식이면 치환, 아니면 기존 방식
            try:
                if '[t' in formula:
                    eval_formula = self._substitute_time_vars(formula, int(bsns_year), financials)
                    print(f"🕒 [시계열 치환식] {eval_formula}")
                    value = self._safe_eval_expression(eval_formula, {})
                else:
                    # 기존 방식: 올해 데이터만 사용
                    formula_context = {}
                    for account_id in account_ids:
                        v = financials.get(int(bsns_year), {}).get(account_id)
                        if v is not None:
                            formula_context[account_id.replace('-', '_')] = v
                            formula_context[account_id] = v
                    # 모든 계정이 있어야 계산
                    if any(financials.get(int(bsns_year), {}).get(a) is None for a in account_ids):
                        print(f"⚠️ [KPI 계산 SKIP] {kpi_name} (필요 계정 누락)")
                        continue
                    eval_formula = formula
                    for account_id in account_ids:
                        if account_id in eval_formula:
                            eval_formula = eval_formula.replace(account_id, account_id.replace('-', '_'))
                    print(f"🧮 [계산식] {eval_formula}")
                    print(f"📊 [변수값] {formula_context}")
                    value = self._safe_eval_expression(eval_formula, formula_context)
                print(f"✅ [KPI 계산완료] {kpi_name}: {value} {unit}")
                kpi_result = {
                    "kpi_name": kpi_name,
                    "value": f"{value:,.2f}" if isinstance(value, float) else f"{value:,}",
                    "unit": unit,
                    "category": category,
                    "formula": formula
                }
                if category not in grouped_results:
                    grouped_results[category] = []
                grouped_results[category].append(kpi_result)
            except Exception as e:
                print(f"❌ [KPI 계산 오류] {kpi_name}: {e}")
                continue
        final_results = {
            "company_name": company['corp_name'],
            "corp_code": corp_code,
            "bsns_year": bsns_year,
            "reprt_code": reprt_code,
            "categories": grouped_results,
            "total_kpi_count": sum(len(kpis) for kpis in grouped_results.values())
        }
        print(f"\n🏁 [KPI 계산 완료] {final_results['total_kpi_count']}개 KPI 계산됨")
        print(f"📋 [대분류별 현황] {[(cat, len(kpis)) for cat, kpis in grouped_results.items()]}")
        cache[cache_key] = final_results
        return final_results

    async def _dart_api_call(self, url: str, params: dict):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                if data.get("status") != "000":
                    print(f"❗️ [DART API 오류] {data.get('message')}")
                    raise HTTPException(status_code=400, detail=f"DART API 오류: {data.get('message')}")
                print(f"🌏 [DART 응답 성공] {url}")
                return data
            except httpx.HTTPStatusError as e:
                print(f"❌ [DART HTTP 오류] {e}")
                raise HTTPException(status_code=e.response.status_code, detail=f"DART API 요청 실패: {e.response.text}")
            except httpx.RequestError as e:
                print(f"❌ [DART API 연결 실패] {e}")
                raise HTTPException(status_code=503, detail=f"DART API 연결 실패: {e}")

def get_kpi_compare_service():
    return KpiCompareService()
