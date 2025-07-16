# service_type.py
import os
from enum import Enum

class ServiceType(str, Enum):
    STOCKTREND = "stocktrend"
    DSDGEN = "dsdgen"
    STOCKPRICE = "stockprice"
    DSDCHECK = "dsdcheck"
    NEWSCLASSIFIER = "newsclassifier"
    SUMMARIZER = "summarizer"
    ISSUE = "issue"
    KPI_COMPARE = "kpi_compare"
    WEEKLY_DISCLOSURE = "weekly_disclosure"
    WEEKLY_ISSUE = "weekly_issue"
    WEEKLY_STOCKPRICE = "weekly_stockprice"
    CONANAI_DSDCHECK = "conanai_dsdcheck"
    CONANAI_DSDGEN = "conanai_dsdgen"

SERVICE_URLS = {
    ServiceType.STOCKTREND: os.getenv("STOCKTREND_SERVICE_URL"),
    ServiceType.DSDGEN: os.getenv("DSDGEN_SERVICE_URL"),
    ServiceType.STOCKPRICE: os.getenv("STOCKPRICE_SERVICE_URL"),
    ServiceType.DSDCHECK: os.getenv("DSDCHECK_SERVICE_URL"),
    ServiceType.NEWSCLASSIFIER: os.getenv("NEWSCLASSIFIER_SERVICE_URL"),
    ServiceType.SUMMARIZER: os.getenv("SUMMARIZER_SERVICE_URL"),
    ServiceType.ISSUE: os.getenv("ISSUE_SERVICE_URL"),
    ServiceType.KPI_COMPARE: os.getenv("KPI_COMPARE_SERVICE_URL"),
    ServiceType.WEEKLY_DISCLOSURE: os.getenv("WEEKLY_DISCLOSURE_SERVICE_URL"),
    ServiceType.WEEKLY_ISSUE: os.getenv("WEEKLY_ISSUE_SERVICE_URL"),
    ServiceType.WEEKLY_STOCKPRICE: os.getenv("WEEKLY_STOCKPRICE_SERVICE_URL"),
    ServiceType.CONANAI_DSDCHECK: os.getenv("CONANAI_DSDCHECK_SERVICE_URL"),
    ServiceType.CONANAI_DSDGEN: os.getenv("CONANAI_DSDGEN_SERVICE_URL"),
}
