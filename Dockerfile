FROM node:22-slim AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN npx prisma generate
RUN pnpm run build:ts

FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV FASTIFY_PORT=3000
ENV FASTIFY_ADDRESS=0.0.0.0

EXPOSE 3000

CMD ["pnpm", "start"]
