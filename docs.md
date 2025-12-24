stock-shop/
  README.md
  docker-compose.yml
  .env.example

  backend/
    Dockerfile
    pyproject.toml
    src/
      app/
        __init__.py
        main.py

        core/
          config.py
          cors.py

        domain/
          models.py
          schemas.py

        services/
          inventory_service.py
          cart_service.py
          analytics_service.py

        repos/
          csv_inventory_repo.py
          csv_sales_repo.py
          locks.py

        api/
          routes_inventory.py
          routes_cart.py
          routes_analytics.py

    data/
      data.csv          # your inventory
      sales.csv         # generated (append-only)
      locks/            # file locks if needed (or just directory placeholder)

  frontend/
    Dockerfile
    package.json
    vite.config.js
    index.html
    src/
      main.jsx
      api.js
      App.jsx
      pages/
        Inventory.jsx
        POS.jsx
        Dashboard.jsx
      components/
        Tabs.jsx
        ProductTable.jsx
        CartPanel.jsx
        KPI.jsx
