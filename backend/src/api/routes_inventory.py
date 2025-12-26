from fastapi import APIRouter, HTTPException
from src.services.inventory_service import InventoryService
from src.domain.schemas import ProductUpdate, ProductCreate

router = APIRouter(prefix="/inventory", tags=["inventory"])
svc = InventoryService()

@router.get("/search")
def search(q: str | None = None, type: str | None = None):
    print('//////// search //////////')
    return svc.search(q, type)

@router.patch("/{product_no}")
def update(product_no: int, body: ProductUpdate):
    print('//////// update //////////')
    return svc.update(product_no, body.model_dump())

@router.post("")
def create(body: ProductCreate):
    print('//////// create //////////')
    return svc.create(body.model_dump())
    
@router.post("/{product_no}/add-stock")
def add_stock(product_no: int, qty: int):
    print('//////// add stock //////////')
    return svc.add_stock(product_no, qty)
