FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm prisma generate
RUN pnpm build


FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated

USER app

EXPOSE 4000

CMD ["node", "dist/src/server.js"]
