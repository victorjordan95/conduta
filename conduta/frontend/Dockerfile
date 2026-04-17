# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Aceita a URL do backend em tempo de build
ARG VITE_API_URL=https://seudominio.com
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Production image (Nginx) ──────────────────────────────────
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
