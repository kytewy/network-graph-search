FROM node:20-slim

# Install everything
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Node dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy everything
COPY . .

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Build Next.js
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]