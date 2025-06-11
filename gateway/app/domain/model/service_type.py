# service_type.py
import os
from enum import Enum

class ServiceType(str, Enum):
    STOCKTREND = "stocktrend"
    COMPANY = "company"
    DSDGEN = "dsdgen"
    USER = "user"
    XBRLGEN = "xbrlgen"
    ESGDSD = "esgdsd"
    CHATBOT = "chatbot"

SERVICE_URLS = {
    ServiceType.STOCKTREND: os.getenv("STOCKTREND_SERVICE_URL"),
    ServiceType.COMPANY: os.getenv("COMPANY_SERVICE_URL"),
    ServiceType.DSDGEN: os.getenv("DSDGEN_SERVICE_URL"),
    ServiceType.USER: os.getenv("USER_SERVICE_URL"),
    ServiceType.XBRLGEN: os.getenv("XBRLGEN_SERVICE_URL"),
    ServiceType.ESGDSD: os.getenv("ESGDSD_SERVICE_URL"),
    ServiceType.CHATBOT: os.getenv("CHATBOT_SERVICE_URL"),
}
