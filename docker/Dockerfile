# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci

# fuentes
COPY tsconfig.json ./
COPY src ./src

# compila a dist/
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# tini para manejo correcto de señales
RUN apk add --no-cache tini && mkdir -p /app/data/files && chown -R node:node /app

# solo prod deps
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

# binarios compilados
COPY --chown=node:node dist ./dist

USER node
EXPOSE 3000

# healthcheck interno (usa /healthz)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=6 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","dist/app/server.js"]
