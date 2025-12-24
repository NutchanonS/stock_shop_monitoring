from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Product(BaseModel):
    No_: int
    name: str
    piece_per_cost: int
    number: int
    cost: float
    sell_price_lower: float
    sell_price_avg: float
    profit: float
    description: Optional[str] = ""
    remark: Optional[str] = ""
    localtion: Optional[str] = ""
    type: Optional[str] = ""

class ProductUpdate(BaseModel):
    number: Optional[int] = None
    sell_price_lower: Optional[float] = None
    sell_price_avg: Optional[float] = None
    remark: Optional[str] = None
    localtion: Optional[str] = None
    type: Optional[str] = None

class CartItem(BaseModel):
    product_no: int
    qty: int = Field(ge=1)
    unit_price: float

class Cart(BaseModel):
    customer_id: str
    items: List[CartItem] = []

class CheckoutRequest(BaseModel):
    customer_id: str
    items: List[CartItem]

class CheckoutResponse(BaseModel):
    sale_id: str
    ts: datetime
    total: float
