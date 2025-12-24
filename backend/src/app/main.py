from fastapi import FastAPI
from src.core.cors import apply_cors
from src.api.routes_inventory import router as inventory_router
from src.api.routes_cart import router as cart_router
from src.api.routes_analytics import router as analytics_router

def create_app() -> FastAPI:
    app = FastAPI(title="Stock Shop", version="0.1.0")
    apply_cors(app)

    app.include_router(inventory_router)
    app.include_router(cart_router)
    app.include_router(analytics_router)

    @app.get("/health")
    def health():
        return {"ok": True}

    return app

app = create_app()
