# ---------- Build ----------
FROM node:20-slim AS build
WORKDIR /app
ENV CI=true

# openssl so Prisma picks correct engine at build time
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# deps
COPY package*.json ./
RUN npm ci

# prisma client generation (dev deps available here)
COPY prisma ./prisma
RUN npx prisma generate

# source
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---------- Runtime (API) ----------
FROM node:20-slim AS api
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# openssl needed by Prisma engine at runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# only prod deps for API
COPY package*.json ./
RUN npm ci --omit=dev

# runtime artifacts + prisma engines
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma

EXPOSE 8080
CMD ["node", "dist/main.js"]

# ---------- Job (migrations) ----------
FROM node:20-slim AS migrate
WORKDIR /app
ENV NODE_ENV=development

# openssl required for Prisma engine during migrate as well
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# include dev deps so `npx prisma` exists
COPY package*.json ./
RUN npm ci

# prisma engines + schema (from build)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma

# Cloud Run Job will override command if needed; default is OK
CMD ["npx", "prisma", "migrate", "deploy"]