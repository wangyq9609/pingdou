# 快速部署指南

## 前置要求

- Docker >= 20.10
- Docker Compose V2（内置）或 V1

## 一键部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd pingdou

# 2. 运行部署脚本（自动检测 Docker Compose 版本）
chmod +x deploy.sh
./deploy.sh
```

## 手动部署

```bash
# 1. 创建环境变量文件
cat > .env << EOF
POSTGRES_USER=pingdou
POSTGRES_PASSWORD=your-password
POSTGRES_DB=pingdou
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=http://localhost
EOF

# 2. 启动服务（使用 docker compose 或 docker-compose）
docker compose up -d

# 3. 查看状态
docker compose ps
docker compose logs -f
```

## 访问地址

- 前端: http://localhost
- 后端API: http://localhost:4000/health

## 常用命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f backend
```

详细文档请查看 [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)
