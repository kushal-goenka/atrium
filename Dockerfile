# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 atrium \
  && adduser --system --uid 1001 atrium

COPY --from=builder --chown=atrium:atrium /app/.next/standalone ./
COPY --from=builder --chown=atrium:atrium /app/.next/static ./.next/static
COPY --from=builder --chown=atrium:atrium /app/public ./public
COPY --from=builder --chown=atrium:atrium /app/prisma ./prisma

USER atrium
EXPOSE 3000
CMD ["node", "server.js"]
