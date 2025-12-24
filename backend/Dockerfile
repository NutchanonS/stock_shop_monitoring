FROM python:3.11-slim

WORKDIR /app

# install dependencies
COPY pyproject.toml /app/
RUN pip install --no-cache-dir -U pip && pip install --no-cache-dir .

# copy source code
COPY src /app/src
COPY data /app/data

# 🔑 IMPORTANT: tell Python where "app" lives
ENV PYTHONPATH=/app/src

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host=0.0.0.0", "--port=8000"]
