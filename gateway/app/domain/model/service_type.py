# service_type.py
import os
from enum import Enum

class ServiceType(str, Enum):
    STOCKTREND = "stocktrend"
    DART_CONVERTER = "dart_converter"
    STOCKPRICE = "stockprice"
    VALIDATION = "validation"
    NEWSCLASSIFIER = "newsclassifier"
    SUMMARIZER = "summarizer"
    ISSUE = "issue"
    KPI_COMPARE = "kpi_compare"
    WEEKLY_DISCLOSURE = "weekly_disclosure"
    WEEKLY_ISSUE = "weekly_issue"
    WEEKLY_STOCKPRICE = "weekly_stockprice"

SERVICE_URLS = {
    ServiceType.STOCKTREND: os.getenv("STOCKTREND_SERVICE_URL"),
    ServiceType.DART_CONVERTER: os.getenv("DART_CONVERTER_SERVICE_URL"),
    ServiceType.STOCKPRICE: os.getenv("STOCKPRICE_SERVICE_URL"),
    ServiceType.VALIDATION: os.getenv("VALIDATION_SERVICE_URL"),
    ServiceType.NEWSCLASSIFIER: os.getenv("NEWSCLASSIFIER_SERVICE_URL"),
    ServiceType.SUMMARIZER: os.getenv("SUMMARIZER_SERVICE_URL"),
    ServiceType.ISSUE: os.getenv("ISSUE_SERVICE_URL"),
    ServiceType.KPI_COMPARE: os.getenv("KPI_COMPARE_SERVICE_URL"),
    ServiceType.WEEKLY_DISCLOSURE: os.getenv("WEEKLY_DISCLOSURE_SERVICE_URL"),
    ServiceType.WEEKLY_ISSUE: os.getenv("WEEKLY_ISSUE_SERVICE_URL"),
    ServiceType.WEEKLY_STOCKPRICE: os.getenv("WEEKLY_STOCKPRICE_SERVICE_URL"),
}
