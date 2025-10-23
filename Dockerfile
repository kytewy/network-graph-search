# Production Dockerfile for Next.js + Python with ML stack
FROM node:20-slim AS base

WORKDIR /app

# Install Python and system dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Builder stage
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Build Next.js
RUN npm run build

# Runner stage
FROM base AS runner

ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.*/dist-packages /usr/local/lib/python3.11/dist-packages

# Copy Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/backend ./backend

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]