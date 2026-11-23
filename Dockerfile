FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
RUN groupadd --system --gid 1001 pumamap && useradd --system --uid 1001 --gid pumamap pumamap
COPY --from=builder --chown=pumamap:pumamap /app/.next/standalone ./
COPY --from=builder --chown=pumamap:pumamap /app/.next/static ./.next/static
COPY --from=builder --chown=pumamap:pumamap /app/public ./public
USER pumamap
EXPOSE 3000
CMD ["node","server.js"]
