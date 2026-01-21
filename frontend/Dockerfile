# 前端 Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# 复制依赖文件（package-lock.json 已在 .dockerignore 中排除）
COPY package.json ./

# 安装依赖（使用 npm install 确保可选依赖正确安装）
RUN npm install

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产环境镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
