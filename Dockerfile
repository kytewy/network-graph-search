# Production Dockerfile for Next.js + Python with ML stack
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

# Copy and install Node dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Build Next.js (creates .next/standalone/)
RUN pnpm build

# Copy standalone output and static files
RUN cp -r .next/standalone/. . && \
    cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public

# Runtime environment variables
ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3

EXPOSE 3000

# Use standalone server instead of next start
CMD ["node", "server.js"]