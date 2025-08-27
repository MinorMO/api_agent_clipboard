# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar deps (incluye dev para compilar TS)
COPY package*.json ./
RUN npm ci

# Copiar fuentes y compilar a dist/
COPY tsconfig.json ./
COPY src ./src
# (si tienes estáticos:)
# COPY public ./public

RUN npm run build   # genera ./dist

# ---------- Runtime stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# tini para gestionar señales correctamente
RUN apk add --no-cache tini

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar artefactos compilados
COPY --from=builder --chown=node:node /app/dist ./dist
# Copiar migraciones a donde las espera el runtime (dist/db/migrations)
COPY --from=builder --chown=node:node /app/src/db/migrations ./dist/db/migrations
# (opcional: estáticos)
# COPY --from=builder --chown=node:node /app/public ./public

# Preparar storage persistente
RUN mkdir -p /app/data/files && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=6 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","dist/app/server.js"]