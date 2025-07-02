from fastapi import APIRouter, Depends
from app.domain.service.kpi_compare_service import KpiCompareService, get_kpi_compare_service

class KpiCompareController:
    def __init__(self, service: KpiCompareService = Depends(get_kpi_compare_service)):
        self.service = service

    def get_kpi_data(self):
        print("Controller layer reached")
        return self.service.get_kpi_data()

def get_kpi_compare_controller():
    return KpiCompareController()
