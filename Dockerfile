# Development Dockerfile for Next.js + Python with full ML stack
FROM node:18

WORKDIR /app

# Install Python and system dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable pnpm

# Copy and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application code
COPY . .

# Build Next.js
RUN pnpm build

# Environment variables
ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3

EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]