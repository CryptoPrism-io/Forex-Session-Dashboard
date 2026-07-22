# Backend-only image for the split architecture:
#   frontend  -> GitHub Pages
#   backend   -> AWS Lightsail Containers (this image)
#
# The root Dockerfile builds the legacy single-container Cloud Run image that also
# served the React bundle. That target is dead (GCP billing removed 2026-07-22).
# Deliberately NOT copied here: server/.env — secrets are injected at deploy time
# from Secrets Manager (/cryptoprism/forex/*), never baked into a layer.

FROM node:20-alpine AS deps
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
# omit=dev keeps the runtime image free of build-only packages
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./

# Drop root before running the app
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8080/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
