# Build from monorepo root: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @charts-generator/contracts build
RUN pnpm --filter @charts-generator/ui build
RUN pnpm --filter @charts-generator/web build

ENV NODE_ENV=production
WORKDIR /repo
EXPOSE 3000
CMD ["pnpm", "--filter", "@charts-generator/web", "start"]
