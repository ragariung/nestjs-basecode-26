FROM node:24-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
# Full deps (not --omit=dev) so `prisma` and `ts-node` are available inside
# the container for `docker compose exec api npm run prisma:migrate:deploy`
# / `db:seed`. NODE_ENV is set *after* this so npm doesn't skip devDeps
# during install (npm skips them automatically whenever NODE_ENV=production
# is already set, regardless of --omit=dev).
RUN npm ci && npm run prisma:generate

ENV NODE_ENV=production
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
