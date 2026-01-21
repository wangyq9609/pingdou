# 后端 Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括devDependencies用于构建）
RUN npm ci && \
    npm cache clean --force

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 生产环境镜像
FROM node:20-alpine

WORKDIR /app

# 复制package.json和prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# 安装生产依赖和prisma（用于迁移）
RUN npm ci --only=production && \
    npm install prisma --save-dev && \
    npm cache clean --force

# 生成 Prisma Client
RUN npx prisma generate

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 4000

# 启动命令
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
