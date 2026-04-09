FROM python:3.10-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the server code
COPY . .

# Expose Hugging Face default port
EXPOSE 7860

# Start FastAPI with uvicorn on HF port
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
