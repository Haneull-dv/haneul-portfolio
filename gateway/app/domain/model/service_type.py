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

SERVICE_URLS = {
    ServiceType.STOCKTREND: os.getenv("STOCKTREND_SERVICE_URL"),
    ServiceType.DSDGEN: os.getenv("DSDGEN_SERVICE_URL"),
    ServiceType.STOCKPRICE: os.getenv("STOCKPRICE_SERVICE_URL"),
    ServiceType.DSDCHECK: os.getenv("DSDCHECK_SERVICE_URL"),
    ServiceType.NEWSCLASSIFIER: os.getenv("NEWSCLASSIFIER_SERVICE_URL"),
    ServiceType.SUMMARIZER: os.getenv("SUMMARIZER_SERVICE_URL"),
    ServiceType.ISSUE: os.getenv("ISSUE_SERVICE_URL"),
}
