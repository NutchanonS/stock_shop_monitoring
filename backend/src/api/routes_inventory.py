from fastapi import APIRouter
from src.services.inventory_service import InventoryService
from src.domain.schemas import ProductUpdate

router = APIRouter(prefix="/inventory", tags=["inventory"])
svc = InventoryService()

@router.get("/search")
def search(q: str | None = None, type: str | None = None):
    return svc.search(q, type)

@router.patch("/{product_no}")
def update(product_no: int, body: ProductUpdate):
    return svc.update(product_no, body.model_dump())
