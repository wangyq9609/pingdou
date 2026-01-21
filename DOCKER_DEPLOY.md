# Docker 部署指南

## 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0
- Linux 系统

## 快速部署

### 方式一：一键部署（推荐）

```bash
# 运行部署脚本（会自动创建.env文件）
chmod +x deploy.sh
./deploy.sh
```

脚本会自动：
- 检查Docker环境
- 创建.env配置文件（如果不存在）
- 构建并启动所有服务
- 检查服务健康状态

### 方式二：手动部署

#### 1. 配置环境变量

```bash
# 创建.env文件
cat > .env << EOF
POSTGRES_USER=pingdou
POSTGRES_PASSWORD=your-strong-password
POSTGRES_DB=pingdou
POSTGRES_PORT=5432
REDIS_PORT=6379
BACKEND_PORT=4000
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=http://localhost
FRONTEND_PORT=80
EOF

# 编辑环境变量（重要：修改密码和密钥）
vim .env
```

**必须修改的配置：**
- `POSTGRES_PASSWORD`: 数据库密码
- `JWT_SECRET`: JWT密钥（使用强随机字符串）
- `JWT_REFRESH_SECRET`: Refresh Token密钥
- `CORS_ORIGIN`: 前端访问地址（如：https://yourdomain.com）

#### 2. 构建并启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 验证部署

```bash
# 检查后端健康状态
curl http://localhost:4000/health

# 检查前端
curl http://localhost
```

## 常用命令

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（注意：会删除数据库数据）
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 进入容器
docker-compose exec backend sh
docker-compose exec postgres psql -U pingdou -d pingdou
```

## 服务说明

- **前端**: http://localhost (端口80)
- **后端API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 数据持久化

数据存储在Docker卷中：
- `postgres_data`: 数据库数据
- `redis_data`: Redis数据

备份数据：
```bash
# 备份数据库
docker-compose exec postgres pg_dump -U pingdou pingdou > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U pingdou pingdou < backup.sql
```

## 生产环境建议

1. **使用HTTPS**: 配置Nginx反向代理，添加SSL证书
2. **修改默认密码**: 确保所有密码和密钥都已更改
3. **限制端口暴露**: 生产环境建议只暴露80/443端口
4. **配置防火墙**: 限制数据库和Redis的外部访问
5. **定期备份**: 设置数据库自动备份任务
6. **监控日志**: 使用日志收集工具监控服务状态

## 故障排查

```bash
# 查看所有容器状态
docker-compose ps

# 查看错误日志
docker-compose logs --tail=100 backend

# 重启服务
docker-compose restart backend

# 完全重建
docker-compose down
docker-compose up -d --build
```
