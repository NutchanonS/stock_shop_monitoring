import pandas as pd
from typing import Optional
from src.core.config import settings
from src.repos.locks import file_lock
import os

LOCK_FILE = os.path.join(settings.DATA_DIR, "locks", "inventory.lock")

class CsvInventoryRepo:
    def __init__(self, path: str = settings.INVENTORY_CSV):
        self.path = path

    def read_df(self) -> pd.DataFrame:
        return pd.read_csv(self.path)

    def write_df(self, df: pd.DataFrame) -> None:
        df.to_csv(self.path, index=False)

    def search(self, q: Optional[str], type_: Optional[str]) -> pd.DataFrame:
        # print('------------from CsvInventoryRepo:----------------')
        df = self.read_df()
        try:
            df = df.sort_values('type').reset_index(drop=True)
        except:
            pass

        # df['No_'] = df.index + 1
        df = df.fillna('null')
        # print('------------from CsvInventoryRepo:', df.head(),'----------------', df.columns)
        if q:
            df = df[df["name"].astype(str).str.contains(q, case=False, na=False)]
        if type_:
            df = df[df["type"].astype(str).str.contains(type_, case=False, na=False)]
        return df

    def update_product_fields(self, product_no: int, updates: dict) -> pd.DataFrame:
        os.makedirs(os.path.dirname(LOCK_FILE), exist_ok=True)
        with file_lock(LOCK_FILE):
            df = self.read_df()
            idx = df.index[df["No_"] == product_no]
            if len(idx) == 0:
                raise KeyError(f"Product No_={product_no} not found")
            i = idx[0]
            for k, v in updates.items():
                if v is not None:
                    df.at[i, k] = v
            self.write_df(df)
        return df

    def decrement_stock(self, product_no: int, qty: int) -> None:
        os.makedirs(os.path.dirname(LOCK_FILE), exist_ok=True)
        with file_lock(LOCK_FILE):
            df = self.read_df()
            idx = df.index[df["No_"] == product_no]
            if len(idx) == 0:
                raise KeyError(f"Product No_={product_no} not found")
            i = idx[0]
            current = int(df.at[i, "number"])
            if current < qty:
                raise ValueError(f"Not enough stock for No_={product_no} (have {current}, need {qty})")
            df.at[i, "number"] = current - qty
            self.write_df(df)

    def create_product(self, data: dict):
        os.makedirs(os.path.dirname(LOCK_FILE), exist_ok=True)

        with file_lock(LOCK_FILE):
            df = self.read_df()
            print('==============create_product1===================')

            # ensure No_ exists as python int
            if "No_" in df:
                max_no = df["No_"].max()
                max_no = int(max_no) if pd.notna(max_no) else 0
            else:
                max_no = 0

            next_no = max_no + 1
            data["No_"] = int(next_no)

            print('==============create_product2===================')

            # keep python types (avoid numpy.int64)
            row = pd.DataFrame([data], dtype=object)

            df = pd.concat([df, row], ignore_index=True)

            print('==============create_product3', df.head(2), '=================')

            self.write_df(df)

        return data


    
    def increment_stock(self, product_no: int, qty: int):
        print('==============increment=================')
        df = self.read_df()

        idx = df.index[df["No_"] == product_no]
        print('==============increment2', df[df["No_"] == product_no], '========')
        if not len(idx):
            raise KeyError("Product not found")

        i = idx[0]
        df.at[i, "number"] = int(df.at[i, "number"]) + int(qty)

        self.write_df(df)
        print('==============increment3', df.head(2),'=================')
        return {"ok": True, "new_stock": df.at[i, "number"]}

