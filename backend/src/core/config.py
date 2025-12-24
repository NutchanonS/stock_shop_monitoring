from pydantic import BaseModel
import os

class Settings(BaseModel):
    DATA_DIR: str = os.getenv("DATA_DIR", "/app/data")
    INVENTORY_CSV: str = os.getenv("INVENTORY_CSV", "/app/data/data.csv")
    SALES_CSV: str = os.getenv("SALES_CSV", "/app/data/sales.csv")

settings = Settings()
