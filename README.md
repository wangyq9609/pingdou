# 拼豆图片转图纸工具

一个功能完整的拼豆图片转图纸Web应用，支持用户认证、兑换码激活、图片处理、网格渲染和导出功能。

## 功能特性

### 用户系统
- ✅ 用户注册/登录
- ✅ JWT认证 + Refresh Token
- ✅ 兑换码激活系统
- ✅ 限时使用权（30/90/365天）
- ✅ 个人中心管理

### 图像处理
- ✅ 图片上传（支持拖拽）
- ✅ 自定义网格尺寸
- ✅ 智能颜色量化
- ✅ 精准颜色匹配（CIEDE2000算法）
- ✅ 实时Canvas预览

### 色板支持
- ✅ Perler 色板（16种颜色）
- ✅ Hama 色板（16种颜色）
- ✅ 自定义颜色选择
- ✅ 颜色数量控制

### 导出功能
- ✅ PNG图纸导出
- ✅ PDF导出（含材料清单）
- ✅ 自动生成购买清单
- ✅ 颜色统计分析

## 技术栈

### 后端
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- JWT认证
- bcrypt加密

### 前端
- React 18 + TypeScript
- Vite
- Ant Design
- Zustand（状态管理）
- React Router
- Konva.js（Canvas）
- jsPDF（PDF生成）
- Tailwind CSS

## 快速开始

### 环境要求
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### 安装和运行

#### 1. 后端设置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库等配置

# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

后端服务将在 http://localhost:4000 运行

#### 2. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量（可选）
cp .env.example .env

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:5173 运行

### 生成兑换码

使用管理员账号调用API生成兑换码：

```bash
# 先注册一个管理员账号，然后在数据库中将role改为admin

# 使用管理员token调用生成接口
curl -X POST http://localhost:4000/api/admin/redemption/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "codeType": "trial_30",
    "quantity": 10,
    "batchId": "BATCH_001"
  }'
```

## 项目结构

```
pingdou/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── db/             # 数据库连接
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── server.ts       # 入口文件
│   ├── prisma/
│   │   └── schema.prisma   # 数据库Schema
│   └── package.json
│
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── data/           # 静态数据（色板）
│   │   ├── pages/          # 页面
│   │   ├── services/       # API服务
│   │   ├── store/          # 状态管理
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── App.tsx         # 主应用
│   └── package.json
│
└── README.md
```

## 数据库设计

### 核心表
- `users` - 用户表
- `redemption_codes` - 兑换码表
- `user_activations` - 用户激活记录
- `user_projects` - 用户作品（未实现）
- `redemption_logs` - 兑换日志（审计）

### 兑换码类型
- `trial_30` - 体验版（30天）
- `standard_90` - 标准版（90天）
- `premium_365` - 高级版（365天）

## API文档

### 认证接口
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/logout` - 退出登录
- `POST /api/auth/refresh-token` - 刷新令牌

### 兑换码接口
- `POST /api/redemption/redeem` - 兑换激活码
- `GET /api/redemption/my-activations` - 查询激活记录
- `GET /api/redemption/check-status` - 检查激活状态

### 管理员接口
- `POST /api/admin/redemption/generate` - 生成兑换码
- `GET /api/admin/redemption/list` - 查询兑换码列表
- `POST /api/admin/redemption/revoke/:id` - 撤销兑换码

## Docker部署

```bash
# 构建和启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 安全特性

- bcrypt密码加密（cost factor: 12）
- JWT访问令牌（2小时过期）
- Refresh Token（7天过期）
- API限流保护
- 兑换码单次使用
- SQL注入防护（Prisma ORM）
- XSS防护
- CORS配置


## 未来计划

- [ ] 云端项目保存
- [ ] 批量图片处理
- [ ] 更多色板品牌支持
- [ ] 社区模板分享
- [ ] 移动端适配
- [ ] 3D预览效果

## 联系方式

如有问题或建议，请提交Issue。
