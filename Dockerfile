# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install --global npm@12.0.2 --no-audit --no-fund \
    && npm install --include=dev --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN npm run build \
    && test -f dist/index.html \
    && test -f dist/server.cjs \
    && npm prune --omit=dev --legacy-peer-deps \
    && npm install --omit=dev --legacy-peer-deps --no-save --no-audit --no-fund vite@6.4.3

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 8080

CMD ["node", "dist/server.cjs"]
