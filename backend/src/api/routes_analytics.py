from fastapi import APIRouter, Query
from src.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])
svc = AnalyticsService()

@router.get("/inventory-summary")
def inventory_summary():
    return svc.inventory_summary()

@router.get("/sales-summary")
def sales_summary():
    return svc.sales_daily()

@router.get("/timeseries")
def timeseries(period: str = "day"):
    return svc.sales_timeseries(period)

@router.get("/top-products")
def top_products(period: str = "month"):
    return svc.top_products(period)

@router.get("/sales-latest-date")
def get_latest_sales_date():
    """
    Returns most recent sale date from sales.csv
    Used to auto-select default dashboard period
    """
    return svc.get_latest_sales_date()


@router.get("/sales-detail")
def get_sales_detail(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD")
):
    """
    Returns aggregated sales rows for a date range
    Grouped by product
    """
    return svc.get_sales_detail(start, end)
