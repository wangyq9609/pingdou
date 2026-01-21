#!/bin/bash

# Docker 更新脚本 - 简洁版

set -e

echo "🔄 开始更新应用..."

# 检测 Docker Compose 命令
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ 错误: 未安装 Docker Compose"
    exit 1
fi

# 拉取最新代码（如果使用 git）
if [ -d .git ]; then
    echo "📥 拉取最新代码..."
    git pull
fi

# 重新构建并启动
echo "🔨 重新构建镜像..."
$DOCKER_COMPOSE build --no-cache

echo "🚀 重启服务..."
$DOCKER_COMPOSE up -d

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo "✅ 更新完成！"
echo ""
echo "📋 查看日志: $DOCKER_COMPOSE logs -f"
