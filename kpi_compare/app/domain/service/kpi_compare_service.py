from fastapi import APIRouter, Depends, HTTPException

class KpiCompareService:
    def get_kpi_data(self):
        print("Service layer reached")
        return {"message": "Hello from Service"}

def get_kpi_compare_service():
    return KpiCompareService()
