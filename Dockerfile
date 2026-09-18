# ==============================================================================
# 杨林生活网 (iyanglin.com) - 多阶段轻量化生产 Dockerfile
# Stage 1: deps -> Stage 2: builder -> Stage 3: runner
# ==============================================================================

# ------------------------------------------------------------------------------
# 阶段 1: 依赖安装 (deps)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 复制依赖声明文件
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# 阶段 2: 编译构建 (builder)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma 客户端并执行生产打包
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# 阶段 3: 生产运行时 (runner)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3006
ENV HOSTNAME="0.0.0.0"

# 创建非 root 运行用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 仅拷贝 Standalone 必需产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 授权运行目录
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3006

# 启动 Standalone Server
CMD ["node", "server.js"]
