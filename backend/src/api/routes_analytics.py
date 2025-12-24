from fastapi import APIRouter
from src.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])
svc = AnalyticsService()

@router.get("/inventory-summary")
def inventory_summary():
    return svc.inventory_summary()

@router.get("/sales-summary")
def sales_summary():
    return svc.sales_daily()
