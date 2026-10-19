# syntax=docker/dockerfile:1.7
# Web Next.js (output: standalone). Build: docker build -f infrastructure/docker/web.Dockerfile .
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
RUN pnpm --filter @crm/web... build

FROM node:22.22-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
