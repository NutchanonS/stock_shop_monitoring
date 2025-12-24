from src.repos.csv_inventory_repo import CsvInventoryRepo
from src.repos.csv_sales_repo import CsvSalesRepo

class CartService:
    def __init__(self):
        self.inv = CsvInventoryRepo()
        self.sales = CsvSalesRepo()

    def checkout(self, customer_id: str, items: list[dict]):
        # Read inventory once for names
        inv_df = self.inv.read_df()

        sale_lines = []
        total = 0.0

        # First pass validate
        for it in items:
            pno = int(it["product_no"])
            qty = int(it["qty"])
            unit_price = float(it["unit_price"])

            row = inv_df[inv_df["No_"] == pno]
            if row.empty:
                raise KeyError(f"Product No_={pno} not found")
            stock = int(row.iloc[0]["number"])
            if stock < qty:
                raise ValueError(f"Not enough stock for No_={pno} (have {stock}, need {qty})")

        # Second pass mutate + log
        for it in items:
            pno = int(it["product_no"])
            qty = int(it["qty"])
            unit_price = float(it["unit_price"])

            row = inv_df[inv_df["No_"] == pno].iloc[0]
            name = str(row["name"])
            line_total = unit_price * qty
            total += line_total

            self.inv.decrement_stock(pno, qty)
            sale_lines.append({
                "product_no": pno,
                "product_name": name,
                "qty": qty,
                "unit_price": unit_price,
                "total_line": line_total
            })

        sale_id, ts = self.sales.append_lines(customer_id, sale_lines)
        return {"sale_id": sale_id, "ts": ts, "total": total}
