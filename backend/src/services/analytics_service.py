import pandas as pd
import numpy as np
from src.core.config import settings

class AnalyticsService:
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
