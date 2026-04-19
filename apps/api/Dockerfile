# Build from monorepo root: docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @charts-generator/contracts build
RUN pnpm --filter @charts-generator/api build

ENV NODE_ENV=production
WORKDIR /repo
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
