# 拼豆图片转图纸工具

[English](./README.md) | 简体中文

一个功能完整的拼豆图片转图纸Web应用，支持用户认证、兑换码激活、图片处理、网格渲染和导出功能。

## ✨ 功能特性

### 🔐 用户系统
- 用户注册/登录
- JWT认证 + Refresh Token
- 兑换码激活系统
- 限时使用权（30/90/365天）
- 个人中心管理

### 🎨 图像处理
- 图片上传（支持拖拽）
- 自定义网格尺寸（10x10 - 100x100）
- 智能颜色量化
- 精准颜色匹配（CIEDE2000算法）
- 实时Canvas预览

### 🎯 色板支持
- Perler 色板（16种颜色）
- Hama 色板（16种颜色）
- 自定义颜色选择
- 颜色数量控制

### 📥 导出功能
- PNG图纸导出
- PDF导出（含材料清单）
- 自动生成购买清单
- 颜色统计分析

## 🚀 快速开始

### 方式一：Docker部署（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd pingdou

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改JWT密钥

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 访问应用
# 前端: http://localhost
# 后端: http://localhost:4000
```

### 方式二：本地开发

#### 环境要求
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

#### 后端设置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

#### 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📖 使用说明

### 1. 注册账号

访问 http://localhost 点击"注册"按钮，填写用户名、邮箱和密码。

### 2. 激活账号

注册后需要使用兑换码激活账号。管理员可以通过API生成兑换码：

```bash
# 首先创建管理员账号并在数据库中将role改为admin

# 生成兑换码
curl -X POST http://localhost:4000/api/admin/redemption/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "codeType": "trial_30",
    "quantity": 10,
    "batchId": "BATCH_TEST"
  }'
```

### 3. 使用工具

1. 登录后进入激活页面，输入兑换码
2. 激活成功后，进入工作台
3. 上传图片
4. 调整参数（尺寸、颜色数量、色板品牌）
5. 点击"开始转换"
6. 查看预览和材料清单
7. 导出PNG或PDF

## 🏗️ 技术架构

### 后端技术栈
- **运行时**: Node.js 20 + TypeScript
- **框架**: Express.js
- **数据库**: PostgreSQL 15 (Prisma ORM)
- **缓存**: Redis 7
- **认证**: JWT + Refresh Token
- **加密**: bcrypt
- **日志**: Winston

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design
- **状态管理**: Zustand
- **路由**: React Router v6
- **Canvas**: Konva.js + React-Konva
- **PDF生成**: jsPDF
- **样式**: Tailwind CSS

### 部署
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx
- **反向代理**: Nginx (API代理)

## 📁 项目结构

```
pingdou/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置
│   │   ├── controllers/    # 控制器
│   │   ├── db/             # 数据库
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── server.ts       # 入口文件
│   ├── prisma/
│   │   └── schema.prisma   # 数据库模型
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── data/           # 静态数据
│   │   ├── pages/          # 页面
│   │   ├── services/       # API服务
│   │   ├── store/          # 状态管理
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml       # Docker编排
├── .env.example            # 环境变量示例
└── README.md
```

## 🔒 安全特性

- ✅ bcrypt密码加密（cost factor: 12）
- ✅ JWT访问令牌（2小时过期）
- ✅ Refresh Token（7天过期）
- ✅ API限流保护
- ✅ 兑换码单次使用
- ✅ SQL注入防护（Prisma ORM）
- ✅ XSS防护
- ✅ CORS配置

## 🎯 API文档

### 认证接口
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/logout` - 登出
- `POST /api/auth/refresh-token` - 刷新令牌

### 兑换码接口
- `POST /api/redemption/redeem` - 兑换激活码
- `GET /api/redemption/my-activations` - 查询激活记录
- `GET /api/redemption/check-status` - 检查激活状态

### 管理员接口
- `POST /api/admin/redemption/generate` - 生成兑换码
- `GET /api/admin/redemption/list` - 查询兑换码列表
- `POST /api/admin/redemption/revoke/:id` - 撤销兑换码

详细API文档请参见 [backend/README.md](./backend/README.md)

## 🛠️ 开发指南

### 数据库迁移

```bash
cd backend

# 创建新迁移
npx prisma migrate dev --name your_migration_name

# 应用迁移
npx prisma migrate deploy

# 打开Prisma Studio
npx prisma studio
```

### 构建生产版本

```bash
# 后端
cd backend
npm run build

# 前端
cd frontend
npm run build
```

### Docker命令

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]
```

## 🌟 未来计划

- [ ] 云端项目保存
- [ ] 批量图片处理
- [ ] 更多色板品牌支持（IKEA、Artkal等）
- [ ] 社区模板分享
- [ ] 移动端适配
- [ ] 3D预览效果
- [ ] 导出为BMP格式
- [ ] 打印优化模式

## 🐛 问题反馈

如有问题或建议，请提交 [Issue](https://github.com/your-repo/issues)。

## 📄 许可证

[MIT License](./LICENSE)

## 👥 贡献

欢迎贡献代码！请先Fork项目，创建特性分支，提交PR。

## 🙏 致谢

- [Perler Beads](https://www.perler.com/) - 拼豆珠品牌
- [Hama Beads](https://www.hama.dk/) - 拼豆珠品牌
- 所有开源项目贡献者

---

Made with ❤️ by [Your Name]
