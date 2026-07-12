FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install the CPU-only torch wheel first so `torch>=2.2` in requirements.txt
# is already satisfied — the default PyPI wheel bundles CUDA (~2GB extra).
RUN pip install --no-cache-dir torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 worker && \
    chown -R worker:worker /app
USER worker

# Expose metrics port
EXPOSE 8000

# Health check (python stdlib — curl is not installed in this image)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=5)" || exit 1

# Run with a production WSGI server.
# Single worker (-w 1): the in-memory training-jobs dict and ThreadPoolExecutor
# must live in one process; threads provide request concurrency.
# --timeout 600 accommodates ?sync=true training requests.
CMD ["gunicorn", "-w", "1", "--threads", "4", "-b", "0.0.0.0:8000", "--timeout", "600", "api_server:app"]
