import csv, os, uuid
from datetime import datetime, timezone
from src.core.config import settings
from src.repos.locks import file_lock

LOCK_FILE = os.path.join(settings.DATA_DIR, "locks", "sales.lock")

class CsvSalesRepo:
    def __init__(self, path: str = settings.SALES_CSV):
        self.path = path

    def _ensure_file(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        if not os.path.exists(self.path):
            with open(self.path, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(["sale_id","ts","customer_id","product_no","product_name","qty","unit_price","total_line"])

    def append_lines(self, customer_id: str, lines: list[dict]) -> tuple[str, datetime]:
        self._ensure_file()
        os.makedirs(os.path.dirname(LOCK_FILE), exist_ok=True)

        sale_id = str(uuid.uuid4())
        ts = datetime.now(timezone.utc)

        with file_lock(LOCK_FILE):
            with open(self.path, "a", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                for ln in lines:
                    w.writerow([
                        sale_id,
                        ts.isoformat(),
                        customer_id,
                        ln["product_no"],
                        ln["product_name"],
                        ln["qty"],
                        ln["unit_price"],
                        ln["total_line"],
                    ])
        return sale_id, ts
