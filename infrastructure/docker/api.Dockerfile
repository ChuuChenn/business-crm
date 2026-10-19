# syntax=docker/dockerfile:1.7
# API NestJS. Build: docker build -f infrastructure/docker/api.Dockerfile .
FROM node:22.22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
# Tùy chọn: mạng doanh nghiệp có proxy TLS riêng → docker build --secret id=extra_ca,src=<ca.pem>
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    pnpm install --frozen-lockfile
RUN pnpm --filter @crm/api... build
# Gói production: chỉ dependency runtime (không có prisma CLI, vitest...).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    pnpm --filter @crm/api deploy --prod --legacy --prefer-offline /out \
 && cp -r apps/api/dist /out/dist

# Chạy migration (job một lần trước khi khởi động API): docker compose run --rm migrate
FROM build AS migrate
WORKDIR /repo/apps/api
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM node:22.22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
