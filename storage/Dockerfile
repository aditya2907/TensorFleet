FROM python:3.11-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8081

# Production WSGI server (long --timeout for large model up/downloads)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8081", "--timeout", "300", "main:app"]
