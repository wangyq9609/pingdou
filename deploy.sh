#!/bin/bash

# Docker 部署脚本

set -e

echo "🚀 开始部署拼豆应用..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未安装 Docker"
    exit 1
fi

# 检测 Docker Compose 命令（兼容新旧版本）
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ 使用 Docker Compose (新版本)"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    echo "✅ 使用 Docker Compose (旧版本)"
else
    echo "❌ 错误: 未安装 Docker Compose"
    echo "   请安装 Docker Compose 或使用 Docker Desktop"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，正在创建..."
    cat > .env << EOF
# 数据库配置
POSTGRES_USER=pingdou
POSTGRES_PASSWORD=pingdou123
POSTGRES_DB=pingdou
POSTGRES_PORT=5432

# Redis配置
REDIS_PORT=6379

# 后端服务配置
BACKEND_PORT=4000
NODE_ENV=production

# JWT密钥（生产环境请使用强随机字符串）
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# CORS配置
CORS_ORIGIN=http://localhost

# 前端端口
FRONTEND_PORT=80
EOF
    echo "✅ 已创建 .env 文件，请检查并修改配置"
    echo "⚠️  重要: 请修改数据库密码和CORS_ORIGIN"
    read -p "按回车键继续部署..."
fi

# 停止旧容器
echo "🛑 停止旧容器..."
$DOCKER_COMPOSE down

# 构建并启动
echo "🔨 构建镜像..."
$DOCKER_COMPOSE build

echo "🚀 启动服务..."
$DOCKER_COMPOSE up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
$DOCKER_COMPOSE ps

# 检查健康状态
echo "🏥 检查健康状态..."
if curl -f http://localhost:4000/health &> /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "⚠️  后端服务可能未就绪，请检查日志: $DOCKER_COMPOSE logs backend"
fi

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 服务地址:"
echo "   前端: http://localhost"
echo "   后端: http://localhost:4000"
echo ""
echo "📋 常用命令:"
echo "   查看日志: $DOCKER_COMPOSE logs -f"
echo "   停止服务: $DOCKER_COMPOSE down"
echo "   重启服务: $DOCKER_COMPOSE restart"
