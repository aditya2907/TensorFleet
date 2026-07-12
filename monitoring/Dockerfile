FROM python:3.11-slim

WORKDIR /app

# Install Docker CLI for scaling workers
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8082

# -w 1 (single worker) is required: scaling state (jobs_data, workers_data,
# scaling_config, auto-shrink thread) lives in process memory and would
# diverge across multiple gunicorn workers. Threads provide concurrency.
CMD ["gunicorn", "-w", "1", "--threads", "8", "-b", "0.0.0.0:8082", "--timeout", "120", "main:app"]
