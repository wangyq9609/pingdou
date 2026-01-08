# 部署指南

本文档提供详细的部署步骤。

## Docker 部署（推荐）

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

### 快速部署

1. **克隆项目**

```bash
git clone <repository_url>
cd pingdou
```

2. **配置环境变量**

创建 `.env` 文件（可选，使用默认值也能运行）：

```bash
# JWT密钥（生产环境请务必修改）
JWT_SECRET=your-super-secret-jwt-key-please-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-please-change

# CORS来源（如果部署到域名，修改为实际域名）
CORS_ORIGIN=http://your-domain.com
```

3. **启动所有服务**

```bash
docker-compose up -d
```

4. **运行数据库迁移**

首次部署时需要运行数据库迁移：

```bash
docker-compose exec backend npx prisma migrate deploy
```

5. **访问应用**

- 前端: http://localhost
- 后端API: http://localhost:4000
- 健康检查: http://localhost:4000/health

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（⚠️ 会删除数据库数据）
docker-compose down -v
```

## 手动部署

### 后端部署

1. **安装依赖**

```bash
cd backend
npm install
```

2. **配置环境变量**

创建 `backend/.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pingdou?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=4000
NODE_ENV=production
CORS_ORIGIN="http://your-domain.com"
```

3. **生成Prisma客户端**

```bash
npm run prisma:generate
```

4. **运行数据库迁移**

```bash
npm run prisma:migrate
```

5. **构建**

```bash
npm run build
```

6. **启动**

```bash
npm start
```

或使用PM2（推荐）：

```bash
npm install -g pm2
pm2 start dist/server.js --name pingdou-backend
pm2 save
pm2 startup
```

### 前端部署

1. **安装依赖**

```bash
cd frontend
npm install
```

2. **配置环境变量**

创建 `frontend/.env.production` 文件：

```env
VITE_API_URL=http://your-domain.com/api
```

3. **构建**

```bash
npm run build
```

4. **部署到Nginx**

将 `dist` 目录的内容复制到Nginx的web根目录：

```bash
sudo cp -r dist/* /var/www/html/
```

Nginx配置示例（`/etc/nginx/sites-available/pingdou`）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/html;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API反向代理
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/pingdou /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS配置

### 使用Let's Encrypt（免费）

```bash
# 安装certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 数据库备份

### 自动备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/backups/pingdou"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份PostgreSQL
docker-compose exec -T postgres pg_dump -U pingdou pingdou > $BACKUP_DIR/db_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql"
```

设置定时任务（crontab）：

```bash
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

## 监控

### 使用PM2监控

```bash
pm2 monit
pm2 status
pm2 logs
```

### 健康检查

```bash
# 后端健康检查
curl http://localhost:4000/health

# 数据库连接检查
docker-compose exec postgres pg_isready -U pingdou

# Redis检查
docker-compose exec redis redis-cli ping
```

## 性能优化

1. **启用Redis持久化**（已在docker-compose中配置）

2. **数据库连接池优化**

在 `backend/.env` 中：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pingdou?schema=public&connection_limit=20"
```

3. **Nginx缓存配置**

```nginx
# 在http块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# 在location /api块中添加
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_key "$scheme$request_method$host$request_uri";
```

## 故障排查

### 数据库连接失败

```bash
# 检查数据库是否运行
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 进入数据库容器
docker-compose exec postgres psql -U pingdou
```

### 后端启动失败

```bash
# 查看后端日志
docker-compose logs backend

# 检查环境变量
docker-compose exec backend env | grep DATABASE_URL
```

### 前端无法访问API

```bash
# 检查CORS配置
curl -I http://localhost:4000/health

# 检查Nginx配置
nginx -t
```

## 扩展部署

### 使用Kubernetes

提供基础的Kubernetes配置：

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pingdou-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pingdou-backend
  template:
    metadata:
      labels:
        app: pingdou-backend
    spec:
      containers:
      - name: backend
        image: your-registry/pingdou-backend:latest
        ports:
        - containerPort: 4000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: pingdou-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pingdou-secrets
              key: jwt-secret
```

### 负载均衡

使用Nginx作为负载均衡器：

```nginx
upstream backend_servers {
    least_conn;
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}

server {
    location /api {
        proxy_pass http://backend_servers;
    }
}
```

## 安全建议

1. **修改所有默认密码**
2. **启用HTTPS**
3. **配置防火墙**（只开放80/443端口）
4. **定期更新依赖**
5. **启用日志审计**
6. **限制数据库远程访问**
7. **使用强JWT密钥**（至少32个字符）

## 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建和部署
docker-compose down
docker-compose up -d --build

# 运行新的迁移（如果有）
docker-compose exec backend npx prisma migrate deploy
```

## 回滚

```bash
# 查看镜像历史
docker images

# 使用特定版本的镜像
docker-compose down
docker-compose up -d pingdou-backend:v1.0.0
```
