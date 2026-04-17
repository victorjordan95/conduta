# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# ── Production image ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src
COPY package*.json ./

USER appuser

EXPOSE 3000

CMD ["node", "src/index.js"]
