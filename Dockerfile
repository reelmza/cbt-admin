# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined into the bundle during `next build`,
# so they must exist BEFORE the build runs. Override at build time with:
#   --build-arg NEXT_PUBLIC_ISLOCAL=1
ARG NEXT_PUBLIC_ISLOCAL=1
ENV NEXT_PUBLIC_ISLOCAL=$NEXT_PUBLIC_ISLOCAL

RUN npm run build

# ---- Stage 2: Run ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
