import csv
import uuid
import random
from datetime import datetime, timedelta, timezone

# ================= CONFIG =================
OUTPUT_FILE = "sales.csv"

DAYS_BACK = 180  # ~6 months
SALES_PER_DAY_MIN = 5
SALES_PER_DAY_MAX = 15

CUSTOMERS = [
    "walkin-1",
    "walkin-2",
    "walkin-3",
    "VIP-01",
]

# product_no, product_name, product_type, unit_price
PRODUCTS = [
    (13, "USB MP3 player รถ DZ-529", "USB MP3", 550.0),
    (14, "USB MP3 player รถ DZ-599", "USB MP3", 600.0),
    (15, "USB MP3 player รถ KEVLAR K-2200B", "USB MP3", 850.0),
    (16, "USB MP3 player รถ XL-9", "USB MP3", 1100.0),
    (17, "USB MP3 player ROADSTAR (RS101-MP3)", "USB MP3", 950.0),

    (1, "ไมค์ลอย mba 888a (U3)", "MICROPHONE", 1800.0),
    (2, "ไมค์ลอย mba 888a (U1)", "MICROPHONE", 1900.0),
    (3, "ไมค์ลอย sound milan ml-6675", "MICROPHONE", 1800.0),
    (6, "ไมค์ลอย npe", "MICROPHONE", 380.0),

    (18, "AMP MBA MB7000 AV-191A", "AMP", 3500.0),
    (19, "AMP FANNY AV-168A", "AMP", 2900.0),
    (24, "AMP SOUNDMILAN AV-302", "AMP", 3500.0),
]

# ================= GENERATE =================
start_date = datetime.now(timezone.utc) - timedelta(days=DAYS_BACK)
end_date = datetime.now(timezone.utc)

rows = []

current_date = start_date
while current_date.date() <= end_date.date():
    sales_today = random.randint(SALES_PER_DAY_MIN, SALES_PER_DAY_MAX)

    for _ in range(sales_today):
        product_no, product_name, product_type, unit_price = random.choice(PRODUCTS)
        qty = random.randint(1, 3)

        ts = current_date.replace(
            hour=random.randint(9, 21),
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
            microsecond=random.randint(0, 999999),
        )

        total_line = qty * unit_price

        rows.append([
            str(uuid.uuid4()),
            ts.isoformat(),
            random.choice(CUSTOMERS),
            product_no,
            product_name,
            product_type,
            qty,
            float(unit_price),
            float(total_line),
        ])

    current_date += timedelta(days=1)

# ================= WRITE CSV =================
with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "sale_id",
        "ts",
        "customer_id",
        "product_no",
        "product_name",
        "product_type",
        "qty",
        "unit_price",
        "total_line",
    ])
    writer.writerows(rows)

print(f"✅ Generated {len(rows)} rows → {OUTPUT_FILE}")
