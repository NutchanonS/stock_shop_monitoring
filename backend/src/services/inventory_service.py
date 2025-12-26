from src.repos.csv_inventory_repo import CsvInventoryRepo

class InventoryService:
    def __init__(self):
        self.repo = CsvInventoryRepo()

    def search(self, q: str | None, type_: str | None):
        df = self.repo.search(q, type_)
        # print('--------from inventory service---------')
        # print(df.to_dict(orient="records"))
        # print('------------')
        return df.to_dict(orient="records")

    def update(self, product_no: int, updates: dict):
        self.repo.update_product_fields(product_no, updates)
        return {"ok": True}
