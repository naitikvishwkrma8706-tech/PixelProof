
FROM node:22-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Node.js dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy backend and AI model
WORKDIR /app
COPY backend/ ./backend/
COPY ai-model/ ./ai-model/

# Install Python dependencies
RUN pip install --no-cache-dir -r ./ai-model/requirements.txt

WORKDIR /app/backend

EXPOSE 10000

CMD ["npm", "start"]
