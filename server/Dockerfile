# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (for layer caching)
COPY server/package.json server/package-lock.json ./
RUN npm ci

# Copy source and build
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:22-alpine

WORKDIR /app

# Install production dependencies only
COPY server/package.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/build ./build

EXPOSE 3005

ENV PORT=3005

CMD ["node", "build/index.js"]
