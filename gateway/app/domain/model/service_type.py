# service_type.py
import os
from enum import Enum

class ServiceType(str, Enum):
    STOCKTREND = "stocktrend"
    DSDGEN = "dsdgen"
    STOCKPRICE = "stockprice"
    DSDCHECK = "dsdcheck"

SERVICE_URLS = {
    ServiceType.STOCKTREND: os.getenv("STOCKTREND_SERVICE_URL"),
    ServiceType.DSDGEN: os.getenv("DSDGEN_SERVICE_URL"),
    ServiceType.STOCKPRICE: os.getenv("STOCKPRICE_SERVICE_URL"),
    ServiceType.DSDCHECK: os.getenv("DSDCHECK_SERVICE_URL"),
}
