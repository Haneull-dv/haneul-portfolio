from fastapi import APIRouter, Depends
from app.domain.controller.kpi_compare_controller import KpiCompareController

router = APIRouter()

@router.get("/")
def get_kpi_data(controller: KpiCompareController = Depends()):
    print("Router layer reached")
    return controller.get_kpi_data()
