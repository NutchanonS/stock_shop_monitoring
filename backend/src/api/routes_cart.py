from fastapi import APIRouter
from src.services.cart_service import CartService
from src.domain.schemas import CheckoutRequest

router = APIRouter(prefix="/cart", tags=["cart"])
svc = CartService()

@router.post("/checkout")
def checkout(body: CheckoutRequest):
    return svc.checkout(body.customer_id, [it.model_dump() for it in body.items])
