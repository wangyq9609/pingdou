# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY prisma ./prisma/

# 只安装生产依赖
RUN npm ci --only=production

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 4000

# 启动命令
CMD ["npm", "start"]
