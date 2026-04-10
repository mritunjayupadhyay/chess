FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ---- Install dependencies ----
FROM base AS deps
WORKDIR /app

COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/chess-logic/package.json ./packages/chess-logic/
COPY tsconfig.base.json ./

RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
WORKDIR /app

COPY packages/chess-logic ./packages/chess-logic
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm turbo run build --filter=api

# ---- Production ----
FROM node:20-slim AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/chess-logic/dist ./packages/chess-logic/dist
COPY --from=build /app/packages/chess-logic/package.json ./packages/chess-logic/

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/main"]
