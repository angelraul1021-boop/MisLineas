FROM node:24-bookworm-slim AS base

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS build

COPY . .

RUN pnpm build

FROM node:24-bookworm-slim AS production

ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=build --chown=node:node /usr/src/app/public ./public
COPY --from=build --chown=node:node /usr/src/app/.next/standalone ./
COPY --from=build --chown=node:node /usr/src/app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
