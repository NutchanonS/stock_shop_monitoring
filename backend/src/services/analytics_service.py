import pandas as pd
import numpy as np
from src.core.config import settings
from pathlib import Path
from datetime import datetime

from src.core.config import settings
from src.repos.csv_inventory_repo import CsvInventoryRepo
from src.repos.csv_sales_repo import CsvSalesRepo
class AnalyticsService:
    def __init__(self):
        self.inv = CsvInventoryRepo()
        self.sales = CsvSalesRepo()    
    def _clean(self, df: pd.DataFrame) -> list[dict]:
        return (
            df
            .replace([np.inf, -np.inf], 0)
            .fillna(0)
            .to_dict("records")
        )

    def inventory_summary(self):
        df = pd.read_csv(settings.INVENTORY_CSV)

        df["stock_value_at_cost"] = (
            df["number"].fillna(0) * df["cost"].fillna(0)
        )

        return {
            "total_skus": int(df.shape[0]),
            "total_units": int(df["number"].fillna(0).sum()),
            "total_cost_value": float(df["stock_value_at_cost"].sum()),
            "by_type": self._clean(
                df.groupby("type", dropna=False)["number"]
                  .sum()
                  .reset_index()
            ),
        }

    def sales_daily(self):
        try:
            s = pd.read_csv(settings.SALES_CSV)
        except FileNotFoundError:
            return {"daily": [], "monthly": [], "top_products": []}

        if s.empty:
            return {"daily": [], "monthly": [], "top_products": []}

        s["ts"] = pd.to_datetime(s["ts"], errors="coerce")
        s = s.dropna(subset=["ts"])

        s["date"] = s["ts"].dt.date.astype(str)
        s["month"] = s["ts"].dt.to_period("M").astype(str)

        daily = (
            s.groupby("date")
             .agg(
                orders=("sale_id", "nunique"),
                units=("qty", "sum"),
                amount=("total_line", "sum"),
             )
             .reset_index()
        )

        monthly = (
            s.groupby("month")
             .agg(
                orders=("sale_id", "nunique"),
                units=("qty", "sum"),
                amount=("total_line", "sum"),
             )
             .reset_index()
        )

        top_products = (
            s.groupby(["product_no", "product_name"])
             .agg(
                units=("qty", "sum"),
                amount=("total_line", "sum"),
             )
             .reset_index()
             .sort_values("amount", ascending=False)
             .head(20)
        )

        return {
            "daily": self._clean(daily),
            "monthly": self._clean(monthly),
            "top_products": self._clean(top_products),
        }
    
    def _load_sales_with_cost(self):
        sales = pd.read_csv(settings.SALES_CSV)
        inv = pd.read_csv(settings.INVENTORY_CSV)

        sales["ts"] = pd.to_datetime(sales["ts"], utc=True)

        # ⬅️ include product type + misc metadata
        inv_cols = [
            "No_",
            "name",
            "type",
            "cost"
        ]

        sales = sales.merge(
            inv[inv_cols],
            left_on="product_no",
            right_on="No_",
            how="left"
        )

        sales["cost_total"] = sales["qty"] * sales["cost"].fillna(0)
        sales["profit"] = sales["total_line"] - sales["cost_total"]

        return sales

    
    def sales_timeseries(self, period: str = "day"):
        s = self._load_sales_with_cost()

        if period == "month":
            s["period"] = s["ts"].dt.to_period("M").astype(str)
        else:
            s["period"] = s["ts"].dt.date.astype(str)

        g = s.groupby("period").agg(
            revenue=("total_line", "sum"),
            cost=("cost_total", "sum"),
            profit=("profit", "sum")
        ).reset_index().sort_values("period")

        return g.to_dict("records")
    
    def top_products(self, period: str = "month", month: str | None = None):
        s = self._load_sales_with_cost()

        # ---------- period bucketing ----------
        if period == "week":
            s["period"] = s["ts"].dt.to_period("W").astype(str)
        else:
            s["period"] = s["ts"].dt.to_period("M").astype(str)

        # ---------- filter specific month if provided ----------
        if month:
            s = s[s["period"] == month]

        # ---------- aggregate ----------
        g = (
            s.groupby(["product_name", "type"])
             .agg(
                units=("qty", "sum"),
                revenue=("total_line", "sum"),
                cost_total=("cost_total", "sum"),
                profit=("profit", "sum"),
             )
             .reset_index()
        )

        top = (
            g.sort_values("revenue", ascending=False)
             .head(7)
        )

        return self._clean(top)

    # =========================================================
    # latest sale date (for default dashboard filter)
    # =========================================================
    def get_latest_sales_date(self):
        df = self.sales.read_df()
        if df.empty:
            return {"latest_date": None}

        # assume ts = ISO string
        df["date"] = pd.to_datetime(df["ts"]).dt.date
        latest = df["date"].max()

        return {"latest_date": latest.isoformat()}


    # =========================================================
    # sales detail for a date range (group by product)
    # =========================================================
    def get_sales_detail(self, start: str, end: str):
        sales_df = self.sales.read_df()
        inv_df = self.inv.read_df()

        if sales_df.empty:
            return []

        sales_df["date"] = pd.to_datetime(sales_df["ts"]).dt.date

        start_d = datetime.fromisoformat(start).date()
        end_d = datetime.fromisoformat(end).date()

        sales_df = sales_df[
            (sales_df["date"] >= start_d) &
            (sales_df["date"] <= end_d)
        ]

        if sales_df.empty:
            return []

        # values from POS cart
        sales_df["qty"] = sales_df["qty"].astype(int)
        sales_df["unit_price"] = sales_df["unit_price"].astype(float)

        # 👇 THIS IS ACTUAL SOLD PRICE (from POS)
        sales_df["line_total"] = sales_df["qty"] * sales_df["unit_price"]

        grouped = (
            sales_df
            .groupby("product_no", as_index=False)
            .agg(
                units_sold=("qty", "sum"),
                revenue_total=("line_total", "sum")  # <-- ACTUAL SOLD PRICE
            )
        )

        merged = grouped.merge(
            inv_df,
            left_on="product_no",
            right_on="No_",
            how="left"
        )

        # inventory-based reference prices
        merged["cost_total"] = (
            merged["units_sold"] * merged["cost"].fillna(0)
        )

        merged["sell_lower_total"] = (
            merged["units_sold"] * merged["sell_price_lower"].fillna(0)
        )

        merged["sell_avg_total"] = (
            merged["units_sold"] * merged["sell_price_avg"].fillna(0)
        )

        # OLD “expected profit” (from inventory avg price)
        merged["profit_total"] = (
            merged["sell_avg_total"] - merged["cost_total"]
        )

        # NEW — TRUE PROFIT FROM POS PRICE
        merged["actual_profit_total"] = (
            merged["revenue_total"] - merged["cost_total"]
        )

        return [
            {
                "product_no": int(r["product_no"]),

                "name": r.get("name", ""),
                "piece_per_cost": r.get("piece_per_cost", 0),

                "units_sold": int(r["units_sold"]),

                # reference inventory prices
                "cost": float(r.get("cost", 0)),
                "sell_price_lower": float(r.get("sell_price_lower", 0)),
                "sell_price_avg": float(r.get("sell_price_avg", 0)),

                # expected profit (inventory avg price)
                "profit": float(r.get("profit_total", 0)),

                # totals from inventory price levels
                "cost_total": float(r.get("cost_total", 0)),
                "sell_lower_total": float(r.get("sell_lower_total", 0)),
                "sell_avg_total": float(r.get("sell_avg_total", 0)),

                # 👇 NEW — TRUE ACTUAL PRICE
                "actual_sold_total": float(r.get("revenue_total", 0)),

                # 👇 NEW — TRUE PROFIT FROM POS SOLD PRICE
                "actual_profit_total": float(r.get("actual_profit_total", 0)),

                "description": r.get("description", ""),
                "remark": r.get("remark", ""),
                "localtion": r.get("localtion", ""),
                "type": r.get("type", "")
            }
            for _, r in merged.iterrows()
        ]
