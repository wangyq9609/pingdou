.PHONY: help install dev build start stop restart logs clean test

help:
	@echo "拼豆图片转图纸工具 - 可用命令："
	@echo "  make install  - 安装所有依赖"
	@echo "  make dev      - 启动开发环境"
	@echo "  make build    - 构建Docker镜像"
	@echo "  make start    - 启动所有服务"
	@echo "  make stop     - 停止所有服务"
	@echo "  make restart  - 重启所有服务"
	@echo "  make logs     - 查看日志"
	@echo "  make clean    - 清理容器和卷"
	@echo "  make test     - 运行测试"

install:
	@echo "安装后端依赖..."
	cd backend && npm install
	@echo "安装前端依赖..."
	cd frontend && npm install
	@echo "生成Prisma客户端..."
	cd backend && npx prisma generate
	@echo "依赖安装完成！"

dev:
	@echo "启动开发环境..."
	@echo "请在两个终端分别运行："
	@echo "  终端1: cd backend && npm run dev"
	@echo "  终端2: cd frontend && npm run dev"

build:
	@echo "构建Docker镜像..."
	docker-compose build

start:
	@echo "启动所有服务..."
	docker-compose up -d
	@echo "服务已启动！"
	@echo "前端: http://localhost"
	@echo "后端: http://localhost:4000"

stop:
	@echo "停止所有服务..."
	docker-compose down

restart:
	@echo "重启所有服务..."
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	@echo "清理容器和卷..."
	docker-compose down -v
	@echo "清理完成！"

test:
	@echo "运行后端测试..."
	cd backend && npm test
	@echo "运行前端测试..."
	cd frontend && npm test
