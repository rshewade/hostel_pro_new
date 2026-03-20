# =============================================================================
# Hostel Pro — Multi-stage Bun + Next.js Build
# =============================================================================

# Stage 1: Dependencies
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN bun install --frozen-lockfile || bun install

# Stage 2: Build
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Sharp needs native deps
RUN apk add --no-cache vips-dev build-base

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Stage 3: Production
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create uploads directory
RUN mkdir -p uploads && chown nextjs:nodejs uploads
VOLUME ["/app/uploads"]

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
